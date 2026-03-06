// backend/utils/emailTemplates.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Premium Dark Glassmorphic Email Templates for Real-Hero platform
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_RED = '#ff2b2b';
const BRAND_DARK = '#0d0d0d';
const BRAND_CARD = '#151515';
const BRAND_NAME = 'Real-Hero';

/** Wraps any content inside the branded master layout */
function layout({ title, preheader = '', body }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_DARK};font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';-webkit-font-smoothing:antialiased;">
  <!-- preheader hidden text -->
  <span style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:${BRAND_DARK};">${preheader}</span>

  <div style="background-image:linear-gradient(to right bottom, #1a0505, ${BRAND_DARK}); width:100%; min-height:100vh; padding: 40px 16px; box-sizing: border-box;">
    
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:${BRAND_CARD};border:1px solid #333333;border-radius:20px;overflow:hidden;box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,43,43,0.05);">

            <!-- Header (Glass-like) -->
            <tr>
              <td style="padding:40px 36px;text-align:center;background:linear-gradient(135deg, rgba(255,43,43,0.1) 0%, rgba(20,5,5,1) 100%);border-bottom:1px solid rgba(255,43,43,0.15);">
                <div style="display:inline-block;background:rgba(255,43,43,0.15);border:1px solid rgba(255,43,43,0.3);box-shadow:0 0 20px rgba(255,43,43,0.2);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;margin-bottom:12px;">🩸</div><br/>
                <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1px;">${BRAND_NAME}</span>
                <div style="color:${BRAND_RED};font-size:12px;margin-top:6px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Blood Donation</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;color:rgba(255,255,255,0.85);font-size:16px;line-height:1.6;">
                ${body}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#0a0a0a;border-top:1px solid #222222;padding:24px 40px;text-align:center;">
                <p style="margin:0 0 8px 0;font-size:13px;color:#666666;">Sent securely by ${BRAND_NAME} because you are an active hero.</p>
                <p style="margin:0;font-size:13px;color:#444444;font-weight:500;">© ${new Date().getFullYear()} ${BRAND_NAME} · Saving Lives Together 🦸‍♂️</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
    <div style="height:40px;"></div>
  </div>
