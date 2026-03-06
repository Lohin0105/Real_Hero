import json
import os

# Define the path to the locales directory
locales_dir = "public/locales"

# List of supported languages
languages = [
    "en", "hi", "ta", "bn", "te", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur"
]

# Define the new translation keys and their values
# For now, using English for all except Hindi and Tamil where I can provide a reasonable translation.
# In a real scenario, these would be properly translated.
new_translations = {
    "topDonorsByPoints": {
        "en": "Top donors by leaderboard points",
        "hi": "लीडरबोर्ड अंकों द्वारा शीर्ष दाता",
        "ta": "தலைமைப் பலகை புள்ளிகள் மூலம் சிறந்த நன்கொடையாளர்கள்",
        "default": "Top donors by leaderboard points"
    },
    "currentRealHero": {
        "en": "Current Real-Hero",
        "hi": "वर्तमान असली हीरो",
        "ta": "தற்போதைய ரியல்-ஹீரோ",
        "default": "Current Real-Hero"
    },
    "otherTopDonors": {
        "en": "Other Top Donors",
        "hi": "अन्य शीर्ष दाता",
        "ta": "மற்ற சிறந்த நன்கொடையாளர்கள்",
        "default": "Other Top Donors"
    },
    "noLeaderboardData": {
        "en": "No leaderboard data yet. Start donating to appear here!",
        "hi": "अभी तक कोई लीडरबोर्ड डेटा नहीं। यहां दिखने के लिए दान करना शुरू करें!",
        "ta": "இன்னும் தலைமைப் பலகை தரவு இல்லை. இங்கே தோன்ற நன்கொடை அளிக்கத் தொடங்குங்கள்!",
        "default": "No leaderboard data yet. Start donating to appear here!"
    }
}

def update_locales():
    print("Starting update of locale files...")
    
    for lang in languages:
        file_path = os.path.join(locales_dir, lang, "translation.json")
        
        if not os.path.exists(file_path):
            print(f"Warning: File not found for language '{lang}': {file_path}")
            continue
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Add new keys
            added_count = 0
            for key, values in new_translations.items():
                if key not in data:
                    # Use specific language translation if available, else default
                    val = values.get(lang, values["default"])
                    data[key] = val
                    added_count += 1
            
            if added_count > 0:
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"Updated {lang}: Added {added_count} keys.")
            else:
                print(f"Skipped {lang}: All keys already exist.")
                
        except Exception as e:
            print(f"Error updating {lang}: {str(e)}")

    print("Update completed.")

if __name__ == "__main__":
    update_locales()
