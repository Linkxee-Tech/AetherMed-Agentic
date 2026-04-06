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
const { executePromptOpinionTask } = require('./agents/promptOpinionAgent');

const app = express();
const PORT = process.env.PORT || 5000;
const A2A_PROTOCOL_VERSION = '0.3.0';
const AGENT_CARD_PATH = '/.well-known/agent-card.json';
const a2aTaskStore = new Map();

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

function collectApiKeys() {
    const inlineKeys = String(process.env.PROMPT_OPINION_API_KEYS || '')
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean);

    return new Set(
        [
            process.env.PROMPT_OPINION_API_KEY,
            process.env.API_KEY_PRIMARY,
            process.env.API_KEY_SECONDARY,
            ...inlineKeys
        ].filter(Boolean)
    );
}

function getPublicAgentUrl() {
    const configuredUrl = process.env.PROMPT_OPINION_AGENT_URL
        || process.env.PUBLIC_BACKEND_URL
        || process.env.RENDER_EXTERNAL_URL;
    const renderHostname = process.env.RENDER_EXTERNAL_HOSTNAME;
    const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;

    if (configuredUrl) {
        return configuredUrl.replace(/\/+$/, '');
    }

    if (renderHostname) {
        return `https://${renderHostname}`;
    }

    if (railwayPublicDomain) {
        return `https://${railwayPublicDomain}`;
    }

    return `http://localhost:${PORT}`;
}

