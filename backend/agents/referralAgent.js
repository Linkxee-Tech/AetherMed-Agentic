const { callLLM } = require('../tools/geminiService');

/**
 * ReferralAgent - Identifies the care path using Gemini
 * @param {Object} context - The shared agent-to-agent context
 */
async function referralAgent(context) {
    const urgency = context.triage?.urgency || 'LOW';
    const score = context.advice?.riskScore || 0;
    const location = "Local Area"; 

    const systemPrompt = `You are a Care Coordinator.
Based on the symptom urgency and calculated risk score, suggest the most appropriate level of care facility.
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
        return result;
    } catch(e) {
        console.warn("Referral LLM Failed, falling back.");
        return { 
            referral: {
                type: 'Clinic',
                location: 'Nearest Medical Clinic',
                action: 'Schedule as needed.'
            } 
        };
    }
}

module.exports = { referralAgent };

