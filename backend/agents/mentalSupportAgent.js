const { callLLM } = require('../tools/openaiService');
const { hasOpenAIKey } = require('../tools/runtime');
const { detectLanguage } = require('../tools/languagePacks');
const { normalizeMentalSupportResult } = require('../tools/agentContracts');

const EMERGENCY_PATTERNS = [
    /\bkill myself\b/i,
    /\bend my life\b/i,
    /\bwant to die\b/i,
    /\bsuicid/i,
    /\bself[\s-]?harm\b/i,
    /\bhurt myself\b/i,
    /\bi have a plan\b/i,
    /\bi'm going to do it\b/i
];

const HIGH_PATTERNS = [
    /\bhopeless\b/i,
    /\bworthless\b/i,
    /\bpanic attack\b/i,
    /\bcan't cope\b/i,
    /\bcan't go on\b/i,
    /\boverwhelmed\b/i,
    /\bafraid to be alone\b/i,
    /\bno reason to live\b/i
];

const MODERATE_PATTERNS = [
    /\banxious\b/i,
    /\bstressed\b/i,
    /\bcrying\b/i,
    /\bcan't sleep\b/i,
    /\bdepressed\b/i,
    /\blonely\b/i,
    /\bnumb\b/i,
    /\bburned out\b/i
];

function inferRiskLevel(text = '') {
    if (EMERGENCY_PATTERNS.some((pattern) => pattern.test(text))) {
        return 'Emergency';
    }

    if (HIGH_PATTERNS.some((pattern) => pattern.test(text))) {
        return 'High';
    }

    if (MODERATE_PATTERNS.some((pattern) => pattern.test(text))) {
        return 'Moderate';
    }

    return 'Low';
}

