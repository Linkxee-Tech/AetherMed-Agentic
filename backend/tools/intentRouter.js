const DRUG_PATTERNS = [
    /\bdrug\b/i,
    /\bmedicine\b/i,
    /\bmedication\b/i,
    /\btablet\b/i,
    /\bpill\b/i,
    /\bcapsule\b/i,
    /\bsyrup\b/i,
    /\binjection\b/i,
    /\bdose\b/i,
    /\bdosage\b/i,
    /\bmg\b/i,
    /\bml\b/i,
    /\bexpiry\b/i,
    /\bexp date\b/i,
    /\bbatch\b/i,
    /\bbarcode\b/i,
    /\bscan code\b/i,
    /\bfake drug\b/i,
    /\bcounterfeit\b/i,
    /\bis this real\b/i,
    /\bauthentic\b/i,
    /\bside effect\b/i,
    /\breaction after taking\b/i,
    /\bpackage\b/i,
    /\bpackaging\b/i,
    /\bblister pack\b/i,
    /\bpharmacy\b/i,
    /\bseal\b/i
];

const DRUG_IMAGE_PATTERNS = [
    /\bdrug\b/i,
    /\bmedicine\b/i,
    /\bmed\b/i,
    /\bpill\b/i,
    /\bcapsule\b/i,
    /\btablet\b/i,
    /\bblister\b/i,
    /\bpackage\b/i,
    /\bpackaging\b/i,
    /\bbox\b/i,
    /\bbottle\b/i,
    /\blabel\b/i,
    /\bpharmacy\b/i,
    /\bbarcode\b/i,
    /\bqr\b/i
];

const EMERGENCY_MENTAL_PATTERNS = [
    /\bkill myself\b/i,
    /\bend my life\b/i,
    /\bwant to die\b/i,
    /\bsuicid/i,
    /\bself[\s-]?harm\b/i,
    /\bhurt myself\b/i,
    /\bi have a plan\b/i,
    /\bi'm going to do it\b/i
];

const HIGH_DISTRESS_PATTERNS = [
    /\bpanic attack\b/i,
    /\bcan't cope\b/i,
    /\bcan not cope\b/i,
    /\bcan't go on\b/i,
    /\bcan not go on\b/i,
    /\boverwhelmed\b/i,
    /\bhopeless\b/i,
    /\bworthless\b/i,
    /\bafraid to be alone\b/i,
    /\bno reason to live\b/i
];

const MODERATE_DISTRESS_PATTERNS = [
    /\banxious\b/i,
    /\bstressed\b/i,
    /\bcrying\b/i,
    /\bcan't sleep\b/i,
    /\bcan not sleep\b/i,
    /\bdepressed\b/i,
    /\blonely\b/i,
    /\bnumb\b/i,
    /\bburned out\b/i,
    /\bscared\b/i
];

const EMERGENCY_PHYSICAL_PATTERNS = [
    /\bchest pain\b/i,
    /\btrouble breathing\b/i,
    /\bdifficulty breathing\b/i,
    /\bshortness of breath\b/i,
    /\bfainting\b/i,
    /\bloss of consciousness\b/i,
    /\bseizure\b/i,
    /\bstroke\b/i,
    /\bface drooping\b/i,
    /\bslurred speech\b/i,
    /\bheavy bleeding\b/i,
    /\bsevere bleeding\b/i,
    /\bconfusion\b/i
];

const HIGH_PHYSICAL_PATTERNS = [
    /\bhigh fever\b/i,
    /\bsevere headache\b/i,
    /\brepeated vomiting\b/i,
    /\bpersistent vomiting\b/i,
    /\bsevere pain\b/i,
    /\bworsening pain\b/i,
    /\bfracture\b/i,
    /\bbroken\b/i,
    /\bswelling\b/i,
    /\brash\b/i
];

const COMMON_SYMPTOM_PATTERNS = [
    /\bpain\b/i,
    /\bfever\b/i,
    /\bcough\b/i,
    /\bheadache\b/i,
    /\bdizziness\b/i,
    /\bnausea\b/i,
    /\bvomiting\b/i,
    /\brash\b/i,
    /\bfatigue\b/i,
    /\bdiarrhea\b/i
];

const COUNTERFEIT_PATTERNS = [
    /\bfake\b/i,
    /\bcounterfeit\b/i,
    /\bsuspicious\b/i,
    /\bexpired\b/i,
    /\bwrong spelling\b/i,
    /\bmisspelled\b/i,
    /\bbroken seal\b/i,
    /\bcheap\b/i,
    /\bunlicensed\b/i
];

const BARCODE_PATTERN = /\b\d{8,14}\b/;

