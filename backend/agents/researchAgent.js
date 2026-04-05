const { callLLM } = require('../tools/openaiService');
const { shouldUseOfflineAgents } = require('../tools/runtime');
const { localResearchAgent } = require('../tools/localClinicalEngine');
const { normalizeResearchResult } = require('../tools/agentContracts');

/**
 * ResearchAgent - Expert in medical documentation retrieval
 * @param {Object} context - The shared agent-to-agent context
 */
async function researchAgent(context) {
    const symptoms = context.translation?.translatedSymptoms || context.input.symptoms;
    const { triage } = context;

    if (shouldUseOfflineAgents()) {
        return localResearchAgent(context);
    }
    
    const systemPrompt = `You are the Medical Insight Agent inside AetherMed Agentic.
Given a list of symptoms and a severity level, or a direct care request, extract the primary clinical findings and risks using trusted, non-diagnostic medical framing.
In addition, provide a brief 'Common Causes' summary in simple, non-medical terms that explains what might be happening without giving a specific diagnosis.
Your output must be a strict JSON object matching this schema:
{
  "extractedSymptoms": ["symptom1", "symptom2"],
  "knowledge": "A summary of the potential risks, clinical associations, and possible common causes in simple terms."
}
If the user is asking for a prescription, abortion medication, or another direct clinical intervention, do not pretend it is a generic symptom list. Explain that it is a care request that needs proper medical review and note important warning signs. Keep the 'knowledge' summary clinical, professional, and non-diagnostic. Note that the urgency was rated as ${triage?.urgency}.`;

    const userContext = `Symptoms: ${symptoms}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        const localFallback = localResearchAgent(context);
        return normalizeResearchResult(
            result,
            localFallback.extractedSymptoms,
            localFallback.knowledge
        );
    } catch(e) {
        console.warn("Research LLM Failed, falling back to local research engine.");
        return localResearchAgent(context);
    }
}

module.exports = { researchAgent };