</body>
</html>`;
}

/** A styled info row (label: value) */
function infoRow(label, value) {
    if (!value && value !== 0) return '';
    return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="40%" style="color:#888888;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding-right:10px;">${label}</td>
            <td width="60%" style="color:#ffffff;font-size:15px;font-weight:700;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/** A styled action button with glowing effects */
function actionBtn(text, url, color = BRAND_RED) {
    // If not red, dim it. If red, give it a serious glow.
    const glow = color === BRAND_RED ? '0 8px 25px rgba(255,43,43,0.4)' : '0 4px 15px rgba(0,0,0,0.5)';
    return `<a href="${url}" target="_blank" style="display:inline-block;margin:8px 6px;padding:14px 32px;background:${color};color:#ffffff;font-weight:700;font-size:15px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;box-shadow:${glow};border:1px solid rgba(255,255,255,0.1); transition: transform 0.2s;">${text}</a>`;
}

/** Section title */
function sectionTitle(text, emoji = '') {
    return `<div style="margin:32px 0 16px 0;font-size:13px;font-weight:700;color:#ff2b2b;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid rgba(255,43,43,0.2);padding-bottom:8px;">${emoji ? emoji + '  ' : ''}${text}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function tplDonorConfirmation({ donorName, requesterName, hospital, bloodGroup, units, yesUrl, noUrl }) {
    const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:900;color:#ffffff;">Confirm Your Donation 🩸</h2>
    <p style="margin:0 0 24px 0;color:#aaaaaa;">Hello <strong style="color:#ffffff;">${donorName || 'Hero'}</strong>, thank you for stepping forward!</p>

    <div style="background:rgba(255,43,43,0.05);border:1px solid rgba(255,43,43,0.2);border-radius:12px;padding:16px 24px;margin-bottom:24px;">
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.6;">
        You showed interest in donating blood for a request at <strong style="color:#ffffff;">${hospital}</strong>.<br/><br/>
        Please confirm below so we can assign you as a donor and alert the patient immediately.
      </p>
    </div>

    ${sectionTitle('Request Details', '📋')}
    <div style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 24px;margin-bottom:32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Blood Group', bloodGroup)}
        ${infoRow('Units Needed', units || 1)}
        ${infoRow('Hospital', hospital)}
        ${infoRow('Patient', requesterName)}
      </table>
    </div>

    <p style="text-align:center;font-size:16px;font-weight:700;color:#ffffff;margin:0 0 16px 0;">Do you confirm that you want to donate?</p>
    <div style="text-align:center;margin-bottom:32px;">
      ${actionBtn('✅  YES — I WILL DONATE', yesUrl, '#1a8a2e')}
      <br/>
      ${actionBtn('❌  NO — I CANNOT', noUrl, '#1a1a1a')}
    </div>

    <p style="text-align:center;color:#777777;font-size:13px;line-height:1.6;margin:0;">
      By clicking YES, you will be assigned to this request. A Hero Coin reward awaits you after a successful donation! 🌟
    </p>`;

    return layout({ title: 'Confirm Blood Donation — Real-Hero', preheader: `${donorName}, please confirm your blood donation for ${hospital}`, body });
}

export function tplDonorAssigned({ donorName, role, requesterName, bloodGroup, phone, hospital, mapsLink }) {
    const isPrimary = role === 'primary' || String(role).includes('primary');
    const roleLabel = isPrimary ? '🥇 PRIMARY DONOR' : '🛡️ BACKUP DONOR';
    const highlightColor = isPrimary ? BRAND_RED : '#2196f3';
    const roleMsg = isPrimary
        ? 'You are the <strong style="color:#ffffff;">Primary Donor</strong>. Please reach the hospital within 2 hours. The patient is counting on you!'
        : 'You are on <strong style="color:#ffffff;">Standby (Backup Donor)</strong>. Please be ready in case the primary donor cannot make it.';

    const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:900;color:#ffffff;">You're Assigned! 🎉</h2>
    <p style="margin:0 0 24px 0;color:#aaaaaa;">Hello <strong style="color:#ffffff;">${donorName}</strong>, your commitment is locked in.</p>

    <div style="background:rgba(${isPrimary ? '255,43,43' : '33,150,243'}, 0.08);border:1px solid rgba(${isPrimary ? '255,43,43' : '33,150,243'}, 0.3);border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <div style="color:${highlightColor};font-weight:800;font-size:18px;margin-bottom:8px;letter-spacing:1px;">${roleLabel}</div>
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.6;">${roleMsg}</p>
    </div>

    ${sectionTitle('Requester Details', '🏥')}
    <div style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 24px;margin-bottom:32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Patient Name', requesterName)}
        ${infoRow('Blood Group', bloodGroup)}
        ${infoRow('Hospital', hospital)}
        ${infoRow('Phone', phone)}
      </table>
    </div>

    ${mapsLink ? `<div style="text-align:center;margin-bottom:32px;">${actionBtn('🗺️  NAVIGATE TO HOSPITAL', mapsLink, '#1a8a2e')}</div>` : ''}

    <p style="text-align:center;color:#777777;font-size:13px;line-height:1.6;margin:0;">
      Thank you for being a Real Hero! 🙏 Once the donation is confirmed, your Hero Coins and rewards will be credited automatically.
    </p>`;

    return layout({ title: `You're Assigned as ${roleLabel} — Real-Hero`, preheader: `${donorName}, you're assigned as ${roleLabel} at ${hospital}`, body });
}

