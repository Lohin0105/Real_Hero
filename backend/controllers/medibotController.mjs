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

**What to Do with Coins:**
- Coins are recognition of your heroic contributions
- Points determine your leaderboard ranking
- Both show your impact on saving lives
- Future: Redeem for certificates, badges, or partner discounts

**Other Features:**
- **My Donations:** Track your donation history
- **Requested Donations:** See requests you've helped with
- **Dashboard:** View nearby emergency requests and inspiring quotes
- **Profile:** Update your blood group, phone, location, and photo

**Important Notes:**
- Location permission helps find nearby requests (within 50 km)
- Keep your profile updated for accurate matching
- You'll receive email notifications for confirmations
- All donor information is kept confidential

TONE: Be empathetic, professional, and encouraging. Use bullet points for lists. When users ask about app features, provide step-by-step guidance.`;

// Get all chat sessions for the user
export const getAllSessions = async (req, res) => {
    try {
        const userId = req.user._id;
        // only return essential info for sidebar (title, createdAt, updatedAt)
        const sessions = await ChatSession.find({ user: userId })
            .select('_id title createdAt updatedAt')
            .sort({ updatedAt: -1 });

        res.status(200).json(sessions);
    } catch (error) {
        console.error("fetch all sessions error:", error);
        res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
};

// Get a specific chat session by ID
export const getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;

        const session = await ChatSession.findOne({ _id: sessionId, user: userId });
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        res.status(200).json(session);
    } catch (error) {
        console.error("fetch session error:", error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
};

// Delete a chat session
export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;

        const session = await ChatSession.findOneAndDelete({ _id: sessionId, user: userId });
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        res.status(200).json({ message: "Session deleted successfully" });
    } catch (error) {
        console.error("delete session error:", error);
        res.status(500).json({ error: "Failed to delete session" });
    }
};

export const chatWithMediBot = async (req, res) => {
    try {
        const { sessionId, message, image } = req.body;
        const userId = req.user._id;

        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, user: userId });
        }

        if (!session) {
            const title = message ? (message.length > 30 ? message.substring(0, 30) + '...' : message) : 'New Conversation';
            session = new ChatSession({ user: userId, title, messages: [] });
        }

        // 1. Add User Message to history (only if content is non-empty)
        const userMsgContent = message || (image ? "[Image uploaded]" : "");
        const userMsgDoc = { role: "user", content: userMsgContent };
        if (image) userMsgDoc.image = image;
        session.messages.push(userMsgDoc);

        let replyContent = "";

        if (image) {
            // ── STEP 1: Identify medicine from image using Groq Vision ──
            // Convert base64 to format Groq expects
            const imageContent = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

            const identifyMessages = [
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: { url: imageContent }
                        },
                        {
                            type: "text",
                            text: `You are a medical image analysis assistant. Look at this image of a medicine/tablet/prescription.
Extract and return ONLY the medicine name visible in the image (brand name and/or generic name).
Format: just the medicine name, e.g. "Dolo 650" or "Paracetamol 500mg" or "Ibuprofen 400mg".
If you cannot identify any medicine, return exactly: "medicine not confidently identified"
${message ? `User note: "${message}"` : ""}`
                        }
                    ]
                }
            ];

            const identifyResult = await groq.chat.completions.create({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: identifyMessages,
                max_tokens: 100,
                temperature: 0.1
            });

            const identifiedMedicine = (identifyResult.choices[0]?.message?.content || "").trim();

            if (!identifiedMedicine || identifiedMedicine.toLowerCase().includes("not confidently identified")) {
                replyContent = "I'm sorry, I could not confidently identify a medicine from that image. Please try a clearer photo of the medicine strip, tablet, or packaging.\n\n> ⚠️ Always consult a licensed physician or pharmacist for medical advice.";
            } else {
                // ── STEP 2: Query OpenFDA for verified drug data ──
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

                // ── STEP 3: Summarize using Groq text model ──
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
                    summaryPrompt = `You are MediBot, a medical AI assistant on the Real-Hero blood donation platform.
The user uploaded a medicine image. It was identified as: **${identifiedMedicine}**

Verified OpenFDA data:
${JSON.stringify(fda, null, 2).substring(0, 2500)}

Based ONLY on this data, provide a clear structured summary with:
- 💊 **Medicine Name** (brand & generic)
- 🎯 **What it is used for**
- 👤 **Who should use it** (age groups, conditions)
- ⚠️ **Important Warnings & Precautions**
- 🔬 **Active Ingredients**
- 🏭 **Manufacturer**

End with: *"⚠️ This information is from the OpenFDA database. Always consult a licensed physician before use."*`;
                } else {
                    summaryPrompt = `You are MediBot, a knowledgeable medical AI assistant on the Real-Hero blood donation platform.

The user photographed a medicine and it was identified as: **${identifiedMedicine}**

It was not found in the OpenFDA database — it is likely a popular Indian brand. Use your comprehensive medical knowledge to provide a DETAILED, well-structured response covering ALL the sections below. Do NOT skip any section. Do NOT just output only the disclaimer.

---

## 💊 Medicine Name
State the full brand name and its generic/chemical name.

## 🎯 What It Is Used For
List all the common medical conditions this medicine treats or manages. Be thorough.

## 👤 Who Should Use It
- Suitable age groups (children, adults, elderly)
- Specific conditions where it is recommended
- Who it is prescribed for most often

## 📏 Dosage & How to Take It
- Typical dosage (e.g., 500mg twice a day)
- How to take it (with food, without food, with water, etc.)
- Duration of typical course

## ⚠️ Precautions & Warnings
- Who should NOT take it (contraindications)
- Conditions to be careful with (kidney/liver issues, pregnancy, etc.)
- Drug interactions to watch out for

## 🔬 Active Ingredients
List the active pharmaceutical ingredient(s) and their strength.

## 😮 Possible Side Effects
List common and serious side effects users should watch for.

## ✅ Advantages
Key benefits of this medicine.

---

End your response with exactly this line:
*"⚠️ This medicine was not found in the OpenFDA database. The information above is based on general medical knowledge. Always consult a licensed physician or pharmacist before use."*`;
                }

                const summaryResult = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: summaryPrompt }],
                    max_tokens: 1500,
                    temperature: 0.4
                });

                replyContent = summaryResult.choices[0]?.message?.content || "I was unable to generate a summary for this medicine.";
            }

        } else {
            // ── TEXT ONLY: Use Groq with system prompt ──
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

        // Ensure replyContent is never empty before saving
        if (!replyContent || replyContent.trim() === "") {
            replyContent = "I'm having trouble processing that request. Please try again.";
        }

        // Add Assistant Reply to History
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
