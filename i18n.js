let currentLanguage = 'en';
let translations = {};

document.getElementById('languageSelect').addEventListener('change', (event) => {
  loadTranslations(event.target.value);
});


export function getCurrentLanguage() {
    return currentLanguage;
}

export function setCurrentLanguage(lang) {
    currentLanguage = lang;
    // You might want to trigger a page update or reload translations here
}

export async function loadTranslations(lang) {
    try {
        const response = await fetch(`translations/${lang}.json`);
        translations = await response.json();
        setCurrentLanguage(lang);
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
    const translation = translations[key] || key;
    
    if (element.tagName === 'INPUT' && element.type === 'submit') {
      element.value = translation;
    } else if (element.tagName === 'OPTION') {
      element.textContent = translation;
    } else {
      // Check if the element is a child of a button
      if (element.parentElement.tagName === 'BUTTON') {
        // If it's a child of a button, only update the text node
        const textNode = Array.from(element.parentElement.childNodes)
          .find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.nodeValue = ' ' + translation; // Add a space before the text
        } else {
          element.textContent = translation;
        }
      } else {
        element.textContent = translation;
      }
    }
  });
}
