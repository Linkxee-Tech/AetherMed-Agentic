const { callLLM, callVisionLLM } = require('../tools/openaiService');
const { hasOpenAIKey } = require('../tools/runtime');
const { detectLanguage } = require('../tools/languagePacks');
const { normalizeDrugCheckerResult } = require('../tools/agentContracts');

const SUSPICIOUS_PATTERNS = [
    /\bno batch\b/i,
    /\bno expiry\b/i,
    /\bno exp\b/i,
    /\bbroken seal\b/i,
    /\bseal broken\b/i,
    /\bsmudged\b/i,
    /\bmisspelled\b/i,
    /\bspelling mistake\b/i,
    /\bvery cheap\b/i,
    /\btoo cheap\b/i,
    /\bstreet\b/i,
    /\bopen market\b/i,
    /\bwhatsapp\b/i,
    /\binstagram seller\b/i,
    /\bunlicensed\b/i
];

function inferRiskLevel(notes = '') {
    const suspiciousCount = SUSPICIOUS_PATTERNS.filter((pattern) => pattern.test(notes)).length;

    if (suspiciousCount >= 2) {
        return 'High';
    }

    if (suspiciousCount === 1) {
        return 'Moderate';
    }

    return 'Low';
}

function buildFallback(input = {}) {
    const combined = `${input.drugName || ''} ${input.notes || ''} ${input.barcodeValue || ''}`.trim();
    const detectedLanguage = detectLanguage(combined) || 'English';
    const riskLevel = inferRiskLevel(input.notes || '');
    const hasImage = Boolean(input.imageDataUrl && input.imageDataUrl.startsWith('data:image/'));
    const barcodeValue = String(input.barcodeValue || '').trim();
    const suspiciousSignals = SUSPICIOUS_PATTERNS
        .filter((pattern) => pattern.test(input.notes || ''))
        .map((pattern) => pattern.source.replace(/\\b/gi, '').replace(/\\/g, ''))
        .slice(0, 4);

    const riskIndicators = suspiciousSignals.length
        ? suspiciousSignals.map((signal) => `The provided details mention a counterfeit-risk sign: ${signal.replace(/\|/g, ' / ')}.`)
        : [
            'AetherMed cannot confirm authenticity from packaging alone, so verification is still needed before use.'
        ];

    if (hasImage) {
        riskIndicators.unshift('A packaging image was provided, but image review alone cannot confirm whether a medicine is genuine.');
    }

    if (barcodeValue) {
        riskIndicators.unshift(`A barcode or printed code was provided for review: ${barcodeValue}.`);
    }

    return {
        detectedLanguage,
        riskLevel,
        barcodeValue,
        authenticityStatus: riskLevel === 'High' ? 'Suspicious - avoid use until verified' : riskLevel === 'Moderate' ? 'Needs verification before use' : 'Lower apparent risk but still verify',
        productSummary: input.drugName
            ? `${input.drugName} was reviewed for counterfeit-risk warning signs.`
            : barcodeValue
                ? 'A medicine package, barcode, or description was reviewed for counterfeit-risk warning signs.'
                : 'A medicine package or description was reviewed for counterfeit-risk warning signs.',
        riskIndicators,
        safeChecks: [
            'Check the product name, strength, batch number, expiry date, and seal for consistency.',
            barcodeValue ? 'Compare the barcode or printed code with the pharmacy invoice, official packaging, or regulator information if available.' : 'If there is a barcode or printed code, compare it with trusted packaging or pharmacy records.',
            'Verify the medicine only through a licensed pharmacy, pharmacist, hospital, or official regulator process.',
            'Compare the packaging with a trusted source if you have a known genuine pack.'
        ],
        whatToDoNext: [
            riskLevel === 'High'
                ? 'Do not take the medicine until a pharmacist or licensed seller confirms it is genuine.'
                : 'Ask a pharmacist or licensed seller to verify the product before relying on it.',
            'Keep the packaging, receipt, and seller details in case the product needs to be reported.'
        ],
        urgentWarnings: [
            'Seek urgent medical care if the person already took the medicine and now has trouble breathing, severe rash, swelling, fainting, chest pain, or persistent vomiting.',
            'Get professional help quickly if the medicine is for a critical condition and you are unsure whether it is genuine.'
        ],
        finalAdvice: riskLevel === 'High'
            ? 'This medicine description raises enough concern that the safest next step is to avoid using it until a pharmacist or licensed authority verifies it.'
            : 'Use this as a counterfeit-risk screen only, and verify the product with a pharmacist or trusted licensed source before depending on it.',
        shouldAvoidUse: riskLevel === 'High'
    };
}

async function drugCheckerAgent(input = {}) {
    const fallback = buildFallback(input);

    if (!hasOpenAIKey()) {
        return normalizeDrugCheckerResult(fallback, fallback);
    }

    const sharedSchema = `Return a strict JSON object with this exact schema:
{
  "detectedLanguage": "English or the user's likely language",
  "riskLevel": "Low" | "Moderate" | "High",
  "barcodeValue": "detected or provided barcode text if available",
  "authenticityStatus": "short status line",
  "productSummary": "one short summary",
  "riskIndicators": ["indicator 1", "indicator 2"],
  "safeChecks": ["safe check 1", "safe check 2"],
  "whatToDoNext": ["next step 1", "next step 2"],
  "urgentWarnings": ["urgent warning 1", "urgent warning 2"],
  "finalAdvice": "final guidance",
  "shouldAvoidUse": true
}`;

    const systemPrompt = `You are AetherMed Agentic's Drug Checker.

Your task is to help prevent fake or unsafe drug usage.

Rules:
- You are not a lab, regulator, or pharmacist performing a formal authentication.
- Never claim a medicine is definitely genuine from text or an image alone.
- You may identify counterfeit-risk warning signs, suspicious packaging details, risky seller descriptions, and missing verification details.
- If important checks are missing, say the medicine still needs verification before use.
- If the details are strongly suspicious, advise against use until a pharmacist or licensed authority verifies the product.
- Keep the guidance practical, cautious, and easy to follow.
- If the medicine may already have been taken and the user describes a dangerous reaction, include urgent medical advice.
- Respond in the likely user language when possible.

${sharedSchema}`;

    try {
        let result;

        if (input.imageDataUrl) {
            const userContext = [
                `Drug name: ${input.drugName || 'Not provided.'}`,
                `Barcode or printed code: ${input.barcodeValue || 'Not provided.'}`,
                `User notes: ${input.notes || 'None provided.'}`,
                'Review the uploaded medicine image for counterfeit-risk cues only. Do not claim certainty about authenticity.'
            ].join('\n');

            result = await callVisionLLM(systemPrompt, userContext, input.imageDataUrl);
        } else {
            const userContext = [
                `Drug name: ${input.drugName || 'Not provided.'}`,
                `Barcode or printed code: ${input.barcodeValue || 'Not provided.'}`,
                `User notes: ${input.notes || 'None provided.'}`,
                'Review the medicine description for counterfeit-risk cues only. Do not claim certainty about authenticity.'
            ].join('\n');

            result = await callLLM(systemPrompt, userContext);
        }

        return normalizeDrugCheckerResult(result, fallback);
    } catch (error) {
        console.warn('Drug checker LLM failed, using structured fallback.', error.message);
        return normalizeDrugCheckerResult(fallback, fallback);
    }
}

module.exports = { drugCheckerAgent };
