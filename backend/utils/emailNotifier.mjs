// backend/utils/emailNotifier.mjs
// Uses SendGrid (@sendgrid/mail) — already installed, sends to ANY email address
import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_USER || "realhero.project@outlook.com";
const MOCK_EMAIL = process.env.MOCK_EMAIL === "true";

if (MOCK_EMAIL) {
  console.log("🟠 MOCK EMAIL MODE: Emails logged to console only.");
} else if (!SENDGRID_API_KEY) {
  console.error("❌ CRITICAL: SENDGRID_API_KEY is missing! Emails will NOT be sent.");
  console.error("  → Sign up free at https://sendgrid.com and add SENDGRID_API_KEY to Render env vars.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("📧 SENDGRID EMAIL MODE: Using SendGrid to send emails.");
}

function normalizeRecipients(to) {
  if (!to) return [];
  if (Array.isArray(to)) return to.map(String).filter(Boolean);
  return String(to).split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

export async function sendMail({ to, subject, html, text }) {
  console.log(`[Email] Sending to: ${to} | Subject: ${subject}`);

  if (MOCK_EMAIL) {
    console.log(`\n--- MOCK EMAIL ---\nTo: ${to}\nSubject: ${subject}\n-----------------\n`);
    return { ok: true, info: { messageId: "mock-" + Date.now() } };
  }

  if (!SENDGRID_API_KEY) {
    console.error("❌ Cannot send email: SENDGRID_API_KEY not set.");
    return { ok: false, error: "SENDGRID_API_KEY not configured" };
  }

  try {
    const recipients = normalizeRecipients(to);
    if (recipients.length === 0) {
      console.warn("sendMail: no recipients");
      return { ok: false, error: "missing recipient" };
    }

    const msg = {
      to: recipients,
      from: FROM_EMAIL,
      subject: subject || "(no subject)",
      html: html || text || "",
      text: text || (html ? html.replace(/<[^>]+>/g, "") : ""),
    };

    const [response] = await sgMail.send(msg);
    console.log("✅ Email sent via SendGrid, status:", response.statusCode);
    return { ok: true, info: { messageId: response.headers["x-message-id"] } };

  } catch (err) {
    console.error("❌ SendGrid error:", err?.response?.body || err?.message || err);
    return { ok: false, error: err?.response?.body || err?.message };
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