function inferEmotionalState(text = '') {
    const sample = text.toLowerCase();

    if (/panic|shaking|can't breathe|heart racing/.test(sample)) return 'Acute anxiety or panic';
    if (/sad|depress|hopeless|empty|worthless/.test(sample)) return 'Low mood or hopelessness';
    if (/angry|furious|frustrated/.test(sample)) return 'High frustration';
    if (/lonely|alone|isolated/.test(sample)) return 'Isolation or loneliness';
    if (/overwhelmed|stressed|burned out/.test(sample)) return 'Overwhelm or stress';
    return 'Emotional strain';
}

function buildFallback(input = {}) {
    const sessionMessages = Array.isArray(input.sessionMessages) ? input.sessionMessages : [];
    const transcript = [
        ...sessionMessages.map((entry) => `${entry.role || 'user'}: ${entry.text || ''}`),
        input.message || ''
    ].join(' ').trim();
    const riskLevel = inferRiskLevel(transcript);
    const detectedLanguage = detectLanguage(transcript) || 'English';
    const emotionalState = inferEmotionalState(transcript);
    const emergency = riskLevel === 'Emergency';
    const highRisk = emergency || riskLevel === 'High';

    return {
        detectedLanguage,
        riskLevel,
        emotionalState,
        supportFocus: emergency
            ? 'Immediate human safety support'
            : highRisk
                ? 'Calming distress and connecting to real-world support'
                : 'Stabilizing emotions and building the next safe step',
        validation: emergency
            ? 'I am really glad you said this out loud. You deserve immediate support from a real person right now.'
            : highRisk
                ? 'What you are describing sounds heavy and real. You do not have to carry it alone.'
                : 'What you are feeling matters, and it makes sense to want support with it.',
        supportiveResponse: emergency
            ? 'Please do not stay alone with this. Move toward another person, put distance between yourself and anything you could use to hurt yourself, and contact emergency support now. If you are in the US or Canada, call or text 988. Otherwise call your local emergency or crisis service now.'
            : highRisk
                ? 'Let us slow this moment down first. Put both feet on the floor, loosen your shoulders, and take one longer exhale than inhale a few times. Then reach out to one trusted person and tell them you need support today.'
                : 'Let us take one small stabilizing step. Breathe out slowly, unclench your jaw, and focus on one thing you can see, one thing you can feel, and one thing you can hear before deciding what you need next.',
        groundingSteps: emergency
            ? [
                'Go to a place where another person is present right now.',
                'Put away medicines, blades, cords, or anything you could use to hurt yourself.',
                'Say out loud: I need support right now, and contact a trusted person immediately.'
            ]
            : [
                'Take one slow breath in and a longer breath out three times.',
                'Name five things you can see, four you can feel, and three you can hear.',
                'Drink a little water or wash your face with cool water if that feels safe.'
            ],
        copingSteps: highRisk
            ? [
                'Text or call one trusted person and use simple words such as: I need you with me right now.',
                'Reduce stimulation for a moment by sitting down, lowering noise, or stepping away from stressful input.',
                'Avoid alcohol, recreational drugs, or isolation while the distress is this high.'
            ]
            : [
                'Write down the main feeling in one sentence instead of carrying it all mentally.',
                'Choose one gentle next action such as stretching, stepping outside briefly, or messaging someone safe.',
                'If this feeling keeps returning, arrange follow-up with a counselor, therapist, or trusted clinician.'
            ],
        sessionGuidance: [
            'Reply with what feels hardest right now, and I will help you break it into a smaller next step.',
            'If talking feels easier than typing, use the microphone and speak naturally.'
        ],
        followUpSuggestion: emergency
            ? 'Stay with human support until the immediate danger passes.'
            : highRisk
                ? 'Make contact with one real person today and tell them you need emotional support.'
                : 'Keep the session going if you want, and we can work through the feeling one step at a time.',
        whenToSeekImmediateHelp: [
            'Seek immediate help now if you may act on thoughts of suicide or self-harm.',
            'Get urgent support if you cannot keep yourself safe, are hearing commands to harm yourself, or feel completely unable to cope.'
        ],
        continuePrompt: emergency
            ? 'Can you move closer to another person and tell me once that is done?'
            : 'Tell me what happened today or what feeling is strongest right now.',
        audioReply: emergency
            ? 'You deserve immediate human support right now. Move toward another person and contact emergency or crisis help now.'
            : highRisk
                ? 'You are not alone in this moment. Slow your breathing, reach out to one trusted person, and let us take the next step together.'
                : 'You matter, and we can take this one step at a time. Start with one slow exhale, then tell me what feels hardest.',
        needsUrgentEscalation: emergency
    };
}

async function mentalSupportAgent(input = {}) {
    const fallback = buildFallback(input);

    if (!hasOpenAIKey()) {
        return normalizeMentalSupportResult(fallback, fallback);
    }

    const safeMessages = Array.isArray(input.sessionMessages)
        ? input.sessionMessages
            .filter((entry) => entry && typeof entry.text === 'string' && typeof entry.role === 'string')
            .slice(-10)
            .map((entry) => `${entry.role}: ${entry.text}`)
        : [];

    const systemPrompt = `You are AetherMed Agentic's Mental Support Agent.

You provide emotional safety support, grounding, calming guidance, and clear escalation when the user may be in danger.

Rules:
- Be warm, direct, non-judgmental, and practical.
- This is support, not a diagnosis or therapy replacement.
- If the user may be suicidal, planning self-harm, unable to stay safe, or otherwise in immediate danger, set riskLevel to "Emergency" and prioritize immediate human help.
- For crisis situations, tell the user to move toward another person, put distance between themselves and anything they could use for self-harm, and contact emergency/crisis support now.
- If relevant, you may mention that in the US and Canada the user can call or text 988, but do not assume their country.
- Avoid long paragraphs. Give clear steps the user can follow right now.
- Respond in the likely user language when possible.
- Keep grounding steps concrete and short.
- The supportiveResponse should sound like a real reply to the user, not a label.
- The audioReply should be a concise spoken-friendly version of the reply.

Return a strict JSON object with this exact schema:
{
  "detectedLanguage": "English or the user's likely language",
  "riskLevel": "Low" | "Moderate" | "High" | "Emergency",
  "emotionalState": "short description",
  "supportFocus": "short focus line",
  "validation": "validating sentence",
  "supportiveResponse": "main response to the user",
  "groundingSteps": ["step 1", "step 2"],
  "copingSteps": ["step 1", "step 2"],
  "sessionGuidance": ["guidance 1", "guidance 2"],
  "followUpSuggestion": "follow-up line",
  "whenToSeekImmediateHelp": ["warning 1", "warning 2"],
  "continuePrompt": "one supportive question or prompt",
  "audioReply": "short spoken reply",
  "needsUrgentEscalation": true
}`;

    const userContext = [
        'Current user message:',
        input.message || '',
        '',
        'Recent session messages:',
        safeMessages.join('\n') || 'No previous session messages.'
    ].join('\n');

    try {
        const result = await callLLM(systemPrompt, userContext);
        return normalizeMentalSupportResult(result, fallback);
    } catch (error) {
        console.warn('Mental support LLM failed, using structured fallback.', error.message);
        return normalizeMentalSupportResult(fallback, fallback);
    }
}

module.exports = { mentalSupportAgent };
