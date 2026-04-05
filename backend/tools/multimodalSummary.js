const { callVisionLLM } = require('./openaiService');
const { hasOpenAIKey } = require('./runtime');

const IMAGING_KEYWORDS = [
    'x-ray',
    'xray',
    'radiograph',
    'scan',
    'ct',
    'ct scan',
    'mri',
    'ultrasound',
    'sonogram',
    'mammogram',
    'dicom'
];

const DOCUMENT_KEYWORDS = [
    'report',
    'diagnosis note',
    'diagnosis',
    'lab result',
    'lab report',
    'prescription',
    'clinic note',
    'clinic report',
    'discharge summary',
    'medical report',
    'doctor note'
];

const URGENT_KEYWORDS = [
    'emergency',
    'urgent',
    'immediate',
    'immediately',
    'critical',
    'severe',
    'rapidly',
    'seek medical help now',
    'seek urgent',
    'call emergency',
    'trouble breathing',
    'stroke',
    'heavy bleeding',
    'chest pain'
];

function containsKeyword(text = '', keywords = []) {
    const sample = String(text).toLowerCase();
    return keywords.some((keyword) => sample.includes(keyword));
}

function firstNonEmpty(...values) {
    return values.find((value) => typeof value === 'string' && value.trim()) || '';
}

function normalizeRiskLabel(codeOrLabel = 'Moderate') {
    const value = String(codeOrLabel || '').toUpperCase();

    if (value === 'EMERGENCY' || value === 'CRITICAL') return { code: 'EMERGENCY', label: 'Emergency' };
    if (value === 'HIGH') return { code: 'HIGH', label: 'High' };
    if (value === 'LOW') return { code: 'LOW', label: 'Low' };
    return { code: 'MODERATE', label: 'Moderate' };
}

function buildTextSummary(report) {
    const presentation = report?.presentation || {};
    const risk = normalizeRiskLabel(presentation.riskLevelCode || presentation.riskLevel);
    const emergencyAdvice = risk.code === 'EMERGENCY'
        ? firstNonEmpty(presentation.referralAdvice, presentation.finalUserResponse)
        : risk.code === 'HIGH'
            ? firstNonEmpty(presentation.referralAdvice, (presentation.safeGuidance || [])[0])
            : '';

    return {
        inputTypeCode: 'text_symptoms',
        inputTypeDetected: 'Text symptoms',
        riskLevelCode: risk.code,
        riskLevel: presentation.riskLevel || risk.label,
        safeSummary: firstNonEmpty(
            presentation.mainConcernSummary,
            report?.entry?.find((item) => item.resource?.resourceType === 'ClinicalImpression')?.resource?.summary,
            'Symptoms were reviewed through the text triage flow.'
        ),
        recommendedNextStep: firstNonEmpty(
            presentation.referralAdvice,
            (presentation.safeGuidance || [])[0],
            'Arrange medical follow-up based on symptom severity.'
        ),
        emergencyAdvice,
        finalUserFacingResponse: firstNonEmpty(
            presentation.finalUserResponse,
            presentation.referralAdvice,
            'Use the guidance above and seek urgent care sooner if symptoms worsen.'
        )
    };
}

function buildVisualSummary(result) {
    const risk = normalizeRiskLabel(result?.safetyLevel);
    const isImaging = result?.reviewMode === 'medical_imaging';

    return {
        inputTypeCode: isImaging ? 'medical_imaging' : 'visible_body_image',
        inputTypeDetected: isImaging ? 'X-ray or scan' : 'Visible body image',
        riskLevelCode: risk.code,
        riskLevel: risk.label,
        safeSummary: isImaging
            ? firstNonEmpty(result?.whatCanBeSaidSafely, result?.visualObservations?.[0], result?.finalShortResponse)
            : firstNonEmpty(result?.finalShortResponse, result?.visualObservations?.[0], result?.possibleGeneralConcerns?.[0]),
        recommendedNextStep: isImaging
            ? firstNonEmpty(result?.recommendedNextStepSummary, result?.recommendedNextSteps?.[0])
            : firstNonEmpty(result?.recommendedNextSteps?.[0], result?.finalShortResponse),
        emergencyAdvice: firstNonEmpty(result?.whenToSeekMedicalHelpImmediately?.[0]),
        finalUserFacingResponse: isImaging
            ? firstNonEmpty(result?.finalSafeResponse, result?.finalShortResponse)
            : firstNonEmpty(result?.finalShortResponse, result?.recommendedNextSteps?.[0])
    };
}

function deriveDocumentRisk(result) {
    const allText = [
        ...(result?.importantWarningSigns || []),
        result?.suggestedNextStep || '',
        result?.finalExplanation || '',
        result?.documentSummary || ''
    ].join(' ');

    if (containsKeyword(allText, URGENT_KEYWORDS)) {
        return { code: 'HIGH', label: 'High' };
    }

    return { code: 'MODERATE', label: 'Moderate' };
}

