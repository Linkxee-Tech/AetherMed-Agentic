const { callLLM, callVisionLLM } = require('../tools/openaiService');
const { hasOpenAIKey } = require('../tools/runtime');
const { detectLanguage } = require('../tools/languagePacks');
const { normalizeDocumentExplanationResult } = require('../tools/agentContracts');

function buildDocumentFallback(input = {}) {
    const inferredLanguage = detectLanguage(`${input.documentText || ''} ${input.notes || ''}`) || 'English';
    const hasText = Boolean(input.documentText && input.documentText.trim());
    const hasImage = Boolean(input.imageDataUrl && input.imageDataUrl.startsWith('data:image/'));

    if (hasText) {
        return {
            detectedLanguage: inferredLanguage,
            documentType: 'Medical document',
            readability: 'partial',
            documentSummary: 'I could only do a limited explanation of the provided medical document text in this environment.',
            keyFindings: [
                'The text appears to come from a medical record, note, prescription, or test report.',
                'Important details may still need direct review because formatting, abbreviations, or missing context can change the meaning.'
            ],
            simpleMeaning: [
                'This should be treated as an explanation aid, not a replacement for the original doctor or clinic report.',
                'A clinician or pharmacist should confirm anything that affects treatment, medication use, or follow-up timing.'
            ],
            importantWarningSigns: [
                'Seek urgent medical follow-up if the document mentions severe abnormal results, emergency referral, heavy bleeding, chest pain, breathing trouble, stroke signs, or severe infection.'
            ],
            suggestedNextStep: 'Compare this explanation with the original report and follow up with the issuing clinic, doctor, or pharmacist for any unclear terms or urgent items.',
            finalExplanation: 'I can offer only a cautious, partial explanation here, so please rely on the original medical document and professional follow-up for decisions.'
        };
    }

    return {
        detectedLanguage: inferredLanguage,
        documentType: 'Medical document',
        readability: hasImage ? 'unclear' : 'partial',
        documentSummary: 'I could not reliably read the uploaded medical document in the current environment.',
        keyFindings: [
            'The uploaded item looks like a medical document or screenshot that still needs direct review.',
            'Important wording, values, or instructions may be missed if the image is hard to read.'
        ],
        simpleMeaning: [
            'A clearer image, scanned copy, or pasted report text would make the explanation more dependable.',
            'The original doctor or clinic report remains the source of truth.'
        ],
        importantWarningSigns: [
            'If the document mentions critical lab values, emergency referral, severe infection, chest pain, breathing trouble, stroke concerns, or rapidly worsening symptoms, contact a clinician urgently.'
        ],
        suggestedNextStep: 'Upload a clearer screenshot or paste the document text, then confirm any urgent findings with the clinician or clinic that issued the report.',
        finalExplanation: 'I could not read this medical document clearly enough to explain it safely, so a better copy or direct medical follow-up is the safest next step.'
    };
}

async function medicalDocumentAgent(input) {
    const fallback = buildDocumentFallback(input);

    if (!hasOpenAIKey()) {
        return normalizeDocumentExplanationResult(fallback, fallback);
    }

    const sharedSchema = `Return a strict JSON object with this exact schema:
{
  "detectedLanguage": "English or the user's likely language",
  "documentType": "Diagnosis note" | "Lab result" | "Prescription note" | "Clinic report" | "Medical document",
  "readability": "clear" | "partial" | "unclear",
  "documentSummary": "Plain-language summary of the document",
  "keyFindings": ["finding 1", "finding 2"],
  "simpleMeaning": ["meaning 1", "meaning 2"],
  "importantWarningSigns": ["warning sign 1", "warning sign 2"],
  "suggestedNextStep": "Safe follow-up step",
  "finalExplanation": "Short user-friendly explanation"
}`;

    const systemPrompt = `You are AetherMed Agentic's Medical Document Assistant.

Your task is to read a user-uploaded medical document, diagnosis note, lab result, prescription note, or clinic report and explain it in simple language.

Instructions:
- Summarize the document in plain language.
- Explain medical terms in a simple, user-friendly way.
- Do not give a new diagnosis.
- Do not modify or override the doctor's report.
- Do not prescribe treatment.
- If the document mentions urgent findings, clearly highlight them and advise medical follow-up.
- If something is unclear or unreadable, say so.
- Keep the response accurate, neutral, and safe.
- Respond in the user's language if possible.
- If there are numbers or lab values, explain only what the document itself suggests or clearly labels. Do not invent interpretation beyond the report.
- If the document appears incomplete, scanned poorly, cropped, or blurry, say so.

${sharedSchema}`;

    try {
        let result;

        if (input.documentText && input.documentText.trim()) {
            const userContext = [
                'Explain this medical document in plain language.',
                `Document text:\n${input.documentText}`,
                `Optional user context: ${input.notes || 'None provided.'}`,
                `Language hint: ${input.languageHint || 'Not provided.'}`
            ].join('\n\n');

            result = await callLLM(systemPrompt, userContext);
        } else {
            const userContext = [
                'Explain this uploaded medical document image in plain language.',
                `Optional user context: ${input.notes || 'None provided.'}`,
                `Language hint: ${input.languageHint || 'Not provided.'}`
            ].join('\n\n');

            result = await callVisionLLM(systemPrompt, userContext, input.imageDataUrl);
        }

        return normalizeDocumentExplanationResult(result, fallback);
    } catch (error) {
        console.warn('Medical document LLM failed, using structured fallback.', error.message);
        return normalizeDocumentExplanationResult(fallback, fallback);
    }
}

module.exports = { medicalDocumentAgent };
