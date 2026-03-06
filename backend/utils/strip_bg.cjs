/**
 * Strips near-white pixels from the signature PNG → signature_nobg.png
 * Uses pngjs sync API correctly.
 */
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'signature.png');
const DEST = path.join(__dirname, 'signature_nobg.png');

const buf = fs.readFileSync(SRC);
const png = PNG.sync.read(buf);
const { width, height, data } = png;

for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 210) {
            // Near-white pixel → make transparent
            // Smooth transition: at brightness 255 → alpha 0; at 210 → alpha 230
            const alpha = Math.round(((255 - brightness) / 45) * 230);
            data[idx + 3] = Math.max(0, Math.min(255, alpha));
        }
        // Dark pixels keep full opacity (ink stays visible)
    }
}

const out = PNG.sync.write(png);
fs.writeFileSync(DEST, out);
console.log('✅ Transparent signature written to', DEST);
