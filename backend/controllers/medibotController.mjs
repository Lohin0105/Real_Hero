import Groq from "groq-sdk";
import dotenv from 'dotenv';
import ChatSession from '../models/ChatSession.mjs';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are MediBot, an advanced AI Medical Assistant for the 'Real-Hero' Blood Donation Platform.
    
YOUR RESPONSIBILITIES:
1. **Expert Guidance:** Answer questions about blood donation eligibility, process, and post-donation care.
2. **Multilingual Support:** Detect the language and reply in the SAME language (Hindi, Telugu, Tamil, Kannada, Malayalam, etc.).
3. **Platform Guide:** Help users navigate the Real-Hero app and understand its features.
4. **Medical Document Analysis:** Analyze prescriptions, X-rays, lab reports, and medicine images with expert precision.

PLATFORM FEATURES YOU MUST EXPLAIN:

**How to Donate Blood:**
- Click "Donate Blood" in the sidebar
- Toggle "Available to Donate" switch ON
- You'll see nearby blood requests matching your blood group
- Click "Call" to contact requester or "Navigate" to get directions
- After donating, you'll receive email confirmation and rewards

**How to Request Blood:**
- Click "Request Blood" in the sidebar
- Fill in patient details (name, blood group, hospital, phone)
- Add urgency level and description
- Submit - nearby donors will be notified automatically
- You'll receive donor contact details when someone offers help

**Rewards System:**
- **Primary Donor:** 100 coins + 50 points (the hero who donates)
- **Requester:** 50 coins + 25 points (for creating request)
- **Backup Donors:** 25 coins + 10 points (for offering help)
- Check "Rewards" page to see your coins and points
- View "Leaderboard" to see top donors

**Other Features:**
- **My Donations:** Track your donation history
- **Dashboard:** View nearby emergency requests
- **Profile:** Update your blood group, phone, location, and photo

TONE: Be empathetic, professional, and encouraging. Use bullet points for lists.`;

// ── Helper: build base64 image URL ──────────────────────────────────────────
const toImageUrl = (image) => image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

// ── AUTO-DETECT what type of medical document the image is ──────────────────
async function detectDocumentType(image) {
    const result = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
            role: "user",
            content: [
                { type: "image_url", image_url: { url: toImageUrl(image) } },
                {
                    type: "text",
                    text: `Look at this medical image and classify it into exactly ONE of these categories:
- "prescription" → if it shows a doctor's prescription with medicine names, dosages, patient/doctor info
- "xray" → if it is an X-ray, MRI, CT scan, ultrasound, or any radiological image
- "report" → if it is a lab report, blood test, urine test, pathology report, or medical test results
- "medicine" → if it shows a medicine strip, tablet packaging, capsule blister pack, or medicine bottle label
- "other" → if it is none of the above

Reply with ONLY one word from the list above. No explanation.`
                }
            ]
        }],
        max_tokens: 10,
        temperature: 0.1
    });
    const detected = (result.choices[0]?.message?.content || "").trim().toLowerCase();
    const valid = ["prescription", "xray", "report", "medicine"];
    return valid.includes(detected) ? detected : "other";
}

// ── PRESCRIPTION ANALYSIS ────────────────────────────────────────────────────
async function analyzePrescription(image, userNote) {
    const visionResult = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
            role: "user",
            content: [
                { type: "image_url", image_url: { url: toImageUrl(image) } },
                {
                    type: "text",
                    text: `You are a medical prescription reader. Read ALL text visible in this prescription image carefully.
Extract and list EVERYTHING you can read: doctor name, clinic, patient name, date, each medicine name, dosage, frequency, duration, and any special instructions.
Format your output as structured text. Be thorough — do not miss any medicine or instruction.
${userNote ? `User's note: "${userNote}"` : ''}`
                }
            ]
        }],
        max_tokens: 800,
        temperature: 0.1
    });

    const rawPrescription = visionResult.choices[0]?.message?.content || "";

    const summaryResult = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
            role: "user",
            content: `You are MediBot, an AI medical assistant. A user has uploaded a prescription image, and the following raw data was extracted from it:

---
${rawPrescription}
---

Format this as a beautiful, structured, easy-to-read markdown response with these sections:

## 📋 Prescription Summary

