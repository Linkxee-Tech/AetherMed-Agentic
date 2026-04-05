const { parse_symptoms, knowledge_lookup, risk_score, referral_lookup } = require('./tools');
const {
    detectLanguage,
    getLocalizedLanguageName,
    getLocalizedRiskLevel,
    getLocalizedTemplates,
    translateKnownText,
    translateSymptomTextToEnglish,
    urgencyToRiskCode
} = require('./languagePacks');

const CRITICAL_KEYWORDS = [
    'chest pain',
    'shortness of breath',
    'difficulty breathing',
    'stroke',
    'seizure',
    'unconscious',
    'loss of consciousness',
    'severe bleeding',
    'coughing blood',
    'blue lips',
    'confusion',
    'confused',
    'suicidal',
    'suicide',
    'kill myself',
    'self harm',
    'self-harm'
];

const HIGH_KEYWORDS = [
    'high fever',
    'fever',
    'fracture',
    'broken',
    'intense pain',
    'worsening pain',
    'severe headache',
    'persistent vomiting'
];

const MEDIUM_KEYWORDS = ['headache', 'nausea', 'vomiting', 'dizziness', 'cough', 'fatigue', 'rash'];

const ABORTION_REQUEST_PATTERNS = [
    'abortion',
    'terminate pregnancy',
    'end pregnancy',
    'pregnancy termination',
    'abortion pill',
    'misoprostol',
    'mifepristone'
];

const EMERGENCY_REPRODUCTIVE_PATTERNS = [
    'heavy bleeding',
    'severe bleeding',
    'fainting',
    'passed out',
    'severe abdominal pain',
    'severe pelvic pain',
    'fever'
];

function normalizeInput(text = '') {
    return text.replace(/\s+/g, ' ').trim();
}

function containsAny(text, keywords) {
    return keywords.some((keyword) => text.includes(keyword));
}

function analyzeClinicalIntent(text = '', notes = '') {
    const combined = normalizeInput(`${text} ${notes}`).toLowerCase();
    const abortionRequest = containsAny(combined, ABORTION_REQUEST_PATTERNS);
    const emergencyReproductiveFlags = abortionRequest && containsAny(combined, EMERGENCY_REPRODUCTIVE_PATTERNS);

    if (abortionRequest) {
        return {
            type: 'ABORTION_REQUEST',
            emergencyReproductiveFlags,
            reportedConcern: 'Request for abortion medication or pregnancy termination care.'
        };
    }

    return {
        type: 'SYMPTOM_REPORT',
        emergencyReproductiveFlags: false,
        reportedConcern: null
    };
}

function fallbackSymptoms(text) {
    const intent = analyzeClinicalIntent(text);
    if (intent.type === 'ABORTION_REQUEST') return ['pregnancy termination request'];

    const parsed = parse_symptoms(text);
    if (parsed.length) return parsed;

    const fragments = normalizeInput(text).split(/,| and | with /i).map((entry) => entry.trim()).filter(Boolean);
    return fragments.length ? fragments.slice(0, 4) : ['general symptoms'];
}

function buildRecommendations(urgency, symptoms) {
    const lowerSymptoms = symptoms.toLowerCase();
    const intent = analyzeClinicalIntent(symptoms);

    if (intent.type === 'ABORTION_REQUEST') {
        return [
            { title: 'Clinician-guided reproductive care', action: 'This request needs a licensed clinician or reproductive-health service to confirm pregnancy status, discuss options, and decide whether medication abortion is appropriate.', urgency: 'HIGH' },
            { title: 'Do not use unverified tablets', action: 'Do not start unknown or unverified abortion pills without professional review, because pregnancy location, timing, contraindications, and follow-up matter.', urgency: 'HIGH' },
            { title: 'Emergency warning signs', action: 'Seek urgent hospital care immediately if there is heavy bleeding, fainting, severe abdominal pain, fever, or worsening weakness.', urgency: intent.emergencyReproductiveFlags ? 'HIGH' : 'MEDIUM' }
        ];
    }

    const urgentAdvice = urgency === 'CRITICAL'
        ? [
            { title: 'Emergency escalation', action: 'Seek emergency care immediately or call local emergency services now.', urgency: 'HIGH' },
            { title: 'Immediate physical examination', action: 'Go to the hospital for urgent physical examination, vital signs, and clinician-directed tests such as ECG, labs, imaging, or oxygen assessment as needed.', urgency: 'HIGH' },
            { title: 'Do not self-transport alone', action: 'If you feel faint, confused, or unable to breathe normally, ask for immediate assistance.', urgency: 'HIGH' }
        ]
        : [];

    const highAdvice = urgency === 'HIGH'
        ? [
            { title: 'Urgent clinical evaluation', action: 'Arrange same-day in-person medical assessment as soon as possible.', urgency: 'HIGH' },
            { title: 'Physical tests may be needed', action: 'A doctor or urgent-care clinician may need to examine you and decide on tests such as blood work, swabs, imaging, or other examinations based on your symptoms.', urgency: 'HIGH' }
        ]
        : [];

    const baselineAdvice = [
        { title: 'Monitor progression', action: 'Watch for worsening pain, breathing changes, confusion, or inability to keep fluids down.', urgency: 'MEDIUM' },
        { title: 'Use safe symptom notes', action: 'Track symptom timing, severity, and any medicines already taken for a clinician review.', urgency: 'LOW' }
    ];

    if (lowerSymptoms.includes('fever')) {
        baselineAdvice.unshift({ title: 'Hydration support', action: 'Maintain fluids if tolerated while arranging care, and stop if swallowing or breathing becomes difficult.', urgency: 'MEDIUM' });
    }

    return [...urgentAdvice, ...highAdvice, ...baselineAdvice].slice(0, 4);
}

