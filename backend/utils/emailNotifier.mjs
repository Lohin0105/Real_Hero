// backend/utils/emailNotifier.mjs
// Uses Resend (https://resend.com) - works on all cloud servers including Render free tier

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev"; // use your verified domain email in prod
const MOCK_EMAIL = process.env.MOCK_EMAIL === "true";

if (!RESEND_API_KEY && !MOCK_EMAIL) {
  console.error("❌ CRITICAL: RESEND_API_KEY is missing! Emails will NOT be sent.");
  console.error("  → Sign up free at https://resend.com and add RESEND_API_KEY to Render env vars.");
} else if (MOCK_EMAIL) {
  console.log("🟠 MOCK EMAIL MODE: Emails will be logged to console only.");
} else {
  console.log("📧 RESEND EMAIL MODE: Using Resend API to send emails.");
}

function normalizeRecipients(to) {
  if (!to) return [];
  if (Array.isArray(to)) return to.map(String).filter(Boolean);
  return String(to).split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

export async function sendMail({ to, subject, html, text }) {
  console.log(`[Email] Sending to: ${to} | Subject: ${subject}`);

  if (MOCK_EMAIL) {
    console.log("\n-------- 📧 MOCK EMAIL --------");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || "(HTML)"}`);
    console.log("--------------------------------\n");
    return { ok: true, info: { messageId: "mock-" + Date.now() } };
  }

  if (!RESEND_API_KEY) {
    console.error("❌ Cannot send email: RESEND_API_KEY not set.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const recipients = normalizeRecipients(to);
    if (recipients.length === 0) {
      console.warn("sendMail: no recipients");
      return { ok: false, error: "missing recipient" };
    }

    const body = {
      from: FROM_EMAIL,
      to: recipients,
      subject: subject || "(no subject)",
      html: html || text || "",
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Resend error:", res.status, JSON.stringify(data));
      return { ok: false, error: data };
    }

    console.log("✅ Email sent via Resend:", data.id);
    return { ok: true, info: { messageId: data.id } };

  } catch (err) {
    console.error("❌ sendMail exception:", err?.message || err);
    return { ok: false, error: err };
  }
}

export async function sendMailToMany({ to, subject, html, text }) {
  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) return { ok: false, error: "missing recipients" };

  const results = [];
  for (const r of recipients) {
    const resp = await sendMail({ to: r, subject, html, text });
    results.push({ to: r, ok: Boolean(resp.ok), info: resp.info, error: resp.error || null });
  }
  return { ok: true, results };
}
