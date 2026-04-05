const axios = require('axios');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Common wrapper for calling OpenAI models with JSON output forcing.
 * Uses the Chat Completions API with `response_format: { type: "json_object" }`.
 * @param {string} systemPrompt
 * @param {string} userContext
 * @returns {Promise<Object>} JSON formatted object
 */
async function callLLM(systemPrompt, userContext) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key missing or invalid. Check backend/.env.');
    }

    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: process.env.OPENAI_MODEL || 'gpt-5-mini',
                messages: [
                    {
                        role: 'developer',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userContext
                    }
                ],
                response_format: {
                    type: 'json_object'
                },
                temperature: 0.2
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('OpenAI returned an empty response.');
        }

        return JSON.parse(content);
    } catch (error) {
        const message = error.response?.data || error.message;
        console.error('OpenAI API Error:', message);
        throw error;
    }
}

module.exports = { callLLM };