function buildMedicationSuggestions(urgency, symptoms, notes = '', ageRange = '') {
    const lowerSymptoms = symptoms.toLowerCase();
    const lowerNotes = notes.toLowerCase();
    const intent = analyzeClinicalIntent(symptoms, notes);
    const isChildRange = ageRange.includes('0-18');
    const hasPotentialLiverRisk = /liver|hepatitis|cirrhosis|heavy alcohol|alcohol/.test(lowerNotes);
    const hasPotentialNsaidRisk = /ulcer|bleeding|blood thinner|warfarin|kidney|renal|pregnan|heart failure|dehydr/.test(lowerNotes);

    if (intent.type === 'ABORTION_REQUEST') {
        return [{ name: 'No OTC abortion prescription', type: 'CLINICIAN_REVIEW', instructions: 'Medication abortion should not be generated here as a routine tablet recommendation. A licensed clinician should confirm pregnancy details and decide whether treatment is appropriate.', cautions: 'Emergency care is needed sooner if there is heavy bleeding, severe pain, fainting, fever, or concern for ectopic pregnancy.' }];
    }

    if (urgency === 'CRITICAL' || urgency === 'HIGH') {
        return [{ name: 'Medication review with clinician', type: 'CLINICIAN_REVIEW', instructions: 'Do not rely on self-medication to delay emergency or urgent assessment. Let the hospital or doctor decide which medicines are appropriate after examination.', cautions: 'Chest pain, trouble breathing, severe headache, repeated vomiting, or other red flags need prompt in-person evaluation and may require tests before treatment.' }];
    }

    const medications = [];

    if (lowerSymptoms.includes('fever') || lowerSymptoms.includes('headache') || lowerSymptoms.includes('pain')) {
        medications.push({ name: 'Acetaminophen / Paracetamol', type: 'OTC', instructions: 'For mild fever, headache, or aches, consider an over-the-counter acetaminophen/paracetamol product only as directed on the package label.', cautions: 'Do not combine multiple products that contain acetaminophen. Avoid or ask a clinician first if you have liver disease or heavy alcohol use.' });
    }

    if (!isChildRange && (lowerSymptoms.includes('headache') || lowerSymptoms.includes('pain') || lowerSymptoms.includes('fever')) && !hasPotentialNsaidRisk && !lowerSymptoms.includes('vomiting')) {
        medications.push({ name: 'Ibuprofen', type: 'OTC', instructions: 'For short-term pain, headache, or fever relief, an over-the-counter ibuprofen product may be considered only as directed on the package label.', cautions: 'Avoid or ask a clinician first if you have ulcers, bleeding risk, kidney disease, dehydration, blood thinners, heart disease, or pregnancy.' });
    }

    if (medications.length === 0 || hasPotentialLiverRisk) {
        return [{ name: 'No routine tablet recommendation', type: 'CLINICIAN_REVIEW', instructions: 'Supportive care such as hydration and rest may be safer than starting a medicine without clearer clinical assessment.', cautions: 'Ask a pharmacist or doctor before taking new medication if symptoms are unusual, worsening, or you have other medical conditions.' }];
    }

    return medications.slice(0, 2);
}

function localTranslationAgent(context) {
    const symptoms = normalizeInput(context.input?.symptoms || '');
    const detectedLanguage = detectLanguage(symptoms);
    return { detectedLanguage, translatedSymptoms: translateSymptomTextToEnglish(symptoms, detectedLanguage) };
}

