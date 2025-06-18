function initLanguage() {
  const selectedLang = localStorage.getItem("selectedLanguage") || "en";
  applyTranslations(selectedLang);

  // Optional: update language select dropdown
  const languageSelect = document.getElementById("language");
  if (languageSelect) {
    languageSelect.value = selectedLang;
    languageSelect.addEventListener("change", (e) => {
      const lang = e.target.value;
      localStorage.setItem("selectedLanguage", lang);
      applyTranslations(lang);
    });
  }
}

function applyTranslations(lang) {
  const langPack = translations[lang];
  if (!langPack) return;

  for (const [key, text] of Object.entries(langPack)) {
    const el = document.getElementById(key);
    if (el) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = text;
      } else if (el.tagName === "BUTTON") {
        el.textContent = text;
      } else {
        el.innerText = text;
      }
    }
  }
}