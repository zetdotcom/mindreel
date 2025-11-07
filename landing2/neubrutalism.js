const translations = {
  en: {
    "nav-features": "FEATURES",
    "nav-how": "HOW IT WORKS",
    "nav-download": "DOWNLOAD",
    "hero-title": "STOP FORGETTING YOUR WINS",
    "hero-subtitle":
      "Free, open-source desktop app that logs what you're working on with automatic popups and generates AI summaries of your achievements.",
    "badge-free": "FREE & OPEN SOURCE",
    "badge-local": "LOCAL DATA",
    "badge-ai": "AI SUMMARIES",
    "btn-download": "DOWNLOAD FOR macOS",
    "btn-github": "VIEW ON GITHUB",
    "mockup-label": "APP SCREENSHOT PLACEHOLDER",
    "features-title": "POWERFUL FEATURES",
    "feature1-title": "AUTOMATIC POPUPS",
    "feature1-text":
      'Gentle hourly reminders ask "What are you working on?" Takes 10 seconds to log your progress.',
    "feature1-mockup": "POPUP SCREENSHOT",
    "feature2-title": "WEEKLY AI SUMMARIES",
    "feature2-text":
      "AI analyzes your entries and creates professional summaries perfect for standups and reviews.",
    "feature2-mockup": "SUMMARY SCREENSHOT",
    "feature3-title": "LOCAL & PRIVATE",
    "feature3-text":
      "Your data stays on your machine. Only sent to OpenRouter API when generating summaries.",
    "feature3-mockup": "PRIVACY DIAGRAM",
    "feature4-title": "100% FREE",
    "feature4-text": "No subscriptions, no paywalls, no ads. Open source and free forever.",
    "feature4-mockup": "OPEN SOURCE BADGE",
    "how-title": "HOW IT WORKS",
    "step1-title": "LOG YOUR WORK",
    "step1-text":
      'A popup appears every hour asking what you\'re working on. Click "Same as before" if continuing the same task.',
    "step2-title": "BUILD YOUR HISTORY",
    "step2-text":
      "All entries are saved locally and organized by day. Edit or delete entries anytime.",
    "step3-title": "GET AI SUMMARIES",
    "step3-text":
      "Generate weekly summaries that highlight your achievements. Perfect for reports and meetings.",
    "download-title": "READY TO TRACK YOUR WINS?",
    "download-subtitle": "Download MindReel for macOS and never forget your achievements again.",
    "btn-download-main": "DOWNLOAD FOR macOS",
    "download-note": "macOS only • Free & Open Source",
    "footer-tagline": "Your work. Automatically documented.",
    "footer-copyright": "© 2025 MindReel. Open Source Software.",
  },
  pl: {
    "nav-features": "FUNKCJE",
    "nav-how": "JAK TO DZIAŁA",
    "nav-download": "POBIERZ",
    "hero-title": "PRZESTAŃ ZAPOMINAĆ O SWOICH SUKCESACH",
    "hero-subtitle":
      "Darmowa aplikacja open-source, która automatycznie loguje Twoją pracę i generuje podsumowania AI Twoich osiągnięć.",
    "badge-free": "DARMOWA & OPEN SOURCE",
    "badge-local": "DANE LOKALNIE",
    "badge-ai": "PODSUMOWANIA AI",
    "btn-download": "POBIERZ DLA macOS",
    "btn-github": "ZOBACZ NA GITHUB",
    "mockup-label": "MIEJSCE NA ZRZUT EKRANU",
    "features-title": "POTĘŻNE FUNKCJE",
    "feature1-title": "AUTOMATYCZNE PRZYPOMNIENIA",
    "feature1-text":
      'Co godzinę aplikacja pyta "Nad czym teraz pracujesz?". Logowanie zajmuje 10 sekund.',
    "feature1-mockup": "ZRZUT POPUP",
    "feature2-title": "TYGODNIOWE PODSUMOWANIA AI",
    "feature2-text":
      "AI analizuje wpisy i tworzy profesjonalne podsumowania idealne na spotkania i raporty.",
    "feature2-mockup": "ZRZUT PODSUMOWANIA",
    "feature3-title": "LOKALNE & PRYWATNE",
    "feature3-text":
      "Twoje dane pozostają na komputerze. Wysyłane do OpenRouter API tylko podczas generowania podsumowań.",
    "feature3-mockup": "DIAGRAM PRYWATNOŚCI",
    "feature4-title": "100% DARMOWA",
    "feature4-text":
      "Bez subskrypcji, bez płatnych funkcji, bez reklam. Open source i darmowa na zawsze.",
    "feature4-mockup": "ODZNAKA OPEN SOURCE",
    "how-title": "JAK TO DZIAŁA",
    "step1-title": "LOGUJ SWOJĄ PRACĘ",
    "step1-text":
      'Co godzinę pojawia się popup pytający nad czym pracujesz. Kliknij "To samo co wcześniej" jeśli kontynuujesz zadanie.',
    "step2-title": "BUDUJ HISTORIĘ",
    "step2-text":
      "Wszystkie wpisy zapisywane są lokalnie i organizowane według dni. Edytuj lub usuwaj wpisy w każdej chwili.",
    "step3-title": "GENERUJ PODSUMOWANIA AI",
    "step3-text":
      "Generuj tygodniowe podsumowania prezentujące Twoje osiągnięcia. Idealne na raporty i spotkania.",
    "download-title": "GOTOWY NA ŚLEDZENIE SUKCESÓW?",
    "download-subtitle": "Pobierz MindReel dla macOS i nigdy więcej nie zapomnij swoich osiągnięć.",
    "btn-download-main": "POBIERZ DLA macOS",
    "download-note": "tylko macOS • Darmowa & Open Source",
    "footer-tagline": "Twoja praca. Automatycznie udokumentowana.",
    "footer-copyright": "© 2025 MindReel. Oprogramowanie Open Source.",
  },
};

let currentLang = navigator.language.toLowerCase().startsWith("pl") ? "pl" : "en";

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.getElementById("langToggle").textContent = lang === "en" ? "PL" : "EN";
  localStorage.setItem("preferredLang", lang);
}

document.getElementById("langToggle").addEventListener("click", () => {
  setLanguage(currentLang === "en" ? "pl" : "en");
});

const savedLang = localStorage.getItem("preferredLang");
if (savedLang) {
  setLanguage(savedLang);
} else {
  setLanguage(currentLang);
}