function buildDocumentSummary(result) {
    const risk = deriveDocumentRisk(result);
    const warning = firstNonEmpty(result?.importantWarningSigns?.[0]);

    return {
        inputTypeCode: 'medical_document',
        inputTypeDetected: 'Medical report or diagnosis note',
        riskLevelCode: risk.code,
        riskLevel: risk.label,
        safeSummary: firstNonEmpty(result?.documentSummary, result?.keyFindings?.[0], result?.finalExplanation),
        recommendedNextStep: firstNonEmpty(result?.suggestedNextStep, result?.finalExplanation),
        emergencyAdvice: warning,
        finalUserFacingResponse: firstNonEmpty(result?.finalExplanation, result?.suggestedNextStep)
    };
}

function buildMultimodalSummary(kind, data) {
    if (kind === 'text') return buildTextSummary(data);
    if (kind === 'visual') return buildVisualSummary(data);
    if (kind === 'document') return buildDocumentSummary(data);

    return {
        inputTypeCode: 'unknown',
        inputTypeDetected: 'Unknown input',
        riskLevelCode: 'MODERATE',
        riskLevel: 'Moderate',
        safeSummary: 'The input was reviewed cautiously, but the type could not be classified clearly.',
        recommendedNextStep: 'Provide clearer text or a clearer image and follow up with a healthcare professional if needed.',
        emergencyAdvice: '',
        finalUserFacingResponse: 'A clearer input or direct medical follow-up would be the safest next step.'
    };
}

function buildUploadAssistantGuidance(classification = {}) {
    const base = {
        detectedInputType: classification.label || 'Uploaded image',
        routeCode: classification.code || 'visible_body_image',
        disclaimer: 'AetherMed provides guidance and explanation, not a medical diagnosis.',
        supportiveIntro: 'I can help route this upload to the safest review path.',
        minimumContextLabel: 'Optional context',
        minimumContextPlaceholder: 'Add only what feels necessary for a safer review.',
        supportNote: 'You only need to add a little context if it helps clarify what was uploaded.'
    };

    if (classification.code === 'medical_document') {
        return {
            ...base,
            supportiveIntro: 'This looks like a medical report or note, so I can route it to the document explanation workflow.',
            minimumContextLabel: 'What do you want help understanding?',
            minimumContextPlaceholder: 'For example: explain the highlighted terms, explain the lab summary, or tell me what needs follow-up.',
            supportNote: 'A short note about what is confusing is enough. The system will explain the document, not replace it.'
        };
    }

    if (classification.code === 'medical_imaging') {
        return {
            ...base,
            supportiveIntro: 'This appears to be a scan or medical imaging upload, so I will keep the response safety-first and non-diagnostic.',
            minimumContextLabel: 'What kind of scan is this, if you know?',
            minimumContextPlaceholder: 'For example: chest X-ray after cough, ankle X-ray after injury, or MRI screenshot from clinic.',
            supportNote: 'Only a brief hint is needed. AetherMed will not diagnose the scan and will direct you to professional review.'
        };
    }

    if (classification.code === 'visible_body_image') {
        return {
            ...base,
            supportiveIntro: 'This looks like a visible body image, so I can route it to the visual symptom workflow.',
            minimumContextLabel: 'Where is this and what changed?',
            minimumContextPlaceholder: 'For example: rash on arm for 2 days, swelling near ankle since yesterday, or wound that looks red.',
            supportNote: 'A short note is enough. AetherMed will describe visible patterns and suggest safe next steps, not diagnose.'
        };
    }

    return base;
}

function buildImageContextFallback(classification = {}, input = {}) {
    const sourceLabel = input?.sourceLabel || 'uploaded image';

    if (classification.code === 'medical_document') {
        return {
            summary: 'This looks like a medical document or report image.',
            suggestedContext: 'This appears to be a medical report, note, or result screenshot that I want explained in simple terms.',
            source: 'fallback'
        };
    }

    if (classification.code === 'medical_imaging') {
        return {
            summary: 'This looks like a scan or other medical imaging image.',
            suggestedContext: 'This appears to be a scan or medical imaging capture that I want reviewed with safety-first, non-diagnostic guidance.',
            source: 'fallback'
        };
    }

    if (classification.code === 'visible_body_image') {
        return {
            summary: 'This looks like a visible body or skin image.',
            suggestedContext: 'This appears to be a photo of a visible body or skin issue that I want reviewed safely.',
            source: 'fallback'
        };
    }

    return {
        summary: `This looks like an ${sourceLabel}.`,
        suggestedContext: 'I want help understanding what this uploaded image may be about in a safe, non-diagnostic way.',
        source: 'fallback'
    };
}

