// backend/routes/translateRoutes.mjs
import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();

// Language code → full name for Groq prompt
const LANG_NAMES = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    ml: 'Malayalam',
    mr: 'Marathi',
    gu: 'Gujarati',
    pa: 'Punjabi',
    bn: 'Bengali',
    or: 'Odia',
    as: 'Assamese',
};

// POST /api/translate/whatsapp-message
// Body: { donorName, donorBlood, donorLang, requesterLang, requestDetails }
router.post('/whatsapp-message', async (req, res) => {
    try {
        const {
            donorName,
            donorBlood,
            donorLang = 'en',
            requesterLang = 'en',
            requestDetails,        // { name, bloodGroup, hospital, urgency, distanceKm }
        } = req.body;

        if (!donorName || !requestDetails) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const donorLangName = LANG_NAMES[donorLang] || 'English';
        const requesterLangName = LANG_NAMES[requesterLang] || 'English';

        const sameLanguage = donorLang === requesterLang;

        // Build the base English message
        const baseMessage = `
===========================
🔴 *URGENT BLOOD REQUEST* 🔴
===========================
Hello! I am *${donorName}*. I saw your request on the *Real-Hero* platform and I am stepping forward to help.

🩸 *My Blood Group:* ${donorBlood || 'Not specified'}
🏥 *Hospital/Location:* ${requestDetails.hospital || 'N/A'}
🚨 *Urgency Status:* ${requestDetails.urgency?.toUpperCase() || 'NORMAL'}
${requestDetails.distanceKm ? `📍 *Distance:* ${requestDetails.distanceKm} km away` : ''}

*Please reply to this message if you still need blood. I am ready to come to the hospital right now!* 🙏

_(Real-Hero: Saving Lives Together 🦸‍♂️)_
`.trim();

        let finalMessage = '';

        if (sameLanguage && donorLang === 'en') {
            // No translation needed
            finalMessage = baseMessage;
        } else {
            // Use Groq to produce a bilingual version
            const langInstructions = sameLanguage
                ? `Translate the following blood donation WhatsApp message into ${donorLangName}.\n\n CRITICAL: Keep ALL formatting, emojis, divider lines (=============), asterisks for bolding (*), numbers, and names EXACTLY as they are. Only translate the natural language conversational text. DO NOT add any extra conversational AI text (like 'Here is the translation:'). Return ONLY the translated message.`
                : `Translate the following blood donation WhatsApp message into TWO versions:
1. First version in ${donorLangName} (for the donor to see)
2. Second version in ${requesterLangName} (for the requester to understand)

Separate them with this EXACT string:
───────────────────────

CRITICAL RULES:
- Keep ALL emojis exactly where they are.
- Keep ALL formatting (============= lines, asterisks for bolding) exactly as they are.
- Keep numbers, platform name "Real-Hero", and placeholders exactly as-is.
- DO NOT add any extra AI conversational text (like 'Here are the translations:'). 
- Return ONLY the two translated message blocks separated by the divider, nothing else.`;

            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a vital medical communication assistant ensuring life-saving blood donation texts are accurately formatted and translated. Your output goes directly into WhatsApp. Never add conversational filler.',
                    },
                    {
                        role: 'user',
                        content: `${langInstructions}\n\n---\n${baseMessage}\n---`,
                    },
                ],
                temperature: 0.1, // lowered for stricter formatting adherence
                max_tokens: 1024,
            });

            const translated = completion.choices[0]?.message?.content?.trim() || '';

            if (sameLanguage) {
                finalMessage = translated || baseMessage;
            } else {
                // Combine: donor language version + divider + requester language version
                // If Groq already returned two blocks, use them directly
                // Otherwise fall back to: donorLang translation on top + base English below
                finalMessage = translated || `${baseMessage}\n\n───────────────────\n${baseMessage}`;
            }
        }

        return res.json({ message: finalMessage });
    } catch (err) {
        console.error('[translate/whatsapp-message] error:', err);
        return res.status(500).json({ error: err.message || 'Translation failed' });
    }
});

export default router;
