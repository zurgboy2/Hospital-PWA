import { loadTranslations } from './i18n.js';

export function setupLanguageSettings() {
  const languageSelect = document.getElementById('languageSelect');

  languageSelect.addEventListener('change', (e) => {
    loadTranslations(e.target.value);
  });
}
