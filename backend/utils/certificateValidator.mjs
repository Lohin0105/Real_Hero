import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Validates a blood donation certificate using Gemini Vision.
 * @param {string} base64Image - Base64 string of the certificate
 * @param {Object} donationInfo - { donorName, hospital, date, bloodGroup }
 * @returns {Promise<Object>} - { isValid: boolean, confidence: number, reason: string }
 */
export const validateCertificate = async (base64Image, donationInfo) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Clean base64 string
        const cleanBase64 = base64Image.split(',')[1] || base64Image;

        const prompt = `
            Analyze this blood donation certificate image.
            
            DONATION DETAILS TO VERIFY:
            Donor Name: ${donationInfo.donorName}
            Hospital: ${donationInfo.hospital}
            Date: ${donationInfo.date}
            Blood Group: ${donationInfo.bloodGroup}
            
            TASK:
            1. Extract the name, hospital, date, and blood group from the certificate.
            2. Compare them with the provided donation details.
            3. Determine if the certificate is authentic and matches the donation.
            
            Return the result in EXACT JSON format:
            {
                "isValid": boolean,
                "confidence": number (0-1),
                "extracted": {
                    "name": "...",
                    "hospital": "...",
                    "date": "...",
                    "bloodGroup": "..."
                },
                "reason": "..."
            }
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (handling potential markdown blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error("Failed to parse AI response as JSON");
    } catch (error) {
        console.error('Certificate validation failed:', error);
        return { isValid: false, confidence: 0, reason: "Verification process failed: " + error.message };
    }
};
