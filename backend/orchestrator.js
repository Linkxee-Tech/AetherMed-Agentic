const { translationAgent } = require('./agents/translationAgent');
const { triageAgent } = require('./agents/triageAgent');
const { researchAgent } = require('./agents/researchAgent');
const { adviceAgent } = require('./agents/adviceAgent');
const { referralAgent } = require('./agents/referralAgent');
const { responseAgent } = require('./agents/responseAgent');
const { getAgentMode, shouldUseOfflineAgents } = require('./tools/runtime');

/**
 * orchestrate - Coordinates the specialized agents to process symptoms
 * @param {Object} input - symptoms, ageRange, urgency, notes
 */
async function orchestrate(input) {
    const { sessionId } = input;
    const trace = [];
    const effectiveAgentMode = shouldUseOfflineAgents() ? 'offline' : getAgentMode();
    
    // Shared Context Buffer
    const context = {
        input: input,
        translation: null,
        triage: null,
        research: null,
        advice: null,
        referral: null,
        response: null
    };

    try {
        // 0. Translation
        context.translation = await translationAgent(context);
        trace.push({
            agent: 'Translation',
            mode: effectiveAgentMode,
            timestamp: new Date().toISOString(),
            insight: `Detected language: ${context.translation.detectedLanguage}. Normalizing input to English.`
        });

        // 1. Triage
        context.triage = await triageAgent(context);
        trace.push({
            agent: 'Triage',
            mode: effectiveAgentMode,
            timestamp: new Date().toISOString(),
            insight: `${context.triage.urgency} urgency - ${context.triage.reason}`
        });

        // 2. Research
        context.research = await researchAgent(context);
        trace.push({
            agent: 'Research',
            mode: effectiveAgentMode,
            timestamp: new Date().toISOString(),
            insight: `Primary findings: ${context.research.extractedSymptoms.join(', ')}. Knowledge lookup complete.`
        });

        // 3. Advice
        context.advice = await adviceAgent(context);
        trace.push({
            agent: 'Advice',
            mode: effectiveAgentMode,
            timestamp: new Date().toISOString(),
            insight: `Calculating clinical safety. Total risk score: ${context.advice.riskScore}/100.`
        });

        // 4. Referral
        context.referral = await referralAgent(context);
        trace.push({
            agent: 'Referral',
            mode: effectiveAgentMode,
            timestamp: new Date().toISOString(),
            insight: `Proposed care path: ${context.referral.referral.type} at ${context.referral.referral.location}.`
        });

        // 5. Response
        const finalOutput = await responseAgent(context);
        trace.push({
            agent: 'Response',
            mode: effectiveAgentMode,
            timestamp: new Date().toISOString(),
            insight: `Final report formatted to strict FHIR R4 standard. Session complete.`
        });
        
        return {
            sessionId: sessionId || 'mock-id',
            data: finalOutput.report,
            trace,
            meta: {
                agentMode: effectiveAgentMode
            }
        };

    } catch (error) {
        console.error('Orchestration failed:', error);
        throw error;
    }
}

module.exports = { orchestrate };
