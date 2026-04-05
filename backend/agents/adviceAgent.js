const { callLLM } = require('../tools/openaiService');
const { shouldUseOfflineAgents } = require('../tools/runtime');
const { localAdviceAgent } = require('../tools/localClinicalEngine');
const { normalizeAdviceResult } = require('../tools/agentContracts');

/**
 * AdviceAgent - Focused on safety-first recommendations using OpenAI
 * @param {Object} context - The shared agent-to-agent context
 */
async function adviceAgent(context) {
    const urgency = context.triage?.urgency || 'UNKNOWN';
    const ageRange = context.input?.ageRange;
    const userUrgency = context.input?.urgency;
    const research = context.research?.knowledge;

    if (shouldUseOfflineAgents()) {
        return localAdviceAgent(context);
    }
    
    const systemPrompt = `You are a Clinical Safety Advisor.
Your objective is to provide helpful and practical medical guidance WITHOUT giving a diagnosis.
Based on the age range, user-reported urgency, triage level, and clinical research (which includes possible common causes), generate a numerical risk score, practical next steps, and safe guidance.

Rules:
- RISK SCORE: Generate a score from 0-100 indicating relative acuity.
- COMMON CAUSES: Briefly explain 1-2 possible common causes in simple, non-medical terms based on the research summary.
- HOME CARE: Suggest 2-3 specific, realistic home care actions (e.g., "apply a cold compress for 15 minutes," "sip small amounts of water every 10-15 minutes").
- OTC GUIDANCE: You may mention common over-the-counter options (e.g., "acetaminophen for fever"), but you MUST NOT provide any dosages or schedules. Always refer to the product label.
- RED FLAGS: Clearly list the specific symptoms ("Red Flags") that should trigger an immediate visit to an Emergency Room or Urgent Care.
- SPECIFICITY: Avoid vague responses like "monitor closely," "watch and wait," or "rest and hydrate." Instead, be specific about WHAT to watch for and how long to wait before seeking higher care.

Your output must be a strict JSON object matching this schema:
{
  "riskScore": Number (0 to 100),
  "commonCauses": "...",
  "recommendations": [
    { "title": "...", "action": "...", "urgency": "HIGH" | "MEDIUM" | "LOW" }
  ],
  "medicationSuggestions": [
    {
      "name": "...",
      "type": "OTC" | "CLINICIAN_REVIEW",
      "instructions": "...",
      "cautions": "..."
    }
  ]
}
Rules:
- If riskScore >= 50 or triage is HIGH/CRITICAL, prioritize in-person doctor or hospital assessment and mention physical examination and tests where appropriate.
- Only suggest simple over-the-counter symptom relief for lower-acuity cases. Examples may include acetaminophen/paracetamol for fever or pain, ibuprofen for some pain/fever cases, or common OTC cough relief where appropriate.
- Do NOT invent prescriptions, antibiotics, controlled substances, or dosing beyond label-directed use.
- If nausea, vomiting, severe cough, dehydration risk, pregnancy, pediatric age concerns, or medication contraindications are relevant, prefer clinician/pharmacist review over self-medication.
- DO NOT provide medical diagnosis. Only actionable next steps.`;

    const userContext = `Age: ${ageRange}, UserUrgency: ${userUrgency}, TriageUrgency: ${urgency}, Research: ${research}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        const localFallback = localAdviceAgent(context);
        return normalizeAdviceResult(
            result,
            localFallback.recommendations,
            localFallback.medicationSuggestions
        );
    } catch(e) {
        console.warn("Advice LLM Failed, falling back to local advice engine.");
        return localAdviceAgent(context);
    }
}

module.exports = { adviceAgent };
