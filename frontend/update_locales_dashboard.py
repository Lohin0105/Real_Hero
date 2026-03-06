import json
import os

# Define the path to the locales directory
locales_dir = "public/locales"

# List of supported languages
languages = [
    "en", "hi", "ta", "bn", "te", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur"
]

# Quotes to be added
quotes = [
  "Donate blood — be someone's hero.",
  "A single donation can save up to three lives.",
  "Share life. Donate blood regularly.",
  "Blood donation: small time, huge impact.",
  "Heroes don't always wear capes — sometimes they're donors.",
  "Give blood, give hope.",
  "Your donation matters. Save a life.",
  "Keep calm and donate blood.",
  "Every drop counts — donate today.",
  "Be the reason someone lives tomorrow.",
  "Your kindness can save lives.",
  "Donate blood, be a life saver.",
  "Donate blood — be someone's hero.",
  "A single donation can save up to three lives.",
  "Share life. Donate blood regularly.",
  "Blood donation: small time, huge impact.",
  "Heroes don't always wear capes — sometimes they're donors.",
  "Give blood, give hope.",
  "Donate today — someone needs you tomorrow.",
  "Your donation matters. Save a life.",
  "Share the gift of life: donate blood.",
  "You are stronger than you think — donate.",
  "Blood donation is a simple act of kindness.",
  "One pint can make a big difference.",
  "Donors are lifelines for patients.",
  "Keep calm and donate blood.",
  "Every donor counts. Every drop matters.",
  "Donate blood — support your community.",
  "Make a date to donate regularly.",
  "Blood banks rely on people like you.",
  "Lifesaving action: roll up a sleeve.",
  "Your blood can give others a tomorrow.",
  "Donate to bring smiles back.",
  "A few minutes from you, a lifetime for someone.",
  "Donating blood is safe and quick.",
  "Every donation is a gift of life.",
  "Help patients fight critical illnesses.",
  "Your donation supports surgeries and emergencies.",
  "Heroes live among us — donors included.",
  "Give blood: it's priceless for recipients.",
  "Donate to help victims of accidents.",
  "Your type may be needed today.",
  "Donors help cancer patients receive treatment.",
  "Be kind: donate blood when you can.",
  "Blood donation unites communities.",
  "Be a regular donor — build a habit.",
  "Donating blood is an act of compassion.",
  "Donate and inspire others to do the same.",
  "Donations keep hospitals running.",
  "One donation — three potential lives saved.",
  "You can be somebody's miracle.",
  "Blood donation builds resilience in healthcare.",
  "Be the difference: donate blood.",
  "Your small act solves a big problem.",
  "Donors create second chances.",
  "Donate blood, spread hope.",
  "Be proud — you're saving lives.",
  "A hero step: share your blood.",
  "Donors are the backbone of transfusion care.",
  "Life is precious — donate to protect it.",
  "Regular donors protect the vulnerable.",
  "Blood donation empowers communities.",
  "Donate for family, friends, strangers.",
  "Every drop makes tomorrow possible.",
  "Your generosity heals wounds.",
  "Help mothers, children, accident victims.",
  "Make the world safer — donate.",
  "Donors give more than blood — they give hope.",
  "Join the movement of lifesavers.",
  "Donate to make hospitals prepared.",
  "Your type might be urgently needed.",
  "Donating is healthy, safe, and kind.",
  "Volunteer your time — donate blood.",
  "Donate today — be part of the solution.",
  "Blood donation creates positive change.",
  "Give life, get gratitude.",
  "Every donation counts toward recovery.",
  "Donors change stories from loss to life.",
  "Be generous — save someone's life.",
  "Community heroes donate regularly.",
  "Donating blood: quick, safe, rewarding.",
  "Your act echoes in families' lives.",
  "Donate for awareness and action.",
  "Fight shortages with your donation.",
  "Be a blood donor ambassador.",
  "Share your compassion: give blood.",
  "Simple act, profound result.",
  "Support your local blood bank.",
  "Donate blood — it's human kindness in action.",
  "Shed a little blood, save a lot of life.",
  "Donors are everyday heroes.",
  "Help keep surgery rooms ready.",
  "Your donation may help newborns.",
  "Be there for patients in need.",
  "Donations reduce crisis stress for responders.",
  "Help create a safer healthcare system.",
  "Donate once — you might save a stranger.",
  "It's easy to donate — do it safely.",
  "Strength is giving when you can.",
  "Your donation reduces suffering.",
  "Help restore hope through donation.",
  "Care, give, save.",
  "Be counted among lifesavers.",
  "Blood donors bring communities together.",
  "Your contribution is medical gold.",
  "Help ensure blood supply stability.",
  "Donate now — don't wait for an emergency.",
  "Blood donation renews life.",
  "Make donation part of your lifestyle.",
  "Blood saves families.",
  "Donors help create miracles every day.",
  "Show compassion — be a donor.",
  "Life is the best gift — share it.",
  "Be a beacon of hope — donate blood."
]

# Other new keys
new_keys = {
    "helloUser": {
        "en": "Hello {{name}}",
        "hi": "नमस्ते {{name}}",
        "ta": "வணக்கம் {{name}}",
        "default": "Hello {{name}}"
    },
    "friend": {
        "en": "Friend",
        "hi": "मित्र",
        "ta": "நண்பர்",
        "default": "Friend"
    },
    "user": {
        "en": "User",
        "hi": "उपयोगकर्ता",
        "ta": "பயனர்",
        "default": "User"
    },
    "rewardReceivedTitle": {
        "en": "You received a reward",
        "hi": "आपको एक पुरस्कार मिला है",
        "ta": "நீங்கள் ஒரு விருதைப் பெற்றுள்ளீர்கள்",
        "default": "You received a reward"
    }
}

def update_locales():
    print("Starting update of locale files for Dashboard...")
    
    for lang in languages:
        file_path = os.path.join(locales_dir, lang, "translation.json")
        
        if not os.path.exists(file_path):
            print(f"Warning: File not found for language '{lang}': {file_path}")
            continue
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Add quotes array
            # ideally we would translate these, but for now we use English for all
            # or try to provide simple translations for hi/ta if feasible, but list is too long.
            # So we will replicate the English list for all languages to ensure structure exists.
            # In a real app, these would be translated.
            data["quotes"] = quotes
            
            # Add other keys
            added_count = 0
            for key, values in new_keys.items():
                if key not in data:
                    val = values.get(lang, values["default"])
                    data[key] = val
                    added_count += 1
            
            # Check if 'realHero' exists, if not add it
            if "realHero" not in data:
                 data["realHero"] = "Real-Hero"
                 added_count += 1

            if added_count > 0 or "quotes" not in data: # Force save if quotes added (which is always true here as we set it)
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"Updated {lang}: Added quotes and {added_count} keys.")
            else:
                 # We are overwriting quotes anyway to be safe
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"Updated {lang}: Quotes synced.")
                
        except Exception as e:
            print(f"Error updating {lang}: {str(e)}")

    print("Update completed.")

if __name__ == "__main__":
    update_locales()
