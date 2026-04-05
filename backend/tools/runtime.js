function getAgentMode() {
    return (process.env.AETHERMED_AGENT_MODE || 'auto').toLowerCase();
}

function hasOpenAIKey() {
    return Boolean(process.env.OPENAI_API_KEY);
}

function isOfflineOnlyMode() {
    return getAgentMode() === 'offline';
}

function shouldUseOfflineAgents() {
    return isOfflineOnlyMode() || !hasOpenAIKey();
}

function shouldUseLiveTranslation() {
    return !isOfflineOnlyMode() && hasOpenAIKey();
}

function getTranslationMode() {
    if (shouldUseLiveTranslation()) {
        return 'openai-first';
    }

    return 'offline-only';
}

module.exports = {
    getAgentMode,
    getTranslationMode,
    hasOpenAIKey,
    isOfflineOnlyMode,
    shouldUseLiveTranslation,
    shouldUseOfflineAgents
};
