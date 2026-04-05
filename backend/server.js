const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') }); // Must run BEFORE importing orchestrator which triggers OpenAI initialisation

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { orchestrate } = require('./orchestrator');
const { visualSymptomAgent } = require('./agents/visualSymptomAgent');
const { medicalDocumentAgent } = require('./agents/medicalDocumentAgent');
const Session = require('./models/Session');
const { getTranslationMode, shouldUseOfflineAgents } = require('./tools/runtime');
const { buildMultimodalSummary, buildUploadAssistantGuidance, classifyMultimodalInput, generateImageContextDraft } = require('./tools/multimodalSummary');
const { sanitizeTextField, sanitizeUrgency, validateImageDataUrl } = require('./tools/requestValidation');

const app = express();
const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

function buildAllowedOrigins(rawOrigins) {
    const seeds = rawOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);
    const expanded = new Set(seeds);

    seeds.forEach((origin) => {
        try {
            const parsed = new URL(origin);
            const isLocalhost = parsed.hostname === 'localhost';
            const isLoopback = parsed.hostname === '127.0.0.1';

            if (isLocalhost || isLoopback) {
                const counterpart = isLocalhost ? '127.0.0.1' : 'localhost';
                expanded.add(`${parsed.protocol}//${counterpart}${parsed.port ? `:${parsed.port}` : ''}`);
            }
        } catch {
            // Ignore invalid origin values so the app can continue with the valid entries.
        }
    });

    return Array.from(expanded);
}

const allowedOrigins = buildAllowedOrigins(process.env.ALLOWED_ORIGINS || '');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));

async function connectDatabase() {
    if (!process.env.MONGODB_URI) {
        console.warn('[DATABASE] MONGODB_URI not set. Running without persistence.');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[DATABASE] MongoDB Atlas Connected');
    } catch (err) {
        console.error('[DATABASE] Connection Error:', err);
    }
}

connectDatabase();

async function persistSession(sessionId, symptoms, data, trace) {
    if (mongoose.connection.readyState !== 1) {
        return;
    }

    const newSession = new Session({
        sessionId,
        symptoms: String(symptoms || 'AetherMed session').substring(0, 100),
        data,
        trace
    });
    await newSession.save();
}

async function executeTextFlow({ symptoms, ageRange, urgency, notes, sessionId }) {
    const result = await orchestrate({ symptoms, ageRange, urgency, notes, sessionId });
    result.data.multimodalSummary = buildMultimodalSummary('text', result.data);
    await persistSession(sessionId, symptoms, result.data, result.trace);

    return {
        success: true,
        sessionId,
        ...result
    };
}

async function executeVisualFlow({ imageDataUrl, notes, languageHint, sessionId }) {
    const result = await visualSymptomAgent({ imageDataUrl, notes, languageHint, sessionId });
    result.multimodalSummary = buildMultimodalSummary('visual', result);

    const trace = [
        {
            agent: 'Visual Assessment',
            mode: shouldUseOfflineAgents() ? 'offline' : 'openai',
            timestamp: new Date().toISOString(),
            insight: `Image reviewed with ${result.safetyLevel.toLowerCase()} safety guidance and ${result.imageQuality} image quality.`
        }
    ];

    await persistSession(sessionId, notes || 'Visual symptom image', result, trace);

    return {
        success: true,
        sessionId,
        data: result,
        trace,
        meta: {
            analysisType: result.reviewMode === 'medical_imaging' ? 'medical_imaging' : 'visual',
            agentMode: shouldUseOfflineAgents() ? 'offline' : 'openai'
        }
    };
}

async function executeDocumentFlow({ imageDataUrl, documentText, notes, languageHint, sessionId }) {
    const result = await medicalDocumentAgent({
        imageDataUrl,
        documentText,
        notes,
        languageHint,
        sessionId
    });
    result.multimodalSummary = buildMultimodalSummary('document', result);

    const trace = [
        {
            agent: 'Medical Document Assistant',
            mode: shouldUseOfflineAgents() ? 'offline' : 'openai',
            timestamp: new Date().toISOString(),
            insight: `Document reviewed with ${result.readability} readability as a ${result.documentType.toLowerCase()}.`
        }
    ];

    await persistSession(sessionId, documentText || notes || 'Medical document review', result, trace);

    return {
        success: true,
        sessionId,
        data: result,
        trace,
        meta: {
            analysisType: 'document',
            agentMode: shouldUseOfflineAgents() ? 'offline' : 'openai'
        }
    };
}

