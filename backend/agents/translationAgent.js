const { callLLM } = require('../tools/geminiService');

/**
 * TranslationAgent - Detects language and translates to English standard
 * @param {Object} context - The shared agent-to-agent context
 */
async function translationAgent(context) {
    const { symptoms } = context.input;
    
    const systemPrompt = `You are a Medical Translation Agent.
Your job is to detect the language of the user's input, and translate it to English for clinical processing.
If the input is already in English, return it as-is.
Your output must be a strict JSON object matching this schema:
{
  "detectedLanguage": "The full name of the language (e.g., 'Spanish', 'French', 'English')",
  "translatedSymptoms": "The English translation of the user's symptoms."
}`;

    const userContext = `User Input: ${symptoms}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        return result;
    } catch(e) {
        console.warn("Translation LLM Failed, falling back to English default.");
        return { detectedLanguage: "English (Fallback)", translatedSymptoms: symptoms };
    }
}

module.exports = { translationAgent };
