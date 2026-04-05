const { callLLM } = require('../tools/openaiService');
const { shouldUseOfflineAgents } = require('../tools/runtime');
const { localReferralAgent } = require('../tools/localClinicalEngine');
const { normalizeReferralResult } = require('../tools/agentContracts');

/**
 * ReferralAgent - Identifies the care path using OpenAI
 * @param {Object} context - The shared agent-to-agent context
 */
async function referralAgent(context) {
    const urgency = context.triage?.urgency || 'LOW';
    const score = context.advice?.riskScore || 0;
    const location = "Local Area"; 

    if (shouldUseOfflineAgents()) {
        return localReferralAgent(context);
    }

    const systemPrompt = `You are the Referral Agent inside AetherMed Agentic.
Based on the symptom urgency and calculated risk score, suggest the safest next step such as self-care, clinic review, urgent care, or emergency care.
Your output must be a strict JSON object matching this schema:
{
  "referral": {
    "type": "Emergency Room" | "Urgent Care" | "Primary Care" | "Home Care",
    "location": "A generic name of the facility type in the region.",
    "action": "Instructions on how soon to go."
  }
}`;

    const userContext = `Urgency: ${urgency}, RiskScore: ${score}, UserRegion: ${location}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        return normalizeReferralResult(result, localReferralAgent(context).referral);
    } catch(e) {
        console.warn("Referral LLM Failed, falling back to local referral engine.");
        return localReferralAgent(context);
    }
}

module.exports = { referralAgent };
