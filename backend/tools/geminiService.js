const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Common wrapper for calling Gemini models with JSON response forcing.
 * @param {string} systemPrompt 
 * @param {string} userContext 
 * @returns {Object} JSON formatted object
 */
async function callLLM(systemPrompt, userContext) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key missing or invalid. Check your .env file.");
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
            },
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(userContext);
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error) {
        console.error("LLM Error:", error);
        throw error;
    }
}

module.exports = { callLLM };