function buildAgentSkills(requireApiKey) {
    const skillSecurity = requireApiKey ? [{ apiKey: [] }] : undefined;

    return [
        {
            id: 'symptom-triage',
            name: 'Symptom Triage',
            description: 'Analyzes written symptom descriptions and returns safety-first guidance, urgency cues, and next-step recommendations without claiming a diagnosis.',
            tags: ['healthcare', 'symptoms', 'triage', 'clinical-guidance', 'safety'],
            examples: [
                'I have fever, sore throat, and body aches for two days.',
                'Please triage chest tightness with sweating and dizziness.'
            ],
            inputModes: ['text/plain', 'application/json'],
            outputModes: ['application/json', 'text/plain'],
            ...(skillSecurity ? { security: skillSecurity } : {})
        },
        {
            id: 'visible-symptom-review',
            name: 'Visible Symptom Review',
            description: 'Reviews uploaded photos of visible body concerns such as rash, swelling, discoloration, or wounds and returns non-diagnostic visual guidance with safety advice.',
            tags: ['healthcare', 'image-review', 'rash', 'wound', 'visible-symptoms'],
            examples: [
                'Review this arm rash and tell me what warning signs to watch for.',
                'Assess a swelling photo and suggest safe next steps.'
            ],
            inputModes: ['application/json', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'],
            outputModes: ['application/json', 'text/plain'],
            ...(skillSecurity ? { security: skillSecurity } : {})
        },
        {
            id: 'medical-document-explainer',
            name: 'Medical Document Explainer',
            description: 'Explains clinic notes, prescriptions, discharge summaries, lab screenshots, and other medical documents in simpler language without overriding the original report.',
            tags: ['healthcare', 'medical-document', 'lab-report', 'prescription', 'explanation'],
            examples: [
                'Explain this lab report in simple language.',
                'Summarize the important parts of this discharge note.'
            ],
            inputModes: ['application/json', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'],
            outputModes: ['application/json', 'text/plain'],
            ...(skillSecurity ? { security: skillSecurity } : {})
        },
        {
            id: 'medical-imaging-safety-guidance',
            name: 'Medical Imaging Safety Guidance',
            description: 'Handles X-ray, CT, MRI, ultrasound, and similar scan uploads with non-diagnostic safety guidance and referral messaging when specialist review is needed.',
            tags: ['healthcare', 'medical-imaging', 'xray', 'scan', 'safety-guidance'],
            examples: [
                'This looks like an X-ray. Provide a safe, non-diagnostic explanation.',
                'Review this scan upload and tell me what kind of follow-up is usually appropriate.'
            ],
            inputModes: ['application/json', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'],
            outputModes: ['application/json', 'text/plain'],
            ...(skillSecurity ? { security: skillSecurity } : {})
        },
        {
            id: 'multilingual-health-guidance',
            name: 'Multilingual Health Guidance',
            description: 'Accepts multilingual symptom or document context and returns guidance using the system translation flow before final response formatting.',
            tags: ['healthcare', 'multilingual', 'translation', 'patient-support'],
            examples: [
                'Tengo dolor de cabeza y fiebre desde ayer.',
                'Translate and explain these symptoms from French into English guidance.'
            ],
            inputModes: ['text/plain', 'application/json'],
            outputModes: ['application/json', 'text/plain'],
            ...(skillSecurity ? { security: skillSecurity } : {})
        }
    ];
}

function buildAgentCard() {
    const requireApiKey = promptOpinionApiKeys.size > 0;
    const securitySchemes = requireApiKey
        ? {
            apiKey: {
                type: 'apiKey',
                name: 'X-API-Key',
                in: 'header',
                description: 'API key required to access this agent.'
            }
        }
        : undefined;

    return {
        name: process.env.PROMPT_OPINION_AGENT_NAME || 'aethermed_master_agent',
        description: process.env.PROMPT_OPINION_AGENT_DESCRIPTION || 'AetherMed multimodal healthcare guidance agent for Prompt Opinion.',
        url: getPublicAgentUrl(),
        version: process.env.PROMPT_OPINION_AGENT_VERSION || '1.0.0',
        protocolVersion: A2A_PROTOCOL_VERSION,
        preferredTransport: 'JSONRPC',
        defaultInputModes: ['text/plain', 'application/json'],
        defaultOutputModes: ['application/json', 'text/plain'],
        capabilities: {
            streaming: false,
            pushNotifications: false,
            stateTransitionHistory: true,
            extensions: []
        },
        skills: buildAgentSkills(requireApiKey),
        ...(securitySchemes ? { securitySchemes, security: [{ apiKey: [] }] } : {})
    };
}

function getRequestApiKey(req) {
    const rawKey = req.headers['x-api-key'];
    return Array.isArray(rawKey) ? rawKey[0] : rawKey;
}

function enforceA2aApiKey(req, res) {
    if (promptOpinionApiKeys.size === 0) {
        return true;
    }

    const apiKey = getRequestApiKey(req);

    if (!apiKey) {
        res.status(401).json({
            jsonrpc: '2.0',
            id: req.body?.id ?? null,
            error: {
                code: -32001,
                message: 'Unauthorized',
                data: { detail: 'X-API-Key header is required.' }
            }
        });
        return false;
    }

    if (!promptOpinionApiKeys.has(apiKey)) {
        res.status(403).json({
            jsonrpc: '2.0',
            id: req.body?.id ?? null,
            error: {
                code: -32003,
                message: 'Forbidden',
                data: { detail: 'Invalid X-API-Key header.' }
            }
        });
        return false;
    }

    return true;
}

function buildJsonRpcError(id, code, message, data) {
    return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: {
            code,
            message,
            ...(data ? { data } : {})
        }
    };
}

function extractUserQueryFromA2aMessage(message) {
    if (!message || typeof message !== 'object') {
        return '';
    }

    const parts = Array.isArray(message.parts) ? message.parts : [];
    const textParts = parts
        .filter((part) => part && typeof part === 'object' && part.kind === 'text' && typeof part.text === 'string')
        .map((part) => part.text.trim())
        .filter(Boolean);

    if (textParts.length > 0) {
        return textParts.join('\n');
    }

    const dataParts = parts
        .filter((part) => part && typeof part === 'object' && part.kind === 'data' && part.data && typeof part.data === 'object')
        .map((part) => part.data.user_query)
        .filter((value) => typeof value === 'string' && value.trim().length > 0);

    return dataParts[0] || '';
}

function extractTaskNameFromA2aRequest(body, partData = {}) {
    const taskCandidates = [
        body?.params?.metadata?.task,
        body?.params?.metadata?.taskName,
        body?.params?.message?.metadata?.task,
        body?.params?.message?.metadata?.taskName,
        partData?.task,
        partData?.taskName
    ];

    const taskName = taskCandidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    return taskName ? taskName.trim() : '';
}

function decodeBase64Text(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return '';
    }

    try {
        return Buffer.from(value, 'base64').toString('utf8');
    } catch {
        return '';
    }
}

function extractA2aPartData(message) {
    const result = {};
    const parts = Array.isArray(message?.parts) ? message.parts : [];

    for (const part of parts) {
        if (!part || typeof part !== 'object') {
            continue;
        }

        if (part.kind === 'data' && part.data && typeof part.data === 'object' && !Array.isArray(part.data)) {
            Object.assign(result, part.data);
            continue;
        }

        if (part.kind !== 'file' || !part.file || typeof part.file !== 'object') {
            continue;
        }

        const mimeType = typeof part.file.mimeType === 'string' ? part.file.mimeType : '';
        const bytes = typeof part.file.bytes === 'string'
            ? part.file.bytes
            : typeof part.file.data === 'string'
                ? part.file.data
                : '';
        const uri = typeof part.file.uri === 'string' ? part.file.uri : '';

        if (!result.imageDataUrl) {
            if (uri.startsWith('data:image/')) {
                result.imageDataUrl = uri;
            } else if (mimeType.startsWith('image/') && bytes) {
                result.imageDataUrl = `data:${mimeType};base64,${bytes}`;
            }
        }

        if (!result.documentText) {
            if (uri.startsWith('data:text/plain;base64,')) {
                result.documentText = decodeBase64Text(uri.split(',')[1] || '');
            } else if (mimeType.startsWith('text/') && bytes) {
                result.documentText = decodeBase64Text(bytes);
            }
        }
    }

    return result;
}

function normalizeA2aPayload(body) {
    const message = body?.params?.message || {};
    const partData = extractA2aPartData(message);
    const textQuery = extractUserQueryFromA2aMessage(message);

    return {
        taskName: extractTaskNameFromA2aRequest(body, partData),
        userQuery: typeof partData.user_query === 'string' && partData.user_query.trim()
            ? partData.user_query.trim()
            : textQuery,
        symptoms: typeof partData.symptoms === 'string' ? partData.symptoms : textQuery,
        ageRange: partData.ageRange,
        urgency: partData.urgency,
        notes: partData.notes,
        imageDataUrl: partData.imageDataUrl,
        documentText: partData.documentText,
        languageHint: partData.languageHint,
        sessionId: typeof message?.taskId === 'string' && message.taskId.trim() ? message.taskId.trim() : uuidv4()
    };
}

function normalizeTaskName(taskName) {
    return String(taskName || '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
}

function buildA2aTaskResponse({ requestId, taskId, contextId, userMessage, agentText, structuredResult }) {
    const agentMessage = {
        role: 'agent',
        parts: [{ kind: 'text', text: agentText }],
        messageId: uuidv4(),
        taskId,
        contextId
    };

    const task = {
        id: taskId,
        contextId,
        status: {
            state: 'completed',
            timestamp: new Date().toISOString()
        },
        history: [userMessage, agentMessage],
        artifacts: [
            {
                artifactId: uuidv4(),
                name: 'AetherMed Response',
                parts: [
                    {
                        kind: 'text',
                        text: agentText
                    }
                ]
            }
        ],
        kind: 'task',
        metadata: {
            structuredResult
        }
    };

    a2aTaskStore.set(taskId, task);

    return {
        jsonrpc: '2.0',
        id: requestId ?? null,
        result: task
    };
}

async function handlePromptOpinionRequest(taskName, userQuery) {
    if (!userQuery) {
        throw new Error('Missing user query.');
    }

    const structuredResult = await executePromptOpinionTask(taskName, userQuery);
    return {
        structuredResult,
        agentText: JSON.stringify(structuredResult)
    };
}

const allowedOrigins = buildAllowedOrigins(process.env.ALLOWED_ORIGINS || '');
const promptOpinionApiKeys = collectApiKeys();
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
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

async function executeA2aWorkflow(rawInput = {}) {
    const sessionId = rawInput.sessionId || uuidv4();
    const normalizedTask = normalizeTaskName(rawInput.taskName);

    const symptoms = sanitizeTextField(rawInput.symptoms || rawInput.userQuery, {
        fieldName: 'Symptoms',
        maxLength: 1500
    });
    const ageRange = sanitizeTextField(rawInput.ageRange, {
        fieldName: 'Age range',
        maxLength: 40
    }) || '18-35';
    const urgency = sanitizeUrgency(rawInput.urgency);
    const notes = sanitizeTextField(rawInput.notes, {
        fieldName: 'Notes',
        maxLength: 1500
    });
    const imageDataUrl = validateImageDataUrl(rawInput.imageDataUrl, {
        fieldName: 'Uploaded image'
    });
    const documentText = sanitizeTextField(rawInput.documentText, {
        fieldName: 'Document text',
        maxLength: 12000
    });
    const languageHint = sanitizeTextField(rawInput.languageHint, {
        fieldName: 'Language hint',
        maxLength: 80
    });

    const forceVisual = ['visual_symptom_review', 'visible_symptom_review', 'visual_review', 'image_review'].includes(normalizedTask);
    const forceDocument = ['medical_document_explanation', 'document_explanation', 'document_review', 'medical_imaging_safety_guidance', 'medical_document_explainer'].includes(normalizedTask);
    const forceText = ['symptom_analysis', 'symptom_triage', 'triage', 'multilingual_health_guidance'].includes(normalizedTask);
    const useAutoRouting = !normalizedTask || normalizedTask === 'analyze_input' || normalizedTask === 'multimodal_intake';

    if (forceVisual) {
        if (!imageDataUrl) {
            throw new Error('Uploaded image is required for visible symptom review.');
        }

        return executeVisualFlow({ imageDataUrl, notes, languageHint, sessionId });
    }

    if (forceDocument) {
        if (!imageDataUrl && !documentText) {
            throw new Error('Upload a document image or provide document text for document explanation.');
        }

        return executeDocumentFlow({ imageDataUrl, documentText, notes, languageHint, sessionId });
    }

    if (forceText) {
        if (!symptoms) {
            throw new Error('Symptoms are required for symptom analysis.');
        }

        return executeTextFlow({ symptoms, ageRange, urgency, notes, sessionId });
    }

    if (useAutoRouting || imageDataUrl || documentText) {
        const classification = await classifyMultimodalInput({
            symptoms,
            imageDataUrl,
            documentText,
            notes,
            languageHint
        });

        if (classification.kind === 'document') {
            if (!imageDataUrl && !documentText) {
                throw new Error('Upload a document image or provide document text for document explanation.');
            }

            return executeDocumentFlow({ imageDataUrl, documentText, notes, languageHint, sessionId });
        }

        if (classification.kind === 'visual') {
            if (!imageDataUrl) {
                throw new Error('Uploaded image is required for visible symptom review.');
            }

            return executeVisualFlow({ imageDataUrl, notes, languageHint, sessionId });
        }

        if (!symptoms) {
            throw new Error('Symptoms are required for symptom analysis.');
        }

        return executeTextFlow({ symptoms, ageRange, urgency, notes, sessionId });
    }

    if (!symptoms) {
        throw new Error('Symptoms are required for symptom analysis.');
    }

    return executeTextFlow({ symptoms, ageRange, urgency, notes, sessionId });
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

app.get("/health", (req, res) => {
    res.send("OK");
});

app.get(AGENT_CARD_PATH, (req, res) => {
    res.json(buildAgentCard());
});

app.get("/", (req, res) => {
    res.json({
        status: 'ok',
        name: 'AetherMed Prompt Opinion A2A endpoint',
        agentCard: `${getPublicAgentUrl()}${AGENT_CARD_PATH}`,
        info: 'Send A2A JSON-RPC requests to POST / using method message/send.'
    });
});

app.post("/", async (req, res) => {
    if (!enforceA2aApiKey(req, res)) {
        return;
    }

    const requestId = req.body?.id ?? null;
    const method = req.body?.method;

    try {
        if (req.body?.jsonrpc !== '2.0') {
            return res.status(400).json(buildJsonRpcError(requestId, -32600, 'Invalid Request', {
                detail: 'jsonrpc must be "2.0".'
            }));
        }

        if (method === 'message/send') {
            const userMessage = req.body?.params?.message;
            const a2aPayload = normalizeA2aPayload(req.body);
            const userQuery = a2aPayload.userQuery
                || a2aPayload.symptoms
                || a2aPayload.documentText
                || a2aPayload.notes;

            if (!userQuery && !a2aPayload.imageDataUrl) {
                return res.status(400).json(buildJsonRpcError(requestId, -32602, 'Invalid params', {
                    detail: 'Expected text, structured data, or an image file in params.message.parts.'
                }));
            }

            const taskId = typeof userMessage?.taskId === 'string' && userMessage.taskId.trim()
                ? userMessage.taskId.trim()
                : uuidv4();
            const contextId = typeof userMessage?.contextId === 'string' && userMessage.contextId.trim()
                ? userMessage.contextId.trim()
                : uuidv4();
            const messageId = typeof userMessage?.messageId === 'string' && userMessage.messageId.trim()
                ? userMessage.messageId.trim()
                : uuidv4();

            a2aPayload.sessionId = taskId;

            console.log(`[PROMPT OPINION A2A] Processing task: ${a2aPayload.taskName} for query: ${userQuery || '[image-or-document-input]'}`);
            const structuredResult = await executeA2aWorkflow(a2aPayload);
            const agentText = JSON.stringify(structuredResult);

            return res.json(buildA2aTaskResponse({
                requestId,
                taskId,
                contextId,
                userMessage: {
                    role: userMessage?.role || 'user',
                    parts: userQuery
                        ? [{ kind: 'text', text: userQuery }]
                        : [{ kind: 'text', text: `Task ${a2aPayload.taskName || 'analyze_input'} received non-text clinical input.` }],
                    messageId,
                    taskId,
                    contextId
                },
                agentText,
                structuredResult
            }));
        }

        if (method === 'tasks/get') {
            const taskId = req.body?.params?.id;

            if (!taskId || typeof taskId !== 'string') {
                return res.status(400).json(buildJsonRpcError(requestId, -32602, 'Invalid params', {
                    detail: 'tasks/get expects params.id.'
                }));
            }

            const task = a2aTaskStore.get(taskId);
            if (!task) {
                return res.status(404).json(buildJsonRpcError(requestId, -32004, 'Task not found', {
                    detail: `No task found for id ${taskId}.`
                }));
            }

            return res.json({
                jsonrpc: '2.0',
                id: requestId,
                result: task
            });
        }

        if (method === 'tasks/cancel') {
            const taskId = req.body?.params?.id;

            if (!taskId || typeof taskId !== 'string') {
                return res.status(400).json(buildJsonRpcError(requestId, -32602, 'Invalid params', {
                    detail: 'tasks/cancel expects params.id.'
                }));
            }

            const task = a2aTaskStore.get(taskId);
            if (!task) {
                return res.status(404).json(buildJsonRpcError(requestId, -32004, 'Task not found', {
                    detail: `No task found for id ${taskId}.`
                }));
            }

            if (task.status?.state !== 'completed') {
                task.status = {
                    state: 'canceled',
                    timestamp: new Date().toISOString()
                };
            }

            return res.json({
                jsonrpc: '2.0',
                id: requestId,
                result: task
            });
        }

        return res.status(400).json(buildJsonRpcError(requestId, -32601, 'Method not found', {
            detail: `Unsupported A2A method: ${method}.`
        }));
    } catch (error) {
        console.error('[PROMPT OPINION A2A ERROR] Full Error:', error.stack || error);
        return res.status(500).json(buildJsonRpcError(requestId, -32603, 'Internal error', {
            detail: error.message
        }));
    }
});

/**
 * @route POST /agent
 * @route GET /agent
 * @desc Legacy compatibility endpoint for older Prompt Opinion request shapes
 */
app.post("/agent", async (req, res) => {
    try {
        const { task, input } = req.body;
        const userQuery = input?.user_query || "";

        if (!userQuery) {
            console.error('[PROMPT OPINION ERROR] Missing user_query in body:', JSON.stringify(req.body));
            return res.status(400).json({ error: "Missing user_query in input." });
        }

        console.log(`[PROMPT OPINION] Processing task: ${task} for query: ${userQuery}`);
        const { structuredResult: result } = await handlePromptOpinionRequest(task || 'symptom_analysis', userQuery);

        return res.json({
            status: "success",
            task: task || "symptom_analysis",
            result: result,
            confidence: 0.85
        });
    } catch (error) {
        if (error.response) {
            console.error('[PROMPT OPINION ERROR] Response Data:', error.response.data);
            console.error('[PROMPT OPINION ERROR] Status:', error.response.status);
        }
        console.error('[PROMPT OPINION ERROR] Full Error:', error.stack || error);
        return res.status(500).json({ 
            status: "error", 
            message: "Failed to process agent request.", 
            details: error.message,
            stack: error.stack,
            responseData: error.response?.data
        });
    }
});

app.get("/agent", (req, res) => {
    res.json({
        result: "Agent working",
        status: "ok",
        info: "Submit a POST request with a task and user_query to interact with the AetherMed Master Agent, or use POST / for A2A JSON-RPC."
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
