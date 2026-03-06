// backend/scripts/generate_translations.mjs
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groq = new Groq({
    apiKey: process.env.GROQ_TRANSLATION_API_KEY,
});

// Indian languages to support
const languages = {
    en: 'English',
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    mr: 'Marathi',
    gu: 'Gujarati',
    kn: 'Kannada',
    ml: 'Malayalam',
    pa: 'Punjabi',
    bn: 'Bengali',
    or: 'Odia',
    as: 'Assamese',
};

// Source English translations
const sourceTranslations = {
    // Navigation & Common
    home: 'Home',
    dashboard: 'Dashboard',
    profile: 'Profile',
    donate: 'Donate',
    donateBlood: 'Donate Blood',
    requestBlood: 'Request Blood',
    donations: 'Donations',
    myDonations: 'My Donations',
    requests: 'Requests',
    myRequests: 'My Requests',
    leaderboard: 'Leaderboard',
    rewards: 'Rewards',
    analytics: 'Analytics',
    medibot: 'MediBot',
    medibotAI: 'MediBot AI',
    languageSettings: 'Language Settings',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    loading: 'Loading...',
    note: 'Note',

    // Profile Page
    profileSettings: 'Profile Settings',
    personalInformation: 'Personal Information',
    name: 'Name',
    fullName: 'Full Name',
    email: 'Email',
    emailAddress: 'Email Address',
    phone: 'Phone Number',
    bloodGroup: 'Blood Group',
    dateOfBirth: 'Date of Birth',
    age: 'Age',
    gender: 'Gender',
    weight: 'Weight (kg)',
    bio: 'Bio',
    location: 'Location',
    availability: 'Availability Status',
    available: 'Available',
    unavailable: 'Unavailable',
    male: 'Male',
    female: 'Female',
    others: 'Others',
    languagePreference: 'Language Preference',
    selectLanguage: 'Select Language',
    profilePhoto: 'Profile Photo',
    uploadPhoto: 'Upload Photo',
    updateProfile: 'Update Profile',
    editProfile: 'Edit Profile',

    // Language Settings Page
    languageSettingsDescription: 'Select your preferred language. The entire interface will automatically translate to your chosen language.',
    languageNoteMessage: 'Your language preference is saved automatically and will persist across sessions. The interface will translate immediately when you select a new language.',

    // Gamification
    points: 'Points',
    coins: 'Coins',
    badges: 'Badges',
    heroCoins: 'Hero Coins',
    donationsCount: 'Donations Count',
    reliabilityScore: 'Reliability Score',

    // Messages
    profileUpdated: 'Profile updated successfully',
    profileUpdateFailed: 'Failed to update profile',
    languageChanged: 'Language Changed!',
    languageChangedMessage: 'Interface language updated successfully',
    languageChangeFailed: 'Failed to save language preference',
    selectBloodGroup: 'Please select a blood group',
    fillRequiredFields: 'Please fill all required fields',
};

async function translateText(text, targetLanguage) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. Translate the given English text to ${languages[targetLanguage]}. Only return the translated text, nothing else. Maintain any special formatting or placeholders.`,
                },
                {
                    role: 'user',
                    content: text,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
        });

        return completion.choices[0]?.message?.content?.trim() || text;
    } catch (error) {
        console.error(`Error translating "${text}" to ${targetLanguage}:`, error.message);
        return text; // Fallback to original text
    }
}

async function generateTranslationFile(langCode) {
    console.log(`\n🌍 Generating translations for ${languages[langCode]}...`);

    if (langCode === 'en') {
        // English is the source, just copy it
        return sourceTranslations;
    }

    const translations = {};
    const keys = Object.keys(sourceTranslations);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const englishText = sourceTranslations[key];

        console.log(`  [${i + 1}/${keys.length}] Translating: "${englishText}"`);
        const translatedText = await translateText(englishText, langCode);
        translations[key] = translatedText;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    return translations;
}

async function main() {
    console.log('🚀 Starting translation generation...\n');

    if (!process.env.GROQ_TRANSLATION_API_KEY) {
        console.error('❌ ERROR: GROQ_TRANSLATION_API_KEY not found in .env file');
        process.exit(1);
    }

    const localesPath = path.join(__dirname, '../../frontend/public/locales');

    // Create locales directory if it doesn't exist
    if (!fs.existsSync(localesPath)) {
        fs.mkdirSync(localesPath, { recursive: true });
    }

    // Generate translations for each language
    for (const [langCode, langName] of Object.entries(languages)) {
        try {
            const translations = await generateTranslationFile(langCode);

            const langDir = path.join(localesPath, langCode);
            if (!fs.existsSync(langDir)) {
                fs.mkdirSync(langDir, { recursive: true });
            }

            const filePath = path.join(langDir, 'translation.json');
            fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf-8');

            console.log(`✅ ${langName} translation file created: ${filePath}`);
        } catch (error) {
            console.error(`❌ Failed to generate ${langName} translations:`, error.message);
        }
    }

    console.log('\n✨ Translation generation completed!');
}

main();
