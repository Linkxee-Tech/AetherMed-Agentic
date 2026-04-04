const { callLLM } = require('../tools/geminiService');

/**
 * ResearchAgent - Expert in medical documentation retrieval
 * @param {Object} context - The shared agent-to-agent context
 */
async function researchAgent(context) {
    const symptoms = context.translation?.translatedSymptoms || context.input.symptoms;
    const { triage } = context;
    
    const systemPrompt = `You are a Medical Research Assistant.
Given a list of symptoms and a severity level, extract the primary clinical findings and risks.
Your output must be a strict JSON object matching this schema:
{
  "extractedSymptoms": ["symptom1", "symptom2"],
  "knowledge": "A summary of the potential risks and clinical associations."
}
Keep the 'knowledge' summary clinical, professional, and non-diagnostic. Note that the urgency was rated as ${triage?.urgency}.`;

    const userContext = `Symptoms: ${symptoms}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        return result;
    } catch(e) {
        console.warn("Research LLM Failed, falling back to basic extraction.");
        return { extractedSymptoms: [symptoms], knowledge: "Unable to retrieve detailed clinical research at this time." };
    }
}

module.exports = { researchAgent };

