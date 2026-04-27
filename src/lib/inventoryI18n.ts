// Translations of common inventory item names. Falls back to the raw English
// (or original) name when no translation exists.
import type { Lang } from "./i18n";

const map: Record<string, Partial<Record<Lang, string>>> = {
  // Grocery
  "Sona Masuri Rice": { te: "సోనా మసూరి బియ్యం", hi: "सोना मसूरी चावल" },
  Rice: { te: "బియ్యం", hi: "चावल" },
  "Sunflower Oil": { te: "పొద్దుతిరుగుడు నూనె", hi: "सूरजमुखी तेल" },
  "Toor Dal": { te: "కందిపప్పు", hi: "तूर दाल" },
  Sugar: { te: "చక్కెర", hi: "चीनी" },
  Salt: { te: "ఉప్పు", hi: "नमक" },
  "Tea Powder": { te: "టీ పొడి", hi: "चाय पत्ती" },
  "Lifebuoy Soap": { te: "లైఫ్‌బాయ్ సబ్బు", hi: "लाइफबॉय साबुन" },
  Soap: { te: "సబ్బు", hi: "साबुन" },
  "Clinic Plus Shampoo": { te: "క్లినిక్ ప్లస్ షాంపూ", hi: "क्लिनिक प्लस शैम्पू" },
  "Colgate Toothpaste": { te: "కోల్గేట్ పేస్ట్", hi: "कोलगेट टूथपेस्ट" },
  "Atta Flour": { te: "గోధుమ పిండి", hi: "आटा" },

  // Vegetables
  Tomato: { te: "టమాట", hi: "टमाटर" },
  Onion: { te: "ఉల్లిపాయ", hi: "प्याज" },
  Potato: { te: "బంగాళదుంప", hi: "आलू" },
  "Green Chilli": { te: "పచ్చిమిర్చి", hi: "हरी मिर्च" },
  Coriander: { te: "కొత్తిమీర", hi: "धनिया" },
  "Curry Leaves": { te: "కరివేపాకు", hi: "करी पत्ता" },

  // Dairy
  "Cow Milk": { te: "ఆవు పాలు", hi: "गाय का दूध" },
  Milk: { te: "పాలు", hi: "दूध" },
  "Buffalo Milk": { te: "గేదె పాలు", hi: "भैंस का दूध" },
  Curd: { te: "పెరుగు", hi: "दही" },
  Paneer: { te: "పనీర్", hi: "पनीर" },
  Ghee: { te: "నెయ్యి", hi: "घी" },

  // Medical
  "Paracetamol 500": { te: "పారాసిటమాల్ 500", hi: "पैरासिटामोल 500" },
  Paracetamol: { te: "పారాసిటమాల్", hi: "पैरासिटामोल" },
  "ORS Sachet": { te: "ORS సాచెట్", hi: "ORS पाउच" },
  "Dettol Antiseptic": { te: "డెట్టోల్", hi: "डेटॉल" },
  "Bandage Roll": { te: "బ్యాండేజ్", hi: "पट्टी" },
  "Sanitary Pads": { te: "శానిటరీ ప్యాడ్స్", hi: "सैनिटरी पैड्स" },
};

export function localizeItem(name: string, lang: Lang): string {
  if (lang === "en") return name;
  return map[name]?.[lang] ?? name;
}

// Map BCP-47 lang code for the Web Speech API.
export function speechLangCode(lang: Lang): string {
  switch (lang) {
    case "te":
      return "te-IN";
    case "hi":
      return "hi-IN";
    default:
      return "en-IN";
  }
}