app.get('/api/v1/health', (req, res) => {
    return res.json({
        success: true,
        status: 'ok',
        agentMode: shouldUseOfflineAgents() ? 'offline' : 'openai',
        translationMode: getTranslationMode(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

/**
 * @route POST /api/v1/analyze
 * @desc Main entry point for the agentic healthcare pipeline
 */
app.post('/api/v1/analyze', async (req, res) => {
    const sessionId = uuidv4();

    try {
        const symptoms = sanitizeTextField(req.body?.symptoms, {
            fieldName: 'Symptoms',
            required: true,
            maxLength: 1500
        });
        const ageRange = sanitizeTextField(req.body?.ageRange, {
            fieldName: 'Age range',
            maxLength: 40
        }) || '18-35';
        const urgency = sanitizeUrgency(req.body?.urgency);
        const notes = sanitizeTextField(req.body?.notes, {
            fieldName: 'Notes',
            maxLength: 1500
        });

        console.log(`[ORCHESTRATOR] Initializing session ${sessionId} for symptoms: ${symptoms}`);
        return res.json(await executeTextFlow({ symptoms, ageRange, urgency, notes, sessionId }));
    } catch (error) {
        console.error('[ORCHESTRATOR ERROR]', error);
        const status = /required|must be|too long|between 1 and 5|control text/i.test(error.message) ? 400 : 500;
        return res.status(status).json({ error: status === 400 ? error.message : 'Failed to process request.' });
    }
});

/**
 * @route POST /api/v1/analyze-visual
 * @desc Visual symptom review for uploaded or camera-captured images
 */
app.post('/api/v1/analyze-visual', async (req, res) => {
    const sessionId = uuidv4();

    try {
        const imageDataUrl = validateImageDataUrl(req.body?.imageDataUrl, {
            required: true,
            fieldName: 'Uploaded image'
        });
        const notes = sanitizeTextField(req.body?.notes, {
            fieldName: 'Context',
            maxLength: 1200
        });
        const languageHint = sanitizeTextField(req.body?.languageHint, {
            fieldName: 'Language hint',
            maxLength: 80
        });

        console.log(`[VISUAL] Initializing visual session ${sessionId}`);
        return res.json(await executeVisualFlow({ imageDataUrl, notes, languageHint, sessionId }));
    } catch (error) {
        console.error('[VISUAL ANALYSIS ERROR]', error);
        const status = /required|must be|too large|too long|control text/i.test(error.message) ? 400 : 500;
        return res.status(status).json({ error: status === 400 ? error.message : 'Failed to process visual symptom request.' });
    }
});

/**
 * @route POST /api/v1/analyze-document
 * @desc Medical document explanation for uploaded screenshots/scans or pasted report text
 */
app.post('/api/v1/analyze-document', async (req, res) => {
    const sessionId = uuidv4();

    try {
        const imageDataUrl = validateImageDataUrl(req.body?.imageDataUrl, {
            fieldName: 'Document image'
        });
        const documentText = sanitizeTextField(req.body?.documentText, {
            fieldName: 'Document text',
            maxLength: 12000
        });
        const notes = sanitizeTextField(req.body?.notes, {
            fieldName: 'Document context',
            maxLength: 1500
        });
        const languageHint = sanitizeTextField(req.body?.languageHint, {
            fieldName: 'Language hint',
            maxLength: 80
        });

        if (!imageDataUrl && !documentText) {
            return res.status(400).json({ error: 'Upload a document image or paste document text to continue.' });
        }

        console.log(`[DOCUMENT] Initializing document session ${sessionId}`);
        return res.json(await executeDocumentFlow({ imageDataUrl, documentText, notes, languageHint, sessionId }));
    } catch (error) {
        console.error('[DOCUMENT ANALYSIS ERROR]', error);
        const status = /required|must be|too large|too long|control text/i.test(error.message) ? 400 : 500;
        return res.status(status).json({ error: status === 400 ? error.message : 'Failed to process medical document request.' });
    }
});

/**
 * @route POST /api/v1/upload-assistant
 * @desc Classify an uploaded file/image and return the minimum extra context needed before routing
 */
app.post('/api/v1/upload-assistant', async (req, res) => {
    try {
        const imageDataUrl = validateImageDataUrl(req.body?.imageDataUrl, {
            fieldName: 'Uploaded file'
        });
        const documentText = sanitizeTextField(req.body?.documentText, {
            fieldName: 'Document text',
            maxLength: 12000
        });
        const notes = sanitizeTextField(req.body?.notes, {
            fieldName: 'Upload context',
            maxLength: 1200
        });
        const languageHint = sanitizeTextField(req.body?.languageHint, {
            fieldName: 'Language hint',
            maxLength: 80
        });
        const symptoms = sanitizeTextField(req.body?.symptoms, {
            fieldName: 'Symptoms',
            maxLength: 1500
        });

        if (!imageDataUrl && !documentText && !symptoms) {
            return res.status(400).json({ error: 'Upload an image or provide text so AetherMed can identify the input type.' });
        }

        const classification = await classifyMultimodalInput({
            imageDataUrl,
            documentText,
            notes,
            languageHint,
            symptoms
        });
        const guidance = buildUploadAssistantGuidance(classification);
        const autoContext = await generateImageContextDraft({
            imageDataUrl,
            documentText,
            notes,
            languageHint,
            sourceLabel: 'uploaded image'
        }, classification);

        return res.json({
            success: true,
            data: {
                classification,
                guidance,
                autoContext
            }
        });
    } catch (error) {
        console.error('[UPLOAD ASSISTANT ERROR]', error);
        const status = /required|must be|too large|too long|control text/i.test(error.message) ? 400 : 500;
        return res.status(status).json({ error: status === 400 ? error.message : 'Failed to inspect the uploaded input.' });
    }
});

/**
 * @route POST /api/v1/analyze-input
 * @desc Unified multimodal intake that detects the input type and routes to the correct internal flow
 */
app.post('/api/v1/analyze-input', async (req, res) => {
    const sessionId = uuidv4();

    try {
        const symptoms = sanitizeTextField(req.body?.symptoms, {
            fieldName: 'Symptoms',
            maxLength: 1500
        });
        const ageRange = sanitizeTextField(req.body?.ageRange, {
            fieldName: 'Age range',
            maxLength: 40
        }) || '18-35';
        const urgency = sanitizeUrgency(req.body?.urgency);
        const notes = sanitizeTextField(req.body?.notes, {
            fieldName: 'Notes',
            maxLength: 1500
        });
        const imageDataUrl = validateImageDataUrl(req.body?.imageDataUrl, {
            fieldName: 'Uploaded image'
        });
        const documentText = sanitizeTextField(req.body?.documentText, {
            fieldName: 'Document text',
            maxLength: 12000
        });
        const languageHint = sanitizeTextField(req.body?.languageHint, {
            fieldName: 'Language hint',
            maxLength: 80
        });

        const classification = await classifyMultimodalInput({
            symptoms,
            imageDataUrl,
            documentText,
            notes,
            languageHint
        });

        console.log(`[MULTIMODAL] Session ${sessionId} routed as ${classification.code}`);

        let responsePayload;

        if (classification.kind === 'text') {
            if (!symptoms) {
                return res.status(400).json({ error: 'Symptoms are required for text symptom analysis.' });
            }

            responsePayload = await executeTextFlow({ symptoms, ageRange, urgency, notes, sessionId });
        } else if (classification.kind === 'document') {
            const hasImage = typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/');
            const hasText = typeof documentText === 'string' && documentText.trim().length > 0;

            if (!hasImage && !hasText) {
                return res.status(400).json({ error: 'Upload a document image or paste document text to continue.' });
            }

            responsePayload = await executeDocumentFlow({ imageDataUrl, documentText, notes, languageHint, sessionId });
        } else if (classification.kind === 'visual') {
            if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
                return res.status(400).json({ error: 'A valid uploaded image is required for image analysis.' });
            }

            responsePayload = await executeVisualFlow({ imageDataUrl, notes, languageHint, sessionId });
        } else {
            return res.status(400).json({
                error: 'AetherMed could not determine the input type. Provide symptom text, a visible body image, a medical report, or a scan image.'
            });
        }

        return res.json({
            ...responsePayload,
            meta: {
                ...responsePayload.meta,
                routedInputType: classification.label,
                routedInputCode: classification.code,
                routingReason: classification.reason
            }
        });
    } catch (error) {
        console.error('[MULTIMODAL ANALYSIS ERROR]', error);
        const status = /required|must be|too large|too long|control text|could not determine/i.test(error.message) ? 400 : 500;
        return res.status(status).json({ error: status === 400 ? error.message : 'Failed to process multimodal input.' });
    }
});

/**
 * @route GET /api/v1/session/:id
 * @desc Retrieve session results from MongoDB
 */
app.get('/api/v1/session/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Session history unavailable because the database is not connected.' });
        }

        const session = await Session.findOne({ sessionId: req.params.id });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        return res.json({
            success: true,
            sessionId: session.sessionId,
            data: session.data,
            trace: session.trace
        });
    } catch (err) {
        return res.status(500).json({ error: 'Database retrieval error.' });
    }
});

app.listen(PORT, () => {
    console.log(`AetherMed Agentic Backend running on port ${PORT}`);
});
