const { callLLM } = require('../tools/openaiService');
const { shouldUseLiveTranslation } = require('../tools/runtime');
const { localTranslationAgent } = require('../tools/localClinicalEngine');
const { normalizeTranslationResult } = require('../tools/agentContracts');

/**
 * TranslationAgent - Detects language and translates to English standard
 * @param {Object} context - The shared agent-to-agent context
 */
async function translationAgent(context) {
    const { symptoms } = context.input;

    if (!shouldUseLiveTranslation()) {
        return localTranslationAgent(context);
    }
    
    const systemPrompt = `You are the Translation Agent inside AetherMed Agentic.
Detect the user's dominant language and translate the message into English for downstream clinical processing.
If the language is unclear, treat it as English.
If the input is already in English, return it as-is.
Your output must be a strict JSON object matching this schema:
{
  "detectedLanguage": "The full name of the language (e.g., 'Spanish', 'French', 'English')",
  "translatedSymptoms": "The English translation of the user's symptoms."
}`;

    const userContext = `User Input: ${symptoms}`;

    try {
        const result = await callLLM(systemPrompt, userContext);
        return normalizeTranslationResult(result, symptoms);
    } catch(e) {
        console.warn('Translation LLM failed, using offline emergency backup for language detection/translation.');
        return localTranslationAgent(context);
    }
}

module.exports = { translationAgent };
