const { callVisionLLM } = require('../tools/openaiService');
const { hasOpenAIKey } = require('../tools/runtime');
const { normalizeVisualAssessmentResult } = require('../tools/agentContracts');

function buildVisualFallback() {
    return {
        detectedLanguage: 'English',
        reviewMode: 'visible_symptom',
        imageQuality: 'unclear',
        visualObservations: [
            'The image could not be reviewed clearly in the current environment.'
        ],
        possibleGeneralConcerns: [
            'Because the image was not clearly reviewed, the visible issue still may need an in-person assessment if it is painful, worsening, or spreading.'
        ],
        safetyLevel: 'Moderate',
        recommendedNextSteps: [
            'Retake the photo in bright light, keep the full affected area in frame, and avoid filters.',
            'If the area is worsening, painful, draining, or associated with fever, arrange a professional medical evaluation.'
        ],
        whenToSeekMedicalHelpImmediately: [
            'Get urgent medical help now if there is trouble breathing, rapidly increasing swelling, heavy bleeding, severe pain, or signs of infection with fever.'
        ],
        finalShortResponse: 'I could not review the image clearly, so a better photo or an in-person medical check would be the safest next step.',
        acknowledgment: '',
        whatCanBeSaidSafely: '',
        whatCannotBeConfirmed: '',
        recommendedNextStepSummary: '',
        finalSafeResponse: ''
    };
}

function buildMedicalImagingFallback() {
    return {
        detectedLanguage: 'English',
        reviewMode: 'medical_imaging',
        imageQuality: 'unclear',
        visualObservations: [
            'This appears to be a medical imaging file or image rather than a routine photo of an external body symptom.'
        ],
        possibleGeneralConcerns: [
            'Only broad visible patterns can be acknowledged safely here, and the image still needs professional review.'
        ],
        safetyLevel: 'Moderate',
        recommendedNextSteps: [
            'Have the X-ray, scan, or other medical imaging reviewed by a qualified healthcare professional.',
            'If a clinician ordered this image, follow the reporting or follow-up plan from that clinic or imaging center.'
        ],
        whenToSeekMedicalHelpImmediately: [
            'Seek urgent medical care sooner if the reason for the scan involves severe chest pain, trouble breathing, stroke symptoms, major injury, heavy bleeding, or sudden worsening symptoms.'
        ],
        finalShortResponse: 'I can acknowledge the image, but I cannot safely confirm a medical diagnosis from imaging alone.',
        acknowledgment: 'I can see that you uploaded a medical imaging image such as an X-ray or scan.',
        whatCanBeSaidSafely: 'Only broad visible patterns, technical quality limits, or the fact that this is medical imaging can be mentioned safely without trying to diagnose it.',
        whatCannotBeConfirmed: 'I cannot confirm a diagnosis, rule out a condition, or interpret the image like a doctor or radiologist from the image alone.',
        recommendedNextStepSummary: 'Please have the image reviewed by a qualified healthcare professional who can interpret it in the context of your symptoms and report.',
        finalSafeResponse: 'I am not a doctor or radiologist, and I cannot diagnose medical imaging here. The safest next step is formal review by a qualified healthcare professional.'
    };
}

function looksLikeMedicalImaging(notes = '', languageHint = '') {
    const sample = `${notes} ${languageHint}`.toLowerCase();
    const patterns = [
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
        'medical imaging',
        'dicom'
    ];

    return patterns.some((pattern) => sample.includes(pattern));
}