export function tplRequesterDonorFound({ requesterName, donorName, donorBloodGroup, donorAge, donorPhone, donorEmail, donorMapsLink }) {
    const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:900;color:#1a8a2e;">Great News! 🎉</h2>
    <p style="margin:0 0 24px 0;color:#aaaaaa;">Hello <strong style="color:#ffffff;">${requesterName || 'Requester'}</strong>,</p>

    <div style="background:rgba(26,138,46,0.1);border:1px solid #1a8a2e;box-shadow:0 0 30px rgba(26,138,46,0.15);border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🦸‍♂️</div>
      <p style="margin:0;font-size:16px;color:#ffffff;line-height:1.6;font-weight:600;">
        A HERO has confirmed they will donate blood for your request! They are on their way.
      </p>
    </div>

    ${sectionTitle('Donor Details', '📋')}
    <div style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 24px;margin-bottom:32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Name', donorName)}
        ${infoRow('Blood Group', donorBloodGroup)}
        ${infoRow('Age', donorAge)}
        ${infoRow('Phone', donorPhone)}
        ${infoRow('Email', donorEmail)}
      </table>
    </div>

    ${donorMapsLink ? `<div style="text-align:center;margin-bottom:32px;">${actionBtn('📍  VIEW DONOR LOCATION', donorMapsLink, '#1a8a2e')}</div>` : ''}

    <p style="text-align:center;color:#777777;font-size:13px;line-height:1.6;margin:0;">
      Please stay calm and be ready. Your Real-Hero is on their way! ❤️
    </p>`;

    return layout({ title: 'Donor Found — Real-Hero', preheader: `${requesterName}, a donor has confirmed for your blood request!`, body });
}

export function tplFollowUpCheck({ requesterName, donorName, yesUrl, noUrl }) {
    const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:900;color:#ffffff;">Did the Donation Happen? 🏥</h2>
    <p style="margin:0 0 24px 0;color:#aaaaaa;">Hello <strong style="color:#ffffff;">${requesterName || 'Requester'}</strong>,</p>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
        <strong style="color:#ffffff;">${donorName || 'A donor'}</strong> previously confirmed they would donate blood for your request.
        We're following up to verify – was the donation successfully completed at the hospital?
      </p>
    </div>

    <p style="text-align:center;font-size:16px;font-weight:700;color:#ffffff;margin:0 0 16px 0;">Please confirm the outcome:</p>
    <div style="text-align:center;margin-bottom:32px;">
      ${actionBtn('✅  YES — DONATION COMPLETED', yesUrl, '#1a8a2e')}
      <br/>
      ${actionBtn('❌  NO — DID NOT HAPPEN', noUrl, '#1a1a1a')}
    </div>

    <p style="text-align:center;color:#777777;font-size:13px;line-height:1.6;margin:0;">
      Your honest feedback helps us reward real heroes and keep the platform reliable. Thank you! 🙏
    </p>`;

    return layout({ title: 'Follow-up: Did the Donation Happen? — Real-Hero', preheader: `${requesterName}, did the blood donation from ${donorName} happen?`, body });
}

export function tplRewardEarned({ donorName, heroCoins, totalDonations }) {
    const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:900;color:#ff9800;">Your Reward is Here! 🏆</h2>
    <p style="margin:0 0 24px 0;color:#aaaaaa;">Hello <strong style="color:#ffffff;">${donorName || 'Hero'}</strong>, your donation was confirmed.</p>

    <div style="background:linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.02) 100%);border:1px solid rgba(255,152,0,0.3);box-shadow:0 0 40px rgba(255,152,0,0.15);border-radius:16px;padding:32px 24px;text-align:center;margin-bottom:32px;">
      <div style="font-size:50px;margin-bottom:16px;filter:drop-shadow(0 0 10px rgba(255,152,0,0.5));">🏅</div>
      <div style="font-size:36px;font-weight:900;color:#ffb74d;letter-spacing:1px;text-shadow:0 0 20px rgba(255,152,0,0.3);">+${heroCoins || 50} HERO COINS</div>
      <div style="color:rgba(255,255,255,0.6);font-size:14px;margin-top:8px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Added to Wallet</div>
      ${totalDonations ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,152,0,0.2);color:#ffffff;font-size:15px;font-weight:600;">Total Lifetime Donations: <span style="color:#ffb74d;">${totalDonations}</span></div>` : ''}
    </div>

    <p style="text-align:center;color:rgba(255,255,255,0.8);font-size:15px;line-height:1.7;margin:0 0 24px 0;">
      Your selfless act just saved a life. This makes you a verified Real-Hero. 
      Keep donating to unlock elite badges, levels, and real-world rewards. 🌟
    </p>

    <p style="text-align:center;color:#777777;font-size:13px;line-height:1.6;margin:0;">
      Log in to the app to view your updated rank on the Leaderboard!
    </p>`;

    return layout({ title: 'You Earned Hero Coins! 🌟 — Real-Hero', preheader: `Congratulations ${donorName}! You earned ${heroCoins || 50} Hero Coins`, body });
}

export function tplRequesterReward({ requesterName }) {
    const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:900;color:#ffffff;">Thank You! 🙏</h2>
    <p style="margin:0 0 24px 0;color:#aaaaaa;">Hello <strong style="color:#ffffff;">${requesterName || 'Friend'}</strong>,</p>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
        We're incredibly glad your blood request was fulfilled! The request has now been safely closed.
        We hope you or your loved one makes a full and fast recovery! ❤️
      </p>
    </div>

    <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.7;margin:0 0 32px 0;">
      We've added a small gift token to your account as a thank you for using the Real-Hero platform.
      Spread the word so more lives can be saved.
    </p>

    <p style="text-align:center;color:#777777;font-size:13px;line-height:1.6;margin:0;">
      Stay safe, and stay strong. 💪
    </p>`;

    return layout({ title: 'Request Fulfilled — Real-Hero', preheader: `${requesterName}, your blood request has been fulfilled successfully`, body });
}
