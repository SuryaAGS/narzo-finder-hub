export type Lang = "en" | "hi" | "te";

export const LANG_KEY = "vf_lang";
export const ROLE_KEY = "vf_role";
export const PHONE_KEY = "vf_phone";

export type Role = "customer" | "shopkeeper";

const dict = {
  en: {
    appName: "VillageFinder",
    tagline: "Find shops, prices & stock in your village",
    chooseLang: "Choose your language",
    continue: "Continue",
    phoneTitle: "Enter your phone number",
    phoneHelp: "We'll send you a quick code",
    phonePlaceholder: "10-digit mobile number",
    sendOtp: "Send OTP",
    otpTitle: "Enter the 6-digit code",
    verify: "Verify & continue",
    chooseRole: "How will you use VillageFinder?",
    customer: "I'm shopping",
    customerDesc: "Find items in nearby shops",
    shopkeeper: "I run a shop",
    shopkeeperDesc: "Show your stock to villagers",
    searchPlaceholder: "Search rice, soap, milk…",
    noResults: "No shops match. Try another word.",
    inStock: "In stock",
    outOfStock: "Out of stock",
    orderWhatsApp: "Order on WhatsApp",
    lastUpdated: "Updated",
    distanceAway: "away",
    inventory: "My Inventory",
    addItem: "Add item",
    voiceAdd: "Voice add",
    scan: "Scan",
    popularItems: "Popular items",
    listening: "Listening… speak now",
    tapInStock: "Tap to mark in stock",
  },
  hi: {
    appName: "विलेजफाइंडर",
    tagline: "अपने गाँव की दुकानें, दाम और स्टॉक देखें",
    chooseLang: "अपनी भाषा चुनें",
    continue: "आगे बढ़ें",
    phoneTitle: "अपना मोबाइल नंबर डालें",
    phoneHelp: "हम आपको एक कोड भेजेंगे",
    phonePlaceholder: "10 अंकों का मोबाइल नंबर",
    sendOtp: "OTP भेजें",
    otpTitle: "6 अंकों का कोड डालें",
    verify: "जाँचें और आगे बढ़ें",
    chooseRole: "आप कैसे इस्तेमाल करेंगे?",
    customer: "मुझे सामान चाहिए",
    customerDesc: "पास की दुकानों में खोजें",
    shopkeeper: "मेरी दुकान है",
    shopkeeperDesc: "गाँव वालों को स्टॉक दिखाएँ",
    searchPlaceholder: "चावल, साबुन, दूध खोजें…",
    noResults: "कोई दुकान नहीं मिली। दूसरा शब्द आज़माएँ।",
    inStock: "स्टॉक में है",
    outOfStock: "खत्म है",
    orderWhatsApp: "व्हाट्सएप पर ऑर्डर",
    lastUpdated: "अपडेट",
    distanceAway: "दूर",
    inventory: "मेरा स्टॉक",
    addItem: "सामान जोड़ें",
    voiceAdd: "बोलकर जोड़ें",
    scan: "स्कैन करें",
    popularItems: "लोकप्रिय सामान",
    listening: "सुन रहे हैं… अब बोलें",
    tapInStock: "स्टॉक में मार्क करें",
  },
  te: {
    appName: "విలేజ్‌ఫైండర్",
    tagline: "మీ ఊరి దుకాణాలు, ధరలు, స్టాక్ చూడండి",
    chooseLang: "మీ భాష ఎంచుకోండి",
    continue: "కొనసాగించు",
    phoneTitle: "మీ ఫోన్ నంబర్ ఇవ్వండి",
    phoneHelp: "మేము ఒక కోడ్ పంపిస్తాము",
    phonePlaceholder: "10 అంకెల మొబైల్ నంబర్",
    sendOtp: "OTP పంపు",
    otpTitle: "6 అంకెల కోడ్ ఇవ్వండి",
    verify: "ధృవీకరించి కొనసాగు",
    chooseRole: "మీరు ఎలా వాడతారు?",
    customer: "నాకు సామాను కావాలి",
    customerDesc: "దగ్గరి దుకాణాల్లో వెతుకు",
    shopkeeper: "నాకు దుకాణం ఉంది",
    shopkeeperDesc: "ఊరివారికి స్టాక్ చూపించు",
    searchPlaceholder: "బియ్యం, సబ్బు, పాలు వెతుకు…",
    noResults: "ఏ దుకాణం దొరకలేదు. వేరే పదం ప్రయత్నించు.",
    inStock: "స్టాక్‌లో ఉంది",
    outOfStock: "అయిపోయింది",
    orderWhatsApp: "వాట్సాప్‌లో ఆర్డర్",
    lastUpdated: "నవీకరణ",
    distanceAway: "దూరం",
    inventory: "నా స్టాక్",
    addItem: "సామాను చేర్చు",
    voiceAdd: "మాట్లాడి చేర్చు",
    scan: "స్కాన్ చేయి",
    popularItems: "ప్రాచుర్యం పొందిన వస్తువులు",
    listening: "వింటున్నాం… ఇప్పుడు మాట్లాడండి",
    tapInStock: "స్టాక్‌లో అని గుర్తించు",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem(LANG_KEY) as Lang) || "en";
}

export function setLang(l: Lang) {
  localStorage.setItem(LANG_KEY, l);
}

export function t(key: TKey, lang?: Lang): string {
  const l = lang || getLang();
  return dict[l][key] ?? dict.en[key];
}

export const LANGS: { code: Lang; native: string; english: string }[] = [
  { code: "te", native: "తెలుగు", english: "Telugu" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "en", native: "English", english: "English" },
];
