import { loadTranslations, getPreferredLanguage } from './i18n.js';

export function setupLanguageSettings() {
  const languageSelect = document.getElementById('languageSelect');
  
  // Set initial value based on stored preference or default
  languageSelect.value = getPreferredLanguage();

  languageSelect.addEventListener('change', (e) => {
    loadTranslations(e.target.value);
  });
}