### 👨‍⚕️ Doctor & Clinic
(Doctor's name, clinic/hospital name, date if visible)

### 👤 Patient Details
(Patient name, age, date if present)

### 💊 Prescribed Medicines
For EACH medicine, list:
- **Medicine Name** — Dosage | Frequency | Duration | Purpose (if mentioned)

### 📌 Instructions & Notes
(Any dietary restrictions, follow-up date, special instructions)

### ⚠️ Important Reminders
- Complete the full course of medicines
- Do not self-medicate or adjust doses
- Consult the doctor if side effects occur

End with: *"⚠️ This is an AI interpretation. Always follow your doctor's exact instructions."*`
        }],
        max_tokens: 1500,
        temperature: 0.3
    });

    return summaryResult.choices[0]?.message?.content || "Could not analyze the prescription. Please try a clearer image.";
}

// ── X-RAY / RADIOLOGY ANALYSIS ───────────────────────────────────────────────
async function analyzeXRay(image, userNote) {
    const visionResult = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
            role: "user",
            content: [
                { type: "image_url", image_url: { url: toImageUrl(image) } },
                {
                    type: "text",
                    text: `You are a radiology AI assistant. Analyze this medical imaging scan (X-ray, MRI, CT, or ultrasound).
Describe in detail:
1. What body region/organ is shown
2. The type of scan (X-ray, MRI, CT, ultrasound, etc.)
3. Visible anatomical structures
4. Any abnormalities, shadows, densities, opacities, fractures, or unusual findings
5. Overall impression based on what is visible
Be specific and thorough. Use radiological terminology but also explain in plain language.
${userNote ? `User's note/question: "${userNote}"` : ''}`
                }
            ]
        }],
        max_tokens: 800,
        temperature: 0.2
    });

    const rawFindings = visionResult.choices[0]?.message?.content || "";

    const summaryResult = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
            role: "user",
            content: `You are MediBot, an AI medical assistant with radiology expertise. The following findings were observed from a medical imaging scan:

---
${rawFindings}
---

Format a clear, patient-friendly report in this structure:

## 🫁 Radiology Scan Analysis

### 📸 Scan Information
(Type of scan, body region, orientation if visible)

### 🔬 Observations & Findings
(List each finding — normal structures and any abnormalities noted)

### 🚨 Potential Concerns
(Any findings that may require follow-up or medical attention. If none, state "No significant abnormalities detected.")

### 📊 Overall Impression
(Summary assessment in plain language)

### ✅ Recommended Next Steps
(What the patient should do — consult a specialist, get more tests, etc.)

End with: *"⚠️ This is an AI-based analysis and NOT a substitute for a radiologist's report. Please consult a licensed radiologist or physician for diagnosis."*`
        }],
        max_tokens: 1500,
        temperature: 0.3
    });

    return summaryResult.choices[0]?.message?.content || "Could not analyze the scan. Please ensure the image is a clear medical imaging scan.";
}

// ── LAB REPORT ANALYSIS ──────────────────────────────────────────────────────
async function analyzeReport(image, userNote) {
    const visionResult = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
            role: "user",
            content: [
                { type: "image_url", image_url: { url: toImageUrl(image) } },
                {
                    type: "text",
                    text: `You are a medical lab report reader. Read ALL values in this laboratory/diagnostic report carefully.
For each test, extract: test name, patient's value, unit of measurement, reference range (normal range).
Also extract patient name, age, date, lab name if visible.
List every single test result you can see. Be precise with numbers.
${userNote ? `User's question: "${userNote}"` : ''}`
                }
            ]
        }],
        max_tokens: 800,
        temperature: 0.1
    });

    const rawReport = visionResult.choices[0]?.message?.content || "";

    const summaryResult = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
            role: "user",
            content: `You are MediBot, an AI medical assistant. The following data was extracted from a lab report image:

---
${rawReport}
---

Format a comprehensive, easy-to-understand markdown report:

## 🧪 Lab Report Analysis

### 👤 Patient & Lab Info
(Patient name, age, date of report, lab name if available)

### 📊 Test Results

For EACH test result, format as:

| Test | Your Value | Normal Range | Status |
|------|-----------|--------------|--------|
(Fill in all tests. For Status: use ✅ Normal, 🔴 HIGH, 🔵 LOW based on whether value is within reference range)

### 🚨 Abnormal Values — Explained
For each abnormal result:
- **[Test Name]** — Your value: X | Normal: Y–Z
  - What it means: (plain explanation)
  - Common causes: (list 2-3 common causes)
  - What to watch out for: (symptoms or concerns)

### ✅ Normal Values
(Brief mention of which tests are within normal range)

### 📌 Overall Summary
(Plain-English summary of the overall health picture based on these results)

### 🏥 Recommended Actions
(What the patient should discuss with their doctor)

End with: *"⚠️ This is an AI interpretation. Lab values must be interpreted by your doctor in the context of your symptoms and medical history."*`
        }],
        max_tokens: 2000,
        temperature: 0.3
    });

    return summaryResult.choices[0]?.message?.content || "Could not analyze the report. Please try a clearer image showing all test values.";
}

// ── MEDICINE IMAGE ANALYSIS (existing enhanced) ───────────────────────────────
async function analyzeMedicine(image, userNote) {
    const identifyResult = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
            role: "user",
            content: [
                { type: "image_url", image_url: { url: toImageUrl(image) } },
                {
                    type: "text",
                    text: `You are a medical image analysis assistant. Look at this image of a medicine/tablet/prescription.
Extract and return ONLY the medicine name visible in the image (brand name and/or generic name).
Format: just the medicine name, e.g. "Dolo 650" or "Paracetamol 500mg" or "Ibuprofen 400mg".
If you cannot identify any medicine, return exactly: "medicine not confidently identified"
${userNote ? `User note: "${userNote}"` : ''}`
                }
            ]
        }],
        max_tokens: 100,
        temperature: 0.1
    });

    const identifiedMedicine = (identifyResult.choices[0]?.message?.content || "").trim();

    if (!identifiedMedicine || identifiedMedicine.toLowerCase().includes("not confidently identified")) {
        return "I'm sorry, I could not confidently identify a medicine from that image. Please try a clearer photo of the medicine strip, tablet, or packaging.\n\n> ⚠️ Always consult a licensed physician or pharmacist for medical advice.";
    }

    // OpenFDA lookup
    let openFDAData = null;
    try {
        const drugQuery = encodeURIComponent(identifiedMedicine.split(" ")[0]);
        const fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search=brand_name:"${drugQuery}"&limit=1`);
        if (fdaRes.ok) {
            const fdaJson = await fdaRes.json();
            if (fdaJson.results?.length > 0) openFDAData = fdaJson.results[0];
        }
        if (!openFDAData) {
            const fdaRes2 = await fetch(`https://api.fda.gov/drug/label.json?search=generic_name:"${drugQuery}"&limit=1`);
            if (fdaRes2.ok) {
                const fdaJson2 = await fdaRes2.json();
                if (fdaJson2.results?.length > 0) openFDAData = fdaJson2.results[0];
            }
        }
    } catch (fdaErr) {
        console.warn("OpenFDA lookup failed:", fdaErr.message);
    }

    let summaryPrompt;
    if (openFDAData) {
        const fda = {
            brand_name: openFDAData.openfda?.brand_name,
            generic_name: openFDAData.openfda?.generic_name,
            purpose: openFDAData.purpose,
            indications_and_usage: openFDAData.indications_and_usage,
            warnings: openFDAData.warnings,
            adverse_reactions: openFDAData.adverse_reactions,
            active_ingredient: openFDAData.active_ingredient,
            dosage_and_administration: openFDAData.dosage_and_administration,
            manufacturer_name: openFDAData.openfda?.manufacturer_name,
        };
        summaryPrompt = `You are MediBot. Medicine identified: **${identifiedMedicine}**\nOpenFDA data:\n${JSON.stringify(fda, null, 2).substring(0, 2500)}\n\nProvide structured summary:\n## 💊 ${identifiedMedicine}\n### 🎯 What it's used for\n### 👤 Who should use it\n### ⚠️ Warnings & Precautions\n### 🔬 Active Ingredients\n### 🏭 Manufacturer\n\n*"⚠️ Information from OpenFDA. Always consult a physician before use."*`;
    } else {
        summaryPrompt = `You are MediBot. Medicine identified: **${identifiedMedicine}** (not in OpenFDA — likely an Indian brand).\n\nProvide a DETAILED structured response:\n\n## 💊 Medicine Name\n## 🎯 What It Is Used For\n## 👤 Who Should Use It\n## 📏 Dosage & How to Take\n## ⚠️ Precautions & Warnings\n## 🔬 Active Ingredients\n## 😮 Possible Side Effects\n## ✅ Key Benefits\n\n*"⚠️ Not found in OpenFDA. Based on general medical knowledge. Always consult a physician."*`;
    }

    const summaryResult = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: summaryPrompt }],
        max_tokens: 1500,
        temperature: 0.4
    });

    return summaryResult.choices[0]?.message?.content || "Unable to generate a summary for this medicine.";
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Get all chat sessions
export const getAllSessions = async (req, res) => {
    try {
        const userId = req.user._id;
        const sessions = await ChatSession.find({ user: userId })
            .select('_id title createdAt updatedAt')
            .sort({ updatedAt: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        console.error("fetch all sessions error:", error);
        res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
};

// Get specific session
export const getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;
        const session = await ChatSession.findOne({ _id: sessionId, user: userId });
        if (!session) return res.status(404).json({ error: "Session not found" });
        res.status(200).json(session);
    } catch (error) {
        console.error("fetch session error:", error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
};

// Delete session
export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;
        const session = await ChatSession.findOneAndDelete({ _id: sessionId, user: userId });
        if (!session) return res.status(404).json({ error: "Session not found" });
        res.status(200).json({ message: "Session deleted successfully" });
    } catch (error) {
        console.error("delete session error:", error);
        res.status(500).json({ error: "Failed to delete session" });
    }
};

// ── Enhance Prompt ───────────────────────────────────────────────────────────
export const enhancePrompt = async (req, res) => {
    try {
        const { prompt, imageType } = req.body;
        if (!prompt?.trim()) return res.status(400).json({ error: "No prompt provided" });

        const context = imageType && imageType !== 'auto'
            ? `The user has attached a medical image of type: "${imageType}" (${imageType === 'prescription' ? 'a doctor\'s prescription' : imageType === 'xray' ? 'an X-ray/scan/MRI' : imageType === 'report' ? 'a lab/blood test report' : 'a medicine/tablet image'}).`
            : "The user may have attached a medical image.";

        const result = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: "user",
                content: `You are a prompt enhancement assistant for a medical AI chatbot called MediBot.

${context}

The user typed this basic prompt:
"${prompt}"

Rewrite it as a clear, specific, detailed prompt that will help MediBot give the best possible medical analysis. 
- Keep the core intent of what the user wants
- Add specific requests for the information that would be most useful
- Make it sound natural and conversational, not robotic
- Keep it under 3 sentences
- Do NOT add disclaimers or explain what you are doing — just output the enhanced prompt text directly.`
            }],
            max_tokens: 200,
            temperature: 0.6
        });

        const enhanced = result.choices[0]?.message?.content?.trim() || prompt;
        return res.json({ enhanced });
    } catch (error) {
        console.error("enhancePrompt error:", error);
        return res.status(500).json({ error: "Failed to enhance prompt" });
    }
};