function detectInputFromHints(input = {}) {
    const notes = `${input.notes || ''} ${input.documentText || ''}`.toLowerCase();
    const hasImage = typeof input.imageDataUrl === 'string' && input.imageDataUrl.startsWith('data:image/');
    const hasTextSymptoms = typeof input.symptoms === 'string' && input.symptoms.trim().length > 0;
    const hasDocumentText = typeof input.documentText === 'string' && input.documentText.trim().length > 0;

    if (hasDocumentText) {
        return { kind: 'document', code: 'medical_document', label: 'Medical report or diagnosis note', reason: 'Document text was provided.' };
    }

    if (hasImage && containsKeyword(notes, IMAGING_KEYWORDS)) {
        return { kind: 'visual', code: 'medical_imaging', label: 'X-ray or scan', reason: 'The notes suggest medical imaging.' };
    }

    if (hasImage && containsKeyword(notes, DOCUMENT_KEYWORDS)) {
        return { kind: 'document', code: 'medical_document', label: 'Medical report or diagnosis note', reason: 'The notes suggest a medical document.' };
    }

    if (hasImage) {
        return { kind: 'visual', code: 'visible_body_image', label: 'Visible body image', reason: 'An uploaded image was provided.' };
    }

    if (hasTextSymptoms) {
        return { kind: 'text', code: 'text_symptoms', label: 'Text symptoms', reason: 'Symptom text was provided.' };
    }

    return { kind: 'unknown', code: 'unknown', label: 'Unknown input', reason: 'No supported input was provided.' };
}

async function classifyMultimodalInput(input = {}) {
    const heuristic = detectInputFromHints(input);
    const hasImage = typeof input.imageDataUrl === 'string' && input.imageDataUrl.startsWith('data:image/');

    if (!hasImage || !hasOpenAIKey() || heuristic.code === 'medical_document' || heuristic.code === 'medical_imaging') {
        return heuristic;
    }

    const systemPrompt = `You are AetherMed Agentic's multimodal intake router.
Classify the uploaded input into exactly one category:
- "text_symptoms"
- "visible_body_image"
- "medical_document"
- "medical_imaging"

Rules:
- "text_symptoms" is for written symptom descriptions without an uploaded image.
- "visible_body_image" is for normal photos or camera captures of visible body issues such as rash, wound, swelling, discoloration, or other external symptoms.
- "medical_document" is for diagnosis notes, clinic reports, prescription notes, discharge summaries, lab screenshots, or medical report images.
- "medical_imaging" is for X-rays, CT scans, MRI images, ultrasound captures, radiographs, mammograms, or similar imaging studies.
- Do not diagnose anything. This is classification only.

Return strict JSON:
{
  "code": "text_symptoms" | "visible_body_image" | "medical_document" | "medical_imaging",
  "reason": "one short sentence"
}`;

    const userContext = [
        'Classify this uploaded input for routing.',
        `User notes: ${input.notes || 'None provided.'}`,
        `Document text: ${input.documentText || 'None provided.'}`
    ].join('\n');

    try {
        const result = await callVisionLLM(systemPrompt, userContext, input.imageDataUrl);
        const code = result?.code;

        if (code === 'medical_document') {
            return { kind: 'document', code, label: 'Medical report or diagnosis note', reason: result.reason || 'The uploaded image appears to be a medical document.' };
        }

        if (code === 'medical_imaging') {
            return { kind: 'visual', code, label: 'X-ray or scan', reason: result.reason || 'The uploaded image appears to be medical imaging.' };
        }

        if (code === 'visible_body_image') {
            return { kind: 'visual', code, label: 'Visible body image', reason: result.reason || 'The uploaded image appears to be a visible body photo.' };
        }
    } catch (error) {
        console.warn('Multimodal router fallback to heuristic classification.', error.message);
    }

    return heuristic;
}

async function generateImageContextDraft(input = {}, classification = {}) {
    const hasImage = typeof input.imageDataUrl === 'string' && input.imageDataUrl.startsWith('data:image/');
    const fallback = buildImageContextFallback(classification, input);

    if (!hasImage || !hasOpenAIKey()) {
        return fallback;
    }

    const systemPrompt = `You are AetherMed Agentic's upload context assistant.
Your job is to look at an uploaded image and produce a short, safe, non-diagnostic draft that helps prefill the user's context field.

Rules:
- Do not diagnose the image.
- Describe only broad, obvious, non-speculative content.
- If the image appears to be a visible body photo, describe it as a body/skin image without naming a disease.
- If the image appears to be a medical report or lab screenshot, describe it as a document or report.
- If the image appears to be medical imaging such as an X-ray or scan, describe it as medical imaging and stay non-diagnostic.
- Keep the draft practical and editable by the user.
- Keep the language clear and brief.

Return strict JSON:
{
  "summary": "one short sentence about what the image appears to be",
  "suggestedContext": "one short first-person draft the user can edit"
}`;

    const userContext = [
        `Routing label: ${classification.label || 'Uploaded image'}`,
        `Routing code: ${classification.code || 'unknown'}`,
        `User notes: ${input.notes || 'None provided.'}`
    ].join('\n');

    try {
        const result = await callVisionLLM(systemPrompt, userContext, input.imageDataUrl);
        return {
            summary: firstNonEmpty(result?.summary, fallback.summary),
            suggestedContext: firstNonEmpty(result?.suggestedContext, fallback.suggestedContext),
            source: 'vision'
        };
    } catch (error) {
        console.warn('Image context draft fallback to heuristic description.', error.message);
        return fallback;
    }
}

module.exports = {
    buildMultimodalSummary,
    buildUploadAssistantGuidance,
    classifyMultimodalInput,
    generateImageContextDraft
};
