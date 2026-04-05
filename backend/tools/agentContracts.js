const ALLOWED_URGENCY = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const ALLOWED_REFERRALS = ['Emergency Room', 'Urgent Care', 'Primary Care', 'Home Care', 'Womens Health Clinic'];
const ALLOWED_ACTION_URGENCY = ['HIGH', 'MEDIUM', 'LOW'];
const ALLOWED_MEDICATION_TYPES = ['OTC', 'CLINICIAN_REVIEW'];

function sanitizeText(value, fallback, maxLength = 400) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return fallback;
    }

    return normalized.slice(0, maxLength);
}

function uniqueStrings(values) {
    const seen = new Set();

    return values.filter((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function normalizeTranslationResult(result, fallbackSymptoms) {
    return {
        detectedLanguage: sanitizeText(result?.detectedLanguage, 'English', 80),
        translatedSymptoms: sanitizeText(result?.translatedSymptoms, fallbackSymptoms, 1000)
    };
}

function normalizeTriageResult(result, fallbackReason) {
    const urgency = ALLOWED_URGENCY.includes(result?.urgency) ? result.urgency : 'MEDIUM';

    return {
        urgency,
        reason: sanitizeText(result?.reason, fallbackReason, 220)
    };
}

function normalizeResearchResult(result, fallbackSymptoms, fallbackKnowledge) {
    const extractedSymptoms = Array.isArray(result?.extractedSymptoms)
        ? result.extractedSymptoms
            .filter((value) => typeof value === 'string')
            .map((value) => sanitizeText(value, '', 80))
            .filter(Boolean)
        : [];
    const normalizedSymptoms = uniqueStrings(extractedSymptoms).slice(0, 6);

    return {
        extractedSymptoms: normalizedSymptoms.length ? normalizedSymptoms : fallbackSymptoms,
        knowledge: sanitizeText(result?.knowledge, fallbackKnowledge, 500)
    };
}

function normalizeAdviceResult(result, fallbackRecommendations, fallbackMedicationSuggestions = []) {
    const riskScore = Number.isFinite(Number(result?.riskScore))
        ? Math.max(0, Math.min(100, Math.round(Number(result.riskScore))))
        : 50;

    const recommendations = Array.isArray(result?.recommendations)
        ? result.recommendations
            .map((entry) => ({
                title: sanitizeText(entry?.title, 'Next Step', 80),
                action: sanitizeText(entry?.action, 'Seek medical evaluation if symptoms worsen.', 220),
                urgency: ALLOWED_ACTION_URGENCY.includes(entry?.urgency) ? entry.urgency : 'MEDIUM'
            }))
            .slice(0, 4)
        : [];

    const medicationSuggestions = Array.isArray(result?.medicationSuggestions)
        ? result.medicationSuggestions
            .map((entry) => ({
                name: sanitizeText(entry?.name, 'Medication guidance', 80),
                type: ALLOWED_MEDICATION_TYPES.includes(entry?.type) ? entry.type : 'OTC',
                instructions: sanitizeText(entry?.instructions, 'Use only as directed on the product label.', 220),
                cautions: sanitizeText(entry?.cautions, 'Read the label carefully and ask a pharmacist or doctor if unsure.', 280)
            }))
            .slice(0, 3)
        : [];

    return {
        riskScore,
        commonCauses: sanitizeText(result?.commonCauses, '', 300),
        recommendations: recommendations.length ? recommendations : fallbackRecommendations,
        medicationSuggestions: medicationSuggestions.length ? medicationSuggestions : fallbackMedicationSuggestions
    };
}

function normalizeReferralResult(result, fallbackReferral) {
    const referral = result?.referral || {};
    const type = ALLOWED_REFERRALS.includes(referral.type) ? referral.type : fallbackReferral.type;

    return {
        referral: {
            type,
            location: sanitizeText(referral.location, fallbackReferral.location, 140),
            action: sanitizeText(referral.action, fallbackReferral.action, 180)
        }
    };
}

module.exports = {
    sanitizeText,
    normalizeTranslationResult,
    normalizeTriageResult,
    normalizeResearchResult,
    normalizeAdviceResult,
    normalizeReferralResult
};
