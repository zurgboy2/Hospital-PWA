let currentLanguage = 'en';
let translations = {};

document.getElementById('languageSelect').addEventListener('change', (event) => {
  loadTranslations(event.target.value);
});

export async function loadTranslations(lang) {
  try {
    const response = await fetch(`translations/${lang}.json`);
    translations = await response.json();
    currentLanguage = lang;
    document.documentElement.lang = lang;
    updatePageContent();
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
  }
}

export function __(key) {
  return translations[key] || key;
}

function updatePageContent() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = translations[key] || key; // Use the translation if it exists, otherwise use the key
    
    if (element.tagName === 'INPUT' && element.type === 'submit') {
      element.value = translation;
    } else if (element.tagName === 'OPTION') {
      element.textContent = translation;
    } else {
      element.textContent = translation;
    }
  });
}
