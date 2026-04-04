const { translationAgent } = require('./agents/translationAgent');
const { triageAgent } = require('./agents/triageAgent');
const { researchAgent } = require('./agents/researchAgent');
const { adviceAgent } = require('./agents/adviceAgent');
const { referralAgent } = require('./agents/referralAgent');
const { responseAgent } = require('./agents/responseAgent');

/**
 * orchestrate - Coordinates the specialized agents to process symptoms
 * @param {Object} input - symptoms, ageRange, urgency, notes
 */
async function orchestrate(input) {
    const { sessionId } = input;
    const trace = [];
    
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
            insight: `Detected language: ${context.translation.detectedLanguage}. Normalizing input to English.`
        });

        // 1. Triage
        context.triage = await triageAgent(context);
        trace.push({
            agent: 'Triage',
            insight: `${context.triage.urgency} urgency - ${context.triage.reason}`
        });

        // 2. Research
        context.research = await researchAgent(context);
        trace.push({
            agent: 'Research',
            insight: `Primary findings: ${context.research.extractedSymptoms.join(', ')}. Knowledge lookup complete.`
        });

        // 3. Advice
        context.advice = await adviceAgent(context);
        trace.push({
            agent: 'Advice',
            insight: `Calculating clinical safety. Total risk score: ${context.advice.riskScore}/100.`
        });

        // 4. Referral
        context.referral = await referralAgent(context);
        trace.push({
            agent: 'Referral',
            insight: `Proposed care path: ${context.referral.referral.type} at ${context.referral.referral.location}.`
        });

        // 5. Response
        const finalOutput = await responseAgent(context);
        trace.push({
            agent: 'Response',
            insight: `Final report formatted to strict FHIR R4 standard. Session complete.`
        });
        
        return {
            sessionId: sessionId || 'mock-id',
            data: finalOutput.report,
            trace
        };

    } catch (error) {
        console.error('Orchestration failed:', error);
        throw error;
    }
}

module.exports = { orchestrate };

