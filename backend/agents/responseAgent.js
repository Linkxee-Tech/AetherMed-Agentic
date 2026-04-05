const { format_response } = require('../tools/tools');
const { callLLM } = require('../tools/openaiService');
const { shouldUseLiveTranslation } = require('../tools/runtime');
const {
    getLocalizedLanguageName,
    getLocalizedRiskLevel,
    getLocalizedTemplates,
    translateKnownText
} = require('../tools/localClinicalEngine');

function localizeRecommendation(recommendation, language) {
    const title = translateKnownText(recommendation?.title || '', language);
    const action = translateKnownText(recommendation?.action || '', language);

    if (!title) {
        return action;
    }

    return title !== recommendation?.title ? `${title}: ${action}` : action;
}

function buildStructuredPresentation(context, language = 'English') {
    const detectedLanguage = context.translation?.detectedLanguage || 'English';
    const risk = getLocalizedRiskLevel(context.triage?.urgency || 'MEDIUM', language);
    const templates = getLocalizedTemplates(language);
    const complaint = context.input?.symptoms || context.research?.extractedSymptoms?.join(', ') || 'the reported symptoms';
    const triageReason = translateKnownText(
        context.triage?.reason || 'Symptoms require clinical caution and should be evaluated by a healthcare professional.',
        language
    );
    const referralType = translateKnownText(context.referral?.referral?.type || 'Primary Care', language);
    const referralAction = translateKnownText(
        context.referral?.referral?.action || 'Arrange medical follow-up soon.',
        language
    );
    const safeGuidance = (context.advice?.recommendations || []).slice(0, 4).map((recommendation) => (
        localizeRecommendation(recommendation, language)
    ));

    return {
        detectedLanguage: getLocalizedLanguageName(detectedLanguage, language),
        detectedLanguageCode: detectedLanguage,
        riskLevel: risk.label,
        riskLevelCode: risk.code,
        mainConcernSummary: `${templates.concernIntro} ${complaint}. ${templates.concernBridge} ${triageReason}`,
        safeGuidance,
        referralAdvice: `${templates.referralPrefix}: ${referralType}. ${referralAction}`,
        finalUserResponse: templates.final[risk.code] || templates.final.MODERATE
    };
}

async function responseAgent(context) {
    const detectedLanguage = context.translation?.detectedLanguage || 'English';
    const report = format_response(context);
    report.detectedLanguage = detectedLanguage;
    report.presentation = buildStructuredPresentation(context, 'English');

    if (!shouldUseLiveTranslation()) {
        if (detectedLanguage !== 'English') {
            report.presentation = buildStructuredPresentation(context, detectedLanguage);
        }

        return { report };
    }

    if (detectedLanguage.toLowerCase().includes('english')) {
        return { report };
    }

    const systemPrompt = `You are the multilingual response layer for AetherMed Agentic.
Translate only user-facing natural-language values into ${detectedLanguage}.
Do not change keys, arrays, JSON structure, or enum-like codes such as riskLevelCode and detectedLanguageCode.
Keep the tone calm, safe, and professional.`;

    try {
        const payloadToTranslate = {
            bundle: {
                symptoms: report.entry[0].resource.valueString,
                triageAssessment: report.entry[1].resource.description,
                findings: report.entry[1].resource.summary,
                advice: report.entry[2].resource.activity.map((item) => item.detail.description)
            },
            presentation: report.presentation
        };

        const translated = await callLLM(systemPrompt, JSON.stringify(payloadToTranslate));

        report.entry[0].resource.valueString = translated?.bundle?.symptoms || payloadToTranslate.bundle.symptoms;
        report.entry[1].resource.description = translated?.bundle?.triageAssessment || payloadToTranslate.bundle.triageAssessment;
        report.entry[1].resource.summary = translated?.bundle?.findings || payloadToTranslate.bundle.findings;

        if (Array.isArray(translated?.bundle?.advice)) {
            report.entry[2].resource.activity.forEach((activity, index) => {
                activity.detail.description = translated.bundle.advice[index] || activity.detail.description;
            });
        }

        if (translated?.presentation && typeof translated.presentation === 'object') {
            report.presentation = {
                ...report.presentation,
                ...translated.presentation,
                riskLevelCode: report.presentation.riskLevelCode,
                detectedLanguageCode: report.presentation.detectedLanguageCode
            };
        }

        return { report };
    } catch (error) {
        console.warn('Response translation LLM failed, using offline emergency backup for multilingual presentation.', error.message);
        report.presentation = buildStructuredPresentation(context, detectedLanguage);
        return { report };
    }
}

module.exports = { responseAgent };
