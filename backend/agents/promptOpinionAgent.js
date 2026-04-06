const { callLLM } = require('../tools/openaiService');

/**
 * executePromptOpinionTask - Specialized logic for A2A connection with PromptOpinion.
 */
async function executePromptOpinionTask(taskName, userQuery) {
    console.log(`[PROMPT AGENT INTERNAL] Received taskName: ${taskName}`);
    
    const systemPrompt = `You are a medical assistant AI.

Analyze the provided symptoms and return:
- Possible conditions (not definitive diagnosis)
- Suggested medications (only safe, common ones)
- Practical advice
- Warning signs if condition may be serious

Be concise, structured, and safe.

Never:
- Give absolute diagnosis
- Recommend dangerous drugs
- Ignore emergency symptoms

Always include:
- Disclaimer: "This is not a medical diagnosis"

Your output MUST be a strict JSON object with this exact structure:
{
  "analysis": "A concise summary of the symptoms and a clear disclaimer that this is not a medical diagnosis.",
  "possible_conditions": ["Condition 1", "Condition 2"],
  "recommendations": ["Recommendation 1", "Medication Suggestion 1"],
  "warnings": ["Warning 1", "Emergency sign 1"],
  "next_steps": "A single specific action for the user to take."
}

Task Context: ${String(taskName).toUpperCase()}
`;

    const userContext = `User Query: ${userQuery}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        return result;
    } catch (error) {
        console.error('[PROMPT OPINION AGENT ERROR]', error);
        throw new Error('Failed to process PromptOpinion request.');
    }
}

module.exports = { executePromptOpinionTask };
