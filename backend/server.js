const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') }); // Must run BEFORE importing orchestrator which triggers OpenAI initialisation

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { orchestrate } = require('./orchestrator');
const Session = require('./models/Session');
const { getTranslationMode, shouldUseOfflineAgents } = require('./tools/runtime');

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

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(o => o);
app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

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
    const { symptoms, ageRange, urgency, notes } = req.body;
    const sessionId = uuidv4();

    if (!symptoms) {
        return res.status(400).json({ error: 'Symptoms are required.' });
    }

    try {
        console.log(`[ORCHESTRATOR] Initializing session ${sessionId} for symptoms: ${symptoms}`);

        const result = await orchestrate({ symptoms, ageRange, urgency, notes, sessionId });

        if (mongoose.connection.readyState === 1) {
            const newSession = new Session({
                sessionId,
                symptoms: symptoms.substring(0, 100),
                data: result.data,
                trace: result.trace
            });
            await newSession.save();
        }

        return res.json({
            success: true,
            sessionId,
            ...result
        });
    } catch (error) {
        console.error('[ORCHESTRATOR ERROR]', error);
        return res.status(500).json({ error: 'Failed to process request.' });
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
