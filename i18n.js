let currentLanguage = 'en';
let translations = {};

export async function loadTranslations(lang) {
  try {
    const response = await fetch(`translations/${lang}.json`);
    translations = await response.json();
    currentLanguage = lang;
    document.documentElement.lang = lang;
    updatePageContent();
    saveLanguagePreference(lang);
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
    if (element.tagName === 'INPUT' && element.type === 'placeholder') {
      element.placeholder = __(key);
    } else {
      element.textContent = __(key);
    }
  });
}

function saveLanguagePreference(lang) {
  localStorage.setItem('preferredLanguage', lang);
}

export function getPreferredLanguage() {
  return localStorage.getItem('preferredLanguage') || 'en';
}