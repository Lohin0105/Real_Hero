import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;

async function listModels() {
    console.log("Fetching available models...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch models:", response.status, response.statusText);
            return;
        }

        const data = await response.json();
        console.log(`Found ${data.data.length} models.`);

        // Filter for free models
        const freeModels = data.data.filter(m => m.id.includes("free") || m.pricing.prompt === "0");
        console.log("\n--- FREE MODELS ---");
        freeModels.forEach(m => console.log(m.id));

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
