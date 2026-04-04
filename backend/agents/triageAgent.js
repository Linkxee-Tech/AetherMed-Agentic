const { callLLM } = require('../tools/geminiService');

/**
 * TriageAgent - Classifies the severity of the case using Gemini
 * @param {Object} context - The shared agent-to-agent context
 */
async function triageAgent(context) {
    const symptoms = context.translation?.translatedSymptoms || context.input.symptoms;
    
    // We pass the raw symptoms to the LLM to classify severity
    const systemPrompt = `You are a strict Medical Triage Agent. 
Your job is to analyze the user's symptoms and output a strict JSON object.
Your JSON must match this exact schema:
{
  "urgency": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "reason": "One sentence explaining why."
}
Guidelines for urgency:
CRITICAL: Suspected stroke, myocardial infarction, severe bleeding, loss of consciousness, severe difficulty breathing.
HIGH: Intense pain, high fever, potential fractures.
MEDIUM: Moderate symptoms like nausea, mild fever, dizziness.
LOW: Common cold symptoms, minor cuts, fatigue.`;

    const userContext = `Symptoms to evaluate: ${symptoms}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        return result;
    } catch (e) {
        console.warn("Triage LLM Failed, falling back to basic checks.");
        return { urgency: 'HIGH', reason: 'System fallback. Please seek medical evaluation.' };
    }
}

module.exports = { triageAgent };

