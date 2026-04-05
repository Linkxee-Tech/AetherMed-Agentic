const { callLLM } = require('../tools/openaiService');
const { shouldUseOfflineAgents } = require('../tools/runtime');
const { localTriageAgent } = require('../tools/localClinicalEngine');
const { normalizeTriageResult } = require('../tools/agentContracts');

/**
 * TriageAgent - Classifies the severity of the case using OpenAI
 * @param {Object} context - The shared agent-to-agent context
 */
async function triageAgent(context) {
    const symptoms = context.translation?.translatedSymptoms || context.input.symptoms;

    if (shouldUseOfflineAgents()) {
        return localTriageAgent(context);
    }
    
    // We pass the raw symptoms to the LLM to classify severity
    const systemPrompt = `You are the Triage Agent inside AetherMed Agentic.
Analyze the user's symptoms and output a strict JSON object.
Your JSON must match this exact schema:
{
  "urgency": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "reason": "One sentence explaining why."
}
Guidelines for urgency:
CRITICAL: Suspected stroke, chest pain with red flags, severe bleeding, loss of consciousness, severe difficulty breathing, confusion, suicidal intent, or other life-threatening features.
HIGH: Intense pain, high fever, potential fractures.
MEDIUM: Moderate symptoms like nausea, mild fever, dizziness.
LOW: Common cold symptoms, minor cuts, fatigue.
Always prioritize safety over completeness.
If the user is asking for a direct intervention such as abortion medication rather than just listing symptoms, treat it as a clinical care request and reflect the need for timely real-world evaluation rather than ignoring the intent.`;

    const userContext = `Symptoms to evaluate: ${symptoms}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        return normalizeTriageResult(
            result,
            'Symptoms require clinical caution and should be evaluated by a healthcare professional.'
        );
    } catch (e) {
        console.warn("Triage LLM Failed, falling back to local triage engine.");
        return localTriageAgent(context);
    }
}

module.exports = { triageAgent };
