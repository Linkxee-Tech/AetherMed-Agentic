const { format_response } = require('../tools/tools');
const { callLLM } = require('../tools/geminiService');

/**
 * ResponseAgent - Formats the final output for the user and translates it back
 * @param {Object} context - The shared agent-to-agent context
 */
async function responseAgent(context) {
    const report = format_response(context);
    const detectedLanguage = context.translation?.detectedLanguage || "English";

    // Inject the detected language metadata into the report root so the UI can display it
    report.detectedLanguage = detectedLanguage;

    if (detectedLanguage.toLowerCase().includes('english') || detectedLanguage === 'English (Fallback)') {
        return { report };
    }

    const systemPrompt = `You are a strict Medical Translator.
Translate the values of the JSON keys into ${detectedLanguage}. Do not change the JSON structure or keys.`;

    // 1. Create a safe subset of text to translate
    try {
        const payloadToTranslate = {
            symptoms: report.entry[0].resource.valueString,
            triageAssessment: report.entry[1].resource.description,
            findings: report.entry[1].resource.summary,
            advice: report.entry[2].resource.activity.map(a => a.detail.description).join(" || ")
        };

        const userContext = JSON.stringify(payloadToTranslate);
        const translatedStrings = await callLLM(systemPrompt, userContext);
        
        // 2. Safely Re-Inject
        report.entry[0].resource.valueString = translatedStrings.symptoms || payloadToTranslate.symptoms;
        report.entry[1].resource.description = translatedStrings.triageAssessment || payloadToTranslate.triageAssessment;
        report.entry[1].resource.summary = translatedStrings.findings || payloadToTranslate.findings;
        
        if (translatedStrings.advice) {
            const adviceArray = translatedStrings.advice.split(" || ");
            report.entry[2].resource.activity.forEach((a, index) => {
                a.detail.description = adviceArray[index] || a.detail.description;
            });
        }
        
        return { report };
    } catch(e) {
        console.warn("Response Translation LLM Failed, returning English fallback.");
        return { report };
    }
}

module.exports = { responseAgent };
