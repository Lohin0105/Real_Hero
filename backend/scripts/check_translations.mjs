// Quick script to load English translations
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.join(__dirname, '../../frontend/public/locales/en/translation.json');
const enContent = fs.readFileSync(enPath, 'utf-8');
const translations = JSON.parse(enContent);

console.log('Total keys:', Object.keys(translations).length);
console.log(JSON.stringify(translations, null, 2));