function normalizeText(value = '') {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function hasAnyPattern(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
}

function getRiskRank(level = 'LOW') {
    const ranks = {
        LOW: 1,
        MODERATE: 2,
        HIGH: 3,
        EMERGENCY: 4
    };

    return ranks[level] || 1;
}

function buildCandidate(intent, riskLevel, summary, reason, signals = []) {
    return {
        intent,
        riskLevel,
        summary,
        reason,
        signals
    };
}

function looksLikeDrugRelatedText(text = '') {
    return hasAnyPattern(text, DRUG_PATTERNS) || BARCODE_PATTERN.test(text);
}

function looksLikeDrugImageContext(text = '') {
    return hasAnyPattern(text, DRUG_IMAGE_PATTERNS);
}

function classifyHealthIntent(input = {}) {
    const message = normalizeText(input.message || input.symptoms || '');
    const notes = normalizeText(input.notes || '');
    const barcodeValue = normalizeText(input.barcodeValue || '');
    const imageContext = normalizeText(input.imageContext || '');
    const combined = normalizeText(`${message} ${notes} ${imageContext} ${barcodeValue}`);
    const lowerCombined = combined.toLowerCase();
    const candidates = [];

    const hasMentalEmergency = hasAnyPattern(lowerCombined, EMERGENCY_MENTAL_PATTERNS);
    const hasMentalHigh = hasAnyPattern(lowerCombined, HIGH_DISTRESS_PATTERNS);
    const hasMentalModerate = hasAnyPattern(lowerCombined, MODERATE_DISTRESS_PATTERNS);
    const hasDrugSignals = looksLikeDrugRelatedText(lowerCombined) || looksLikeDrugImageContext(lowerCombined) || Boolean(barcodeValue);
    const hasEmergencyPhysical = hasAnyPattern(lowerCombined, EMERGENCY_PHYSICAL_PATTERNS);
    const hasHighPhysical = hasAnyPattern(lowerCombined, HIGH_PHYSICAL_PATTERNS);
    const hasCommonSymptoms = hasAnyPattern(lowerCombined, COMMON_SYMPTOM_PATTERNS);
    const hasCounterfeitSignals = hasAnyPattern(lowerCombined, COUNTERFEIT_PATTERNS);

    if (hasMentalEmergency) {
        candidates.push(buildCandidate(
            'mental_support',
            'EMERGENCY',
            'The message suggests immediate emotional safety risk.',
            'Self-harm or suicide-related language was detected.',
            ['mental_health', 'emergency']
        ));
    } else if (hasMentalHigh) {
        candidates.push(buildCandidate(
            'mental_support',
            'HIGH',
            'The message suggests severe emotional distress that needs calming support and human follow-up.',
            'High-distress language was detected.',
            ['mental_health']
        ));
    } else if (hasMentalModerate) {
        candidates.push(buildCandidate(
            'mental_support',
            'MODERATE',
            'The message sounds emotionally distressed and may benefit from grounding support.',
            'Distress-related language was detected.',
            ['mental_health']
        ));
    }

    if (hasEmergencyPhysical) {
        candidates.push(buildCandidate(
            'symptom_analysis',
            'EMERGENCY',
            'The message includes physical red-flag symptoms that need urgent medical triage.',
            'Emergency physical symptom language was detected.',
            ['physical_symptoms', hasDrugSignals ? 'drug_related' : '']
        ));
    } else if (hasHighPhysical) {
        candidates.push(buildCandidate(
            'symptom_analysis',
            'HIGH',
            'The message includes physical symptoms that may need urgent same-day review.',
            'High-risk symptom language was detected.',
            ['physical_symptoms', hasDrugSignals ? 'drug_related' : '']
        ));
    } else if (hasCommonSymptoms) {
        candidates.push(buildCandidate(
            'symptom_analysis',
            'MODERATE',
            'The message looks like a physical symptom report.',
            'Common symptom language was detected.',
            ['physical_symptoms']
        ));
    }

    if (hasDrugSignals) {
        const drugRisk = hasEmergencyPhysical
            ? 'HIGH'
            : hasCounterfeitSignals
                ? 'HIGH'
                : /side effect|reaction|allergy|swelling after taking|rash after taking/i.test(lowerCombined)
                    ? 'HIGH'
                    : 'MODERATE';

        candidates.push(buildCandidate(
            'drug_checker',
            drugRisk,
            barcodeValue
                ? 'The message appears to be about medicine verification with barcode or package details.'
                : 'The message appears to be about a medicine, package, or possible side effect.',
            barcodeValue
                ? 'Medicine verification details, including a barcode, were detected.'
                : 'Drug-related language was detected.',
            ['drug_related', barcodeValue ? 'barcode' : '', hasCounterfeitSignals ? 'counterfeit_risk' : '']
        ));
    }

    if (candidates.length === 0) {
        return {
            intent: 'symptom_analysis',
            kind: 'text',
            riskLevel: 'LOW',
            summary: 'No clear medicine or emotional-support intent was detected, so the message will be handled as symptom guidance.',
            reason: 'Fallback to symptom analysis.',
            supportingIntents: []
        };
    }

    const sorted = candidates.sort((left, right) => {
        const riskDiff = getRiskRank(right.riskLevel) - getRiskRank(left.riskLevel);
        if (riskDiff !== 0) {
            return riskDiff;
        }

        const priority = {
            mental_support: 3,
            symptom_analysis: 2,
            drug_checker: 1
        };

        return (priority[right.intent] || 0) - (priority[left.intent] || 0);
    });

    const primary = sorted[0];
    const supportingIntents = sorted
        .slice(1)
        .map((candidate) => candidate.intent)
        .filter((value, index, values) => value && values.indexOf(value) === index);

    return {
        intent: primary.intent,
        kind: primary.intent === 'drug_checker'
            ? 'drug'
            : primary.intent === 'mental_support'
                ? 'mental_support'
                : 'text',
        riskLevel: primary.riskLevel,
        summary: primary.summary,
        reason: primary.reason,
        supportingIntents
    };
}

module.exports = {
    classifyHealthIntent,
    looksLikeDrugImageContext,
    looksLikeDrugRelatedText
};