function localTriageAgent(context) {
    const symptoms = normalizeInput(context.translation?.translatedSymptoms || context.input?.symptoms || '').toLowerCase();
    const mildPresentation = /(mild|light|slight|minor)/.test(symptoms);
    const intent = analyzeClinicalIntent(symptoms, context.input?.notes || '');

    if (intent.type === 'ABORTION_REQUEST') {
        return intent.emergencyReproductiveFlags
            ? { urgency: 'HIGH', reason: 'Pregnancy termination concerns with possible warning signs need urgent in-person reproductive or emergency assessment.' }
            : { urgency: 'MEDIUM', reason: 'This is a direct reproductive-health medication request rather than a simple symptom report and needs clinician review for confirmation, options, and safety.' };
    }

    if (containsAny(symptoms, CRITICAL_KEYWORDS)) return { urgency: 'CRITICAL', reason: 'Red-flag symptoms suggest a potentially time-sensitive condition that requires emergency evaluation.' };
    if (containsAny(symptoms, HIGH_KEYWORDS)) return { urgency: 'HIGH', reason: 'The symptom pattern suggests urgent in-person assessment is appropriate today.' };
    if (mildPresentation && (symptoms.includes('fatigue') || symptoms.includes('cough')) && !containsAny(symptoms, MEDIUM_KEYWORDS.filter((keyword) => !['fatigue', 'cough'].includes(keyword)))) {
        return { urgency: 'LOW', reason: 'No immediate red flags were detected from the limited symptom description, but monitoring and routine follow-up may still be needed.' };
    }
    if (containsAny(symptoms, MEDIUM_KEYWORDS)) return { urgency: 'MEDIUM', reason: 'Symptoms appear clinically important but do not immediately suggest a life-threatening emergency from the available history.' };
    return { urgency: 'LOW', reason: 'No immediate red flags were detected from the limited symptom description, but monitoring and routine follow-up may still be needed.' };
}

function localResearchAgent(context) {
    const symptoms = normalizeInput(context.translation?.translatedSymptoms || context.input?.symptoms || '');
    const intent = analyzeClinicalIntent(symptoms, context.input?.notes || '');

    if (intent.type === 'ABORTION_REQUEST') {
        return { extractedSymptoms: ['pregnancy termination request'], knowledge: 'The user is requesting abortion medication or pregnancy termination care. This needs pregnancy confirmation, review of contraindications, and clinician-guided follow-up. Heavy bleeding, fainting, fever, or severe abdominal pain require urgent evaluation.' };
    }

    const extractedSymptoms = fallbackSymptoms(symptoms);
    return { extractedSymptoms, knowledge: knowledge_lookup(extractedSymptoms) };
}

function localAdviceAgent(context) {
    const symptoms = context.translation?.translatedSymptoms || context.input?.symptoms || '';
    const urgency = context.triage?.urgency || 'MEDIUM';
    return {
        riskScore: risk_score(urgency, context.input?.ageRange, context.input?.urgency),
        recommendations: buildRecommendations(urgency, symptoms),
        medicationSuggestions: buildMedicationSuggestions(urgency, symptoms, context.input?.notes || '', context.input?.ageRange || '')
    };
}

function localReferralAgent(context) {
    const urgency = context.triage?.urgency || 'LOW';
    const intent = analyzeClinicalIntent(context.translation?.translatedSymptoms || context.input?.symptoms || '', context.input?.notes || '');
    const referral = intent.type === 'ABORTION_REQUEST' && urgency !== 'HIGH' && urgency !== 'CRITICAL'
        ? { type: 'Womens Health Clinic', location: 'Licensed OB-GYN or reproductive health clinic (Local Area)' }
        : referral_lookup(urgency, 'Local Area');

    const actionByUrgency = {
        CRITICAL: 'Go immediately to a hospital or emergency department for physical examination and urgent tests.',
        HIGH: 'Seek urgent doctor or hospital evaluation today for physical examination and further tests if needed.',
        MEDIUM: 'Book prompt clinical follow-up and escalate if symptoms worsen.',
        LOW: 'Use home monitoring and routine follow-up if symptoms persist.'
    };

    return {
        referral: {
            ...referral,
            action: intent.type === 'ABORTION_REQUEST'
                ? (urgency === 'HIGH' ? actionByUrgency.HIGH : 'Arrange prompt review with a licensed OB-GYN, reproductive-health clinic, or qualified doctor for pregnancy confirmation, options counseling, and safe in-person or telehealth follow-up.')
                : (actionByUrgency[urgency] || actionByUrgency.LOW)
        }
    };
}

module.exports = {
    analyzeClinicalIntent,
    detectLanguage,
    getLocalizedLanguageName,
    getLocalizedRiskLevel,
    getLocalizedTemplates,
    localTranslationAgent,
    localTriageAgent,
    localResearchAgent,
    localAdviceAgent,
    localReferralAgent,
    translateKnownText,
    translateSymptomTextToEnglish,
    urgencyToRiskCode
};
