import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function listGeminiModels() {
    console.log("Fetching available Gemini models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            return;
        }

        console.log(`✅ Found ${data.models?.length || 0} models.`);
        (data.models || []).forEach(m => {
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name.replace("models/", "")}`);
            }
        });

    } catch (error) {
        console.error("❌ Network Error:", error.message);
    }
}

listGeminiModels();
