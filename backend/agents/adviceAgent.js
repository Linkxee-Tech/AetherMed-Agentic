const { callLLM } = require('../tools/geminiService');

/**
 * AdviceAgent - Focused on safety-first recommendations using Gemini
 * @param {Object} context - The shared agent-to-agent context
 */
async function adviceAgent(context) {
    const urgency = context.triage?.urgency || 'UNKNOWN';
    const ageRange = context.input?.ageRange;
    const userUrgency = context.input?.urgency;
    const research = context.research?.knowledge;
    
    const systemPrompt = `You are a Patient Safety Advisor.
Based on the provided age range, user-reported urgency (1-5), triage level, and clinical research, generate a numerical risk score and safe next steps.
Your output must be a strict JSON object matching this schema:
{
  "riskScore": Number (0 to 100),
  "recommendations": [
    { "title": "...", "action": "...", "urgency": "HIGH" | "MEDIUM" | "LOW" }
  ]
}
Rules:
- If riskScore >= 50, include immediate emergency instructions.
- If riskScore < 50, provide standard monitoring or clinic advice.
- DO NOT provide medical diagnosis. Only actionable next steps.`;

    const userContext = `Age: ${ageRange}, UserUrgency: ${userUrgency}, TriageUrgency: ${urgency}, Research: ${research}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        return result;
    } catch(e) {
        console.warn("Advice LLM Failed, falling back to basic recommendations.");
        return { 
            riskScore: 50,
            recommendations: [{ title: 'System Default', action: 'Seek medical evaluation.', urgency: 'MEDIUM' }]
        };
    }
}

module.exports = { adviceAgent };

