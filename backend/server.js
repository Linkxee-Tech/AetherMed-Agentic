const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // Must run BEFORE importing orchestrator which triggers Gemini initialisation

const { v4: uuidv4 } = require('uuid');
const { orchestrate } = require('./orchestrator');

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

app.use(cors());
app.use(express.json());

// Mock session store
const sessions = new Map();

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

        sessions.set(sessionId, result);

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
 * @desc Retreive session results
 */
app.get('/api/v1/session/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json(session);
});

app.listen(PORT, () => {
    console.log(`AetherMed Agentic Backend running on port ${PORT}`);
});