async function visualSymptomAgent(input) {
    const fallback = buildVisualFallback();
    const imagingFallback = buildMedicalImagingFallback();
    const hintSuggestsImaging = looksLikeMedicalImaging(input.notes, input.languageHint);

    if (!hasOpenAIKey()) {
        return hintSuggestsImaging
            ? normalizeVisualAssessmentResult(imagingFallback, imagingFallback)
            : normalizeVisualAssessmentResult(fallback, fallback);
    }

    const systemPrompt = `You are AetherMed Agentic's Visual Symptom Assistant.

Your task is to review a user-uploaded image.
Sometimes the upload is a normal photo of a visible body issue such as a rash, swelling, wound, discoloration, or other external symptom.
Sometimes the upload is medical imaging such as an X-ray, CT, MRI, ultrasound, radiograph, or other scan.

Rules:
- Describe only what is visibly present in the image.
- Do not claim a diagnosis.
- Do not pretend to be certain.
- If the upload is an X-ray, scan, or any medical imaging file, you must not diagnose the image.
- Acknowledge the image.
- State that you are not able to confirm a medical diagnosis from the image alone.
- Describe only broad visible patterns if they are obvious and non-speculative.
- Recommend that the user have the image reviewed by a qualified healthcare professional.
- If the user requests a diagnosis, politely refuse and redirect to safe guidance.
- Never present yourself as a doctor or radiologist.
- If the image is unclear, low quality, cropped, poorly lit, or incomplete, state that clearly.
- If the visible issue appears potentially serious, advise professional medical evaluation.
- Provide only safe, practical next steps.
- Keep the tone calm, professional, and easy to understand.
- If the user's language is not English, respond in the same language when the language can be reasonably inferred from the user's notes or language hint.

Return a strict JSON object with this exact schema:
{
  "detectedLanguage": "English or the inferred user language",
  "reviewMode": "visible_symptom" | "medical_imaging",
  "imageQuality": "clear" | "unclear" | "incomplete",
  "visualObservations": ["visible finding 1", "visible finding 2"],
  "possibleGeneralConcerns": ["broad, non-diagnostic concern 1", "broad, non-diagnostic concern 2"],
  "safetyLevel": "Low" | "Moderate" | "High",
  "recommendedNextSteps": ["next step 1", "next step 2"],
  "whenToSeekMedicalHelpImmediately": ["urgent warning sign 1", "urgent warning sign 2"],
  "finalShortResponse": "one short direct response to the user",
  "acknowledgment": "part 1 acknowledgment",
  "whatCanBeSaidSafely": "part 2 what can be said safely",
  "whatCannotBeConfirmed": "part 3 what cannot be confirmed",
  "recommendedNextStepSummary": "part 4 recommended next step",
  "finalSafeResponse": "part 5 final safe response"
}

Additional guidance:
- Set "reviewMode" to "medical_imaging" for X-rays, CT scans, MRIs, ultrasounds, radiographs, or similar clinical imaging.
- For medical_imaging:
  - The 5 safety-format fields are required and must be substantive.
  - Do not interpret the imaging like a radiologist.
  - Broad statements such as "this looks like a grayscale internal imaging study" are acceptable if obvious.
- For visible_symptom:
  - The 5 safety-format fields may briefly mirror the safer summary and next-step guidance.
- For visualObservations, mention visible color, shape, swelling, distribution, drainage, crusting, bleeding, grayscale internal structures, or technical quality only if actually visible.
- For possibleGeneralConcerns, stay broad and non-diagnostic. Examples: irritation, inflammation, infection risk, allergic reaction, worsening wound, circulation concern.
- If the image is not suitable for this task, say so in visualObservations and recommend in-person review.
- Never state or imply a confirmed condition.
- Do not mention probabilities or confidence scores.`;

    const userContext = [
        'Review this uploaded image of a visible body issue.',
        `User notes: ${input.notes || 'None provided.'}`,
        `Language hint: ${input.languageHint || 'Not provided.'}`
    ].join('\n');

    try {
        const result = await callVisionLLM(systemPrompt, userContext, input.imageDataUrl);
        const chosenFallback = result?.reviewMode === 'medical_imaging' || hintSuggestsImaging ? imagingFallback : fallback;
        return normalizeVisualAssessmentResult(result, chosenFallback);
    } catch (error) {
        console.warn('Visual symptom LLM failed, using structured fallback.', error.message);
        const chosenFallback = hintSuggestsImaging ? imagingFallback : fallback;
        return normalizeVisualAssessmentResult(chosenFallback, chosenFallback);
    }
}

module.exports = { visualSymptomAgent };