// ── Main Chat Handler ────────────────────────────────────────────────────────
export const chatWithMediBot = async (req, res) => {
    try {
        const { sessionId, message, image, imageType } = req.body;
        const userId = req.user._id;

        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, user: userId });
        }
        if (!session) {
            const title = message ? (message.length > 30 ? message.substring(0, 30) + '...' : message) : 'Medical Image Analysis';
            session = new ChatSession({ user: userId, title, messages: [] });
        }

        // Add user message to history
        const userMsgContent = message || (image ? "[Medical image uploaded]" : "");
        const userMsgDoc = { role: "user", content: userMsgContent };
        if (image) userMsgDoc.image = image;
        session.messages.push(userMsgDoc);

        let replyContent = "";

        if (image) {
            // Determine document type
            let docType = imageType || "auto";

            if (docType === "auto" || !docType) {
                // Auto-detect from image
                docType = await detectDocumentType(image);
            }

            console.log(`MediBot image analysis: docType=${docType}`);

            // Route to specialized analyzer
            switch (docType) {
                case "prescription":
                    replyContent = await analyzePrescription(image, message);
                    break;
                case "xray":
                    replyContent = await analyzeXRay(image, message);
                    break;
                case "report":
                    replyContent = await analyzeReport(image, message);
                    break;
                case "medicine":
                    replyContent = await analyzeMedicine(image, message);
                    break;
                default:
                    // Unknown image — do a general medical analysis
                    replyContent = await groq.chat.completions.create({
                        model: "meta-llama/llama-4-scout-17b-16e-instruct",
                        messages: [{
                            role: "user",
                            content: [
                                { type: "image_url", image_url: { url: toImageUrl(image) } },
                                {
                                    type: "text",
                                    text: `You are MediBot, a medical AI assistant. Analyze this image from a medical perspective and provide whatever relevant health information you can extract or observe from it. ${message ? `User's question: "${message}"` : 'Describe what you see and any medical relevance.'}\n\n*Always end with a reminder to consult a licensed physician.*`
                                }
                            ]
                        }],
                        max_tokens: 1000,
                        temperature: 0.4
                    }).then(r => r.choices[0]?.message?.content || "I couldn't analyze this image. Please upload a clearer medical document.");
            }
        } else {
            // TEXT ONLY
            const recentMessages = session.messages.slice(-10).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content || ""
            }));

            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...recentMessages
                ],
                max_tokens: 1500,
                temperature: 0.7
            });

            replyContent = completion.choices[0]?.message?.content || "I'm having trouble responding right now. Please try again.";
        }

        if (!replyContent || replyContent.trim() === "") {
            replyContent = "I'm having trouble processing that request. Please try again.";
        }

        session.messages.push({ role: "assistant", content: replyContent });
        await session.save();

        res.status(200).json({ reply: replyContent, session });

    } catch (error) {
        console.error("MediBot Error:", error);
        res.status(500).json({
            error: "MediBot is thinking too hard!",
            details: error.message
        });
    }
};
