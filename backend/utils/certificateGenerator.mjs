import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIGNATURE_PATH = path.join(__dirname, 'signature_nobg.png');

/**
 * Generates a premium blood donation certificate PDF
 * @param {Object} data - { donorName, bloodGroup, hospital, date, certificateId }
 * @returns {Promise<Buffer>}
 */
export const generateCertificate = async (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 0, left: 0, bottom: 0, right: 0 },
            autoFirstPage: true,
            bufferPages: true,
        });

        const W = doc.page.width;   // ~841
        const H = doc.page.height;  // ~595

        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // ─── BACKGROUND ───────────────────────────────────────────────
        doc.rect(0, 0, W, H).fill('#fdf8f0');

        // Subtle diagonal watermark stripes
        doc.save();
        doc.opacity(0.022);
        for (let i = -H; i < W + H; i += 28) {
            doc.moveTo(i, 0).lineTo(i + H, H).lineWidth(14).stroke('#cc0000');
        }
        doc.restore();

        // Dark red corner accents (4 corners)
        const corner = 55;
        doc.rect(0, 0, corner, corner).fill('#cc0000');
        doc.rect(W - corner, 0, corner, corner).fill('#cc0000');
        doc.rect(0, H - corner, corner, corner).fill('#cc0000');
        doc.rect(W - corner, H - corner, corner, corner).fill('#cc0000');

        // Corner decorative cross shapes in white
        const crossSize = 16;
        const crossOffset = 27 - crossSize / 2;
        [
            [crossOffset, crossOffset],
            [W - crossOffset - crossSize, crossOffset],
            [crossOffset, H - crossOffset - crossSize],
            [W - crossOffset - crossSize, H - crossOffset - crossSize],
        ].forEach(([x, y]) => {
            doc.rect(x + crossSize * 0.3, y, crossSize * 0.4, crossSize).fill('#fff');
            doc.rect(x, y + crossSize * 0.3, crossSize, crossSize * 0.4).fill('#fff');
        });

        // ─── BORDERS ─────────────────────────────────────────────────
        const borderM = 22;
        doc.rect(borderM, borderM, W - borderM * 2, H - borderM * 2)
            .lineWidth(5).stroke('#cc0000');
        doc.rect(borderM + 8, borderM + 8, W - (borderM + 8) * 2, H - (borderM + 8) * 2)
            .lineWidth(1.2).stroke('#cc0000');
        // Gold inner line
        doc.rect(borderM + 12, borderM + 12, W - (borderM + 12) * 2, H - (borderM + 12) * 2)
            .lineWidth(0.5).stroke('#c8a951');

        // ─── BLOOD DROP ICON (top center) ────────────────────────────
        const dropCX = W / 2;
        const dropTopY = 46;
        doc.save();
        doc.fillColor('#cc0000').opacity(0.9);
        doc.moveTo(dropCX, dropTopY)
            .bezierCurveTo(dropCX - 12, dropTopY + 10, dropCX - 16, dropTopY + 22, dropCX - 12, dropTopY + 30)
            .bezierCurveTo(dropCX - 8, dropTopY + 38, dropCX + 8, dropTopY + 38, dropCX + 12, dropTopY + 30)
            .bezierCurveTo(dropCX + 16, dropTopY + 22, dropCX + 12, dropTopY + 10, dropCX, dropTopY)
            .fill();
        doc.fillColor('#fff').opacity(0.4);
        doc.circle(dropCX - 3, dropTopY + 17, 4).fill();
        doc.restore();

        // ─── HEADER TEXT ──────────────────────────────────────────────
        doc.fillColor('#cc0000')
            .opacity(1)
            .fontSize(11)
            .font('Helvetica')
            .text('R E A L - H E R O  N E T W O R K', 0, 95, { align: 'center', characterSpacing: 3 });

        doc.fillColor('#b00000')
            .fontSize(34)
            .font('Helvetica-Bold')
            .text('CERTIFICATE OF APPRECIATION', 0, 113, { align: 'center', characterSpacing: 1.5 });

        // Decorative gold divider with diamond
        const lineY = 153;
        const lineL = 160;
        const midX = W / 2;
        doc.moveTo(midX - lineL - 10, lineY).lineTo(midX - 6, lineY).lineWidth(1).stroke('#c8a951');
        doc.moveTo(midX + 6, lineY).lineTo(midX + lineL + 10, lineY).lineWidth(1).stroke('#c8a951');
        doc.save();
        doc.fillColor('#c8a951');
        doc.moveTo(midX, lineY - 5).lineTo(midX + 5, lineY).lineTo(midX, lineY + 5).lineTo(midX - 5, lineY).fill();
        doc.restore();

        // ─── PRESENTED TO ────────────────────────────────────────────
        doc.fillColor('#555')
            .fontSize(13)
            .font('Helvetica')
            .text('T H I S  C E R T I F I C A T E  I S  P R O U D L Y  P R E S E N T E D  T O', 0, 167, { align: 'center', characterSpacing: 0.5 });

        // Donor name
        doc.fillColor('#1a1a1a')
            .fontSize(38)
            .font('Helvetica-Bold')
            .text((data.donorName || 'VALUED DONOR').toUpperCase(), 0, 188, { align: 'center' });

        // Name underline (gold)
        const nameUnderY = 234;
        doc.moveTo(midX - 180, nameUnderY).lineTo(midX + 180, nameUnderY).lineWidth(1.5).stroke('#c8a951');

        // ─── CITATION ────────────────────────────────────────────────
        doc.fillColor('#444')
            .fontSize(13)
            .font('Helvetica-Oblique')
            .text('"For their extraordinary selfless act of blood donation, which may have saved up to three lives."', 60, 246, { align: 'center', width: W - 120 });

        // ─── DETAILS ROW ─────────────────────────────────────────────
        const detY = 295;
        const detLineH = 22;

        // Blood group pill badge
        const bgLabel = data.bloodGroup || '—';
        const pillX = 150;
        const pillW = 70;
        doc.roundedRect(pillX + 92, detY - 4, pillW, 24, 5)
            .fillAndStroke('#cc0000', '#cc0000');
        doc.fillColor('#fff').fontSize(14).font('Helvetica-Bold')
            .text(bgLabel, pillX + 92, detY, { width: pillW, align: 'center' });
        doc.fillColor('#555').fontSize(13).font('Helvetica')
            .text('Blood Group:', pillX, detY + 1);

        // Date
        const dateX = W / 2 + 30;
        doc.fillColor('#555').fontSize(13).font('Helvetica').text('Date:', dateX, detY + 1);
        doc.fillColor('#1a1a1a').font('Helvetica-Bold')
            .text(data.date || new Date().toLocaleDateString('en-IN'), dateX + 44, detY + 1);

        // Hospital
        doc.fillColor('#555').fontSize(13).font('Helvetica').text('Hospital:', pillX, detY + detLineH + 4);
        doc.fillColor('#1a1a1a').font('Helvetica-Bold')
            .text(data.hospital || 'Real-Hero Network', pillX + 68, detY + detLineH + 4, { width: W - pillX - 68 - 80 });

        // ─── DIVIDER ─────────────────────────────────────────────────
        const divY = 368;
        doc.moveTo(60, divY).lineTo(W - 60, divY).lineWidth(0.5).stroke('#ddd');

        // ─── FOOTER TAGLINE ──────────────────────────────────────────
        doc.fillColor('#888')
            .fontSize(10.5)
            .font('Helvetica-Oblique')
            .text('Your generosity echoes through lives saved. You are a true Real-Hero.', 0, divY + 8, { align: 'center' });

        // ─── SIGNATURE (right side only, with digital image) ──────────
        // Signature block is right-aligned
        const sigBlockX = W - 280;   // left edge of the 180-wide block
        const sigBlockW = 180;
        const sigLineY = 455;

        // Embed CEO signature (transparent PNG — blends with cream bg seamlessly)
        try {
            doc.image(SIGNATURE_PATH, sigBlockX + 10, sigLineY - 56, {
                width: 160,
                height: 50,
            });
        } catch (e) {
            // Fallback: stylised cursive text
            doc.fillColor('#222').fontSize(18).font('Helvetica-BoldOblique')
                .text('V. Leelalohin Reddy', sigBlockX, sigLineY - 28, { width: sigBlockW, align: 'center' });
        }

        // Signature line
        doc.moveTo(sigBlockX, sigLineY).lineTo(sigBlockX + sigBlockW, sigLineY).lineWidth(0.8).stroke('#999');
        doc.fillColor('#777').fontSize(9).font('Helvetica')
            .text('Authorised Signatory', sigBlockX, sigLineY + 5, { width: sigBlockW, align: 'center' });
        doc.fillColor('#555').fontSize(9).font('Helvetica-Bold')
            .text('Real-Hero Network', sigBlockX, sigLineY + 16, { width: sigBlockW, align: 'center' });

        // ─── CERTIFICATE ID — inside box, above the dark red corner ──
        // Corner rect starts at H - 55 = 540, so we place text at max H - 62
        const certId = data.certificateId || ('RH-' + Math.random().toString(36).substr(2, 9).toUpperCase());
        doc.fillColor('#666')               // darker gray so it's visible on cream
            .fontSize(8.5)
            .font('Helvetica')
            .text(`Certificate ID: ${certId}`, 42, H - 68, { width: 340 });

        doc.fillColor('#888')
            .fontSize(8)
            .text('Verify at: real-hero.app/verify', 42, H - 57, { width: 280 });

        // ─── OFFICIAL SEAL (top right) ────────────────────────────────
        const sealCX = W - 90;
        const sealCY = 100;
        const sealR = 48;

        // Outer circle + inner circle
        doc.circle(sealCX, sealCY, sealR).lineWidth(2.5).stroke('#cc0000');
        doc.circle(sealCX, sealCY, sealR - 8).lineWidth(1).stroke('#cc0000');

        // Light fill
        doc.save();
        doc.opacity(0.04);
        doc.circle(sealCX, sealCY, sealR - 2).fill('#cc0000');
        doc.restore();

        // Blood drop inside seal
        const sCX = sealCX;
        const sTY = sealCY - 20;
        doc.save();
        doc.fillColor('#cc0000').opacity(0.9);
        doc.moveTo(sCX, sTY)
            .bezierCurveTo(sCX - 7, sTY + 6, sCX - 9, sTY + 14, sCX - 7, sTY + 18)
            .bezierCurveTo(sCX - 4, sTY + 22, sCX + 4, sTY + 22, sCX + 7, sTY + 18)
            .bezierCurveTo(sCX + 9, sTY + 14, sCX + 7, sTY + 6, sCX, sTY)
            .fill();
        doc.restore();

        // Seal text
        doc.fillColor('#cc0000').fontSize(7.5).font('Helvetica-Bold')
            .text('• REAL-HERO •', sealCX - 30, sealCY + 4, { width: 60, align: 'center', characterSpacing: 0.5 });
        doc.fillColor('#cc0000').fontSize(6.5).font('Helvetica')
            .text('OFFICIAL SEAL', sealCX - 28, sealCY + 16, { width: 56, align: 'center', characterSpacing: 0.5 });

        // Stars in ring around inner circle
        const starAngles = [0, 60, 120, 180, 240, 300];
        starAngles.forEach(angle => {
            const rad = (angle * Math.PI) / 180;
            const sx = sealCX + Math.cos(rad) * (sealR - 12);
            const sy = sealCY + Math.sin(rad) * (sealR - 12);
            doc.fillColor('#cc0000').fontSize(5).text('★', sx - 3, sy - 4);
        });

        // ─── FINALIZE ────────────────────────────────────────────────
        doc.flushPages();
        doc.end();
    });
};
