import { initDB } from './db.js';
import { setupAuthHandlers } from './auth.js';
import { setupDashboardHandlers } from './dashboard.js';
import { registerServiceWorker } from './serviceWorker.js';
import { setupPWA } from './pwa.js';
import { loadTranslations, __ } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    const userLang = navigator.language || navigator.userLanguage;
    const initialLang = userLang.startsWith('pt') ? 'pt' : 'en';
    
    // Load initial translations
    await loadTranslations(initialLang);
    
    // Set language select value after translations are loaded
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = initialLang;
        languageSelect.addEventListener('change', async (event) => {
            await loadTranslations(event.target.value);
            updatePageContent();
        });
    }

    setupAuthHandlers();
    setupDashboardHandlers();
    registerServiceWorker();
    setupPWA();

    const accessToggleBtn = document.getElementById('accessToggleBtn');
    const dashboardTitle = document.getElementById('dashboardTitle');
    const loginSection = document.getElementById('loginSection');
    const doctorLoginSection = document.getElementById('doctorLoginSection');

    let isDoctorMode = false;

    accessToggleBtn.addEventListener('click', () => {
        isDoctorMode = !isDoctorMode;
        updateAccessMode();
    });

    function updateAccessMode() {
        if (isDoctorMode) {
            dashboardTitle.textContent = __('doctorDashboard');
            accessToggleBtn.textContent = __('patientAccess');
            loginSection.style.display = 'none';
            doctorLoginSection.style.display = 'block';
        } else {
            dashboardTitle.textContent = __('dashboardTitle');
            accessToggleBtn.textContent = __('doctorAccess');
            loginSection.style.display = 'block';
            doctorLoginSection.style.display = 'none';
        }
    }

    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const headerNav = document.querySelector('.header-nav');

    mobileMenuToggle.addEventListener('click', function() {
        headerNav.classList.toggle('show');
    });

    function updatePageContent() {
        // Update all translatable elements
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = __(key);
        });

        // Update specific elements that might not have data-i18n attribute
        updateAccessMode();
    }

    // Initial update of page content
    updatePageContent();
});