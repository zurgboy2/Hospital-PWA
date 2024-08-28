let currentLanguage = 'en';
let translations = {};

document.getElementById('languageSelect')?.addEventListener('change', (event) => {
  loadTranslations(event.target.value);
});

export function getCurrentLanguage() {
    return currentLanguage;
}

export function setCurrentLanguage(lang) {
    currentLanguage = lang;
}

export async function loadTranslations(lang) {
  try {
    const response = await fetch(`translations/${lang}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    translations = await response.json();
    currentLanguage = lang;
    document.documentElement.lang = lang;
    updatePageContent();
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    // Fallback to English if translation file is not found
    if (lang !== 'en') {
      console.log('Falling back to English');
      await loadTranslations('en');
    }
  }
}

export function __(key) {
  return translations[key] || key;
}

function updatePageContent() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    if (element) {
      const key = element.getAttribute('data-i18n');
      const translation = translations[key] || key;
      
      if (element.tagName === 'INPUT' && element.type === 'submit') {
        element.value = translation;
      } else if (element.tagName === 'OPTION') {
        element.textContent = translation;
      } else if (element.tagName === 'BUTTON' || (element.parentElement && element.parentElement.tagName === 'BUTTON')) {
        // Handle buttons or elements inside buttons
        updateButtonContent(element.tagName === 'BUTTON' ? element : element.parentElement, translation);
      } else {
        element.textContent = translation;
      }
    }
  });
}

function updateButtonContent(button, translation) {
  // Remove any existing text nodes
  Array.from(button.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .forEach(node => button.removeChild(node));
  
  // Find the position to insert the text
  const iconElement = button.querySelector('i');
  
  if (iconElement) {
    // If there's an icon, insert the text after it
    const textNode = document.createTextNode(' ' + translation);
    if (iconElement.nextSibling) {
      button.insertBefore(textNode, iconElement.nextSibling);
    } else {
      button.appendChild(textNode);
    }
  } else {
    // If there's no icon, just set the button text
    button.textContent = translation;
  }

  // Remove any span elements that might have been added for translation
  const spanElement = button.querySelector('span[data-i18n]');
  if (spanElement) {
    button.removeChild(spanElement);
  }
}

// Initial load of default language
loadTranslations(currentLanguage);