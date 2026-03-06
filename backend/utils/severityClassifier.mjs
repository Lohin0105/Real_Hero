import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Classifies the severity of a blood request based on hospital name and description.
 * @param {string} hospital 
 * @param {string} description 
 * @returns {Promise<string>} - 'high', 'medium', or 'low'
 */
export const classifySeverity = async (hospital, description) => {
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of modelsToTry) {
        try {
            console.log(`AI Severity: Attempting classification with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
                Analyze the following blood donation request hospital and description.
                Hospital: ${hospital}
                Description: ${description}
                
                Classify the severity into one of these three exact words: "high", "medium", or "low".
                - "high": Critical emergencies, accidents, ICU, urgent surgery required now, multiple trauma.
                - "medium": Scheduled surgery, chronic conditions but needing transfusion soon, stable patients.
                - "low": Routine requests, upcoming elective procedures, maintenance transfusions.
                
                Return ONLY the word: high, medium, or low.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim().toLowerCase();

            if (['high', 'medium', 'low'].includes(text)) {
                console.log(`AI Severity: Success with ${modelName} -> ${text}`);
                return text;
            }
        } catch (error) {
            console.warn(`AI Severity: Model ${modelName} failed or not found.`, error.message);
            // Continue to next model
        }
    }

    console.warn('AI Severity: All models failed or returned invalid response, falling back to medium.');
    return 'medium'; // Default fallback
};
