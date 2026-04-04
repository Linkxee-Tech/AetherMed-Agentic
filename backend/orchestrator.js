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
        trace.push('Translation');
        context.translation = await translationAgent(context);

        // 1. Triage
        trace.push('Triage');
        context.triage = await triageAgent(context);

        // 2. Research
        trace.push('Research');
        context.research = await researchAgent(context);

        // 3. Advice
        trace.push('Advice');
        context.advice = await adviceAgent(context);

        // 4. Referral
        trace.push('Referral');
        context.referral = await referralAgent(context);

        // 5. Response
        trace.push('Response');
        const finalOutput = await responseAgent(context);
        
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

