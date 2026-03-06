// backend/utils/emailNotifier.mjs
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const FROM_EMAIL = process.env.EMAIL_USER || process.env.EMAIL_FROM || "no-reply@real-hero.local";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.EMAIL_USER || process.env.SMTP_USER || "";
const SMTP_PASS = process.env.EMAIL_PASS || process.env.SMTP_PASS || "";

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error("❌ CRITICAL: SMTP configuration incomplete!");
  console.error("Missing variables:", {
    SMTP_HOST: SMTP_HOST ? "✓" : "✗ MISSING",
    SMTP_USER: SMTP_USER ? "✓" : "✗ MISSING",
    SMTP_PASS: SMTP_PASS ? "✓" : "✗ MISSING",
    EMAIL_USER: FROM_EMAIL || "✗ MISSING"
  });
  console.error("⚠️  Email functionality will NOT work without these variables!");
  console.error("📖 See DEPLOYMENT.md for setup instructions.");
}

let transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // port 587 is not secure
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS.replace(/\s+/g, ""), // Remove spaces from app password
  },
  tls: {
    rejectUnauthorized: false,
  },
  logger: true,
  debug: true,
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
    // Don't crash, just log. Email sending will fail gracefully later if attempted.
  } else {
    console.log('✅ SMTP Server Ready');
  }
});

// Handle transport errors to prevent crash
transporter.on('error', (err) => {
  console.error('❌ SMTP Transport Error:', err.message);
});

// MOCK EMAIL LOGIC
const MOCK_EMAIL = process.env.MOCK_EMAIL === 'true';

if (MOCK_EMAIL) {
  console.log("🟠 MOCK EMAIL MODE ENABLED: Emails will be logged to console instead of sent.");
} else {
  console.log("📧 REAL EMAIL MODE ENABLED: Attempting to send real emails via SMTP.");
}

function normalizeRecipients(to) {
  if (!to) return [];
  if (Array.isArray(to)) return to.map(String).filter(Boolean);
  return String(to)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendMail({ to, subject, html, text }) {
  console.log(`[Email Debug] Attempting to send email to: ${to}`);
  console.log(`[Email Debug] Subject: ${subject}`);
  if (MOCK_EMAIL) {
    console.log("\n-------- 📧 MOCK EMAIL START --------");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || "(HTML Content)"}`);
    if (html) console.log("HTML Preview (first 100 chars):", html.substring(0, 100) + "...");
    console.log("-------- 📧 MOCK EMAIL END ----------\n");
    return { ok: true, info: { messageId: 'mock-id-' + Date.now() } };
  }

  try {
    const recipients = normalizeRecipients(to);
    if (recipients.length === 0) {
      const msg = "sendMail: missing recipient";
      console.warn(msg);
      return { ok: false, error: msg };
    }

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipients.join(", "),
      subject: subject || "(no subject)",
      html: html || undefined,
      text: text || (html ? html.replace(/<[^>]+>/g, "") : ""),
    });

    console.log("📧 Email sent:", {
      to: recipients,
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    return { ok: true, info };
  } catch (err) {
    console.error("❌ sendMail error:", err?.message || err);
    if (err.responseCode === 502) {
      console.error("🚨 BREVO ERROR 502: Your account is not activated. Please verify your Brevo/Sendinblue account status.");
    }
    return { ok: false, error: err };
  }
}

export async function sendMailToMany({ to, subject, html, text }) {
  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) return { ok: false, error: "missing recipients" };

  const results = [];
  for (const r of recipients) {
    try {
      const resp = await sendMail({ to: r, subject, html, text });
      results.push({ to: r, ok: Boolean(resp.ok), info: resp.info, error: resp.error || null });
    } catch (e) {
      results.push({ to: r, ok: false, error: e?.message || e });
    }
  }
  return { ok: true, results };
}
