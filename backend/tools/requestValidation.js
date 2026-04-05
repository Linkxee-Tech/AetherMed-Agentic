const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(all\s+|any\s+|the\s+)?previous instructions/i,
    /ignore\s+(all\s+|any\s+|the\s+)?above instructions/i,
    /system prompt/i,
    /developer message/i,
    /tool call/i,
    /function call/i,
    /act as /i,
    /roleplay as /i,
    /jailbreak/i,
    /<script/i
];

function normalizeWhitespace(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
}

function sanitizeTextField(value, { maxLength = 1000, required = false, fieldName = 'Input' } = {}) {
    if (value == null || value === '') {
        if (required) {
            throw new Error(`${fieldName} is required.`);
        }

        return '';
    }

    if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be a text value.`);
    }

    const cleaned = normalizeWhitespace(value.replace(/\0/g, ''));

    if (!cleaned) {
        if (required) {
            throw new Error(`${fieldName} is required.`);
        }

        return '';
    }

    if (cleaned.length > maxLength) {
        throw new Error(`${fieldName} is too long. Please shorten it and try again.`);
    }

    if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(cleaned))) {
        throw new Error(`${fieldName} contains instruction-like control text. Please describe the medical concern directly.`);
    }

    return cleaned;
}

function estimateDataUrlBytes(dataUrl = '') {
    const parts = String(dataUrl).split(',');
    const payload = parts[1] || '';
    return Math.ceil((payload.length * 3) / 4);
}

function validateImageDataUrl(imageDataUrl, { required = false, fieldName = 'Image upload', maxBytes = MAX_IMAGE_BYTES } = {}) {
    if (!imageDataUrl) {
        if (required) {
            throw new Error(`${fieldName} is required.`);
        }

        return '';
    }

    if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        throw new Error(`${fieldName} must be a valid image file.`);
    }

    if (estimateDataUrlBytes(imageDataUrl) > maxBytes) {
        throw new Error(`${fieldName} is too large. Please upload a smaller image.`);
    }

    return imageDataUrl;
}

function sanitizeUrgency(value) {
    if (value == null || value === '') {
        return 3;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        throw new Error('Urgency must be a number from 1 to 5.');
    }

    const rounded = Math.round(numeric);
    if (rounded < 1 || rounded > 5) {
        throw new Error('Urgency must be between 1 and 5.');
    }

    return rounded;
}

module.exports = {
    sanitizeTextField,
    sanitizeUrgency,
    validateImageDataUrl
};
