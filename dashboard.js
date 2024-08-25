import { loadPersonalInfo, handlePersonalInfoSubmit } from './personalInfo.js';
import { loadHealthData, handleHealthDataSubmit } from './healthData.js';
import { loadNotes, handleAddNote } from './note.js';
import { loadArticles } from './article.js';
import { loadRequests } from './requests.js';

export function setupDashboardHandlers() {
    // Set up event listeners for dashboard elements
    initializeTabs();
    document.getElementById('personalInfoForm').addEventListener('submit', handlePersonalInfoSubmit);
    document.getElementById('addNoteBtn').addEventListener('click', handleAddNote);
    document.getElementById('healthTrackerForm').addEventListener('submit', handleHealthDataSubmit);
    document.querySelector('.tab-button[data-tab="requests"]').addEventListener('click', loadRequests);
    const today = new Date().toISOString().split('T')[0];
    const healthDateInput = document.getElementById('healthDate');
    healthDateInput.value = today;
    healthDateInput.max = today;
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

export async function loadDashboard() {
    await Promise.all([
        loadPersonalInfo(),
        loadNotes(),
        loadHealthData(),
        loadArticles(),
        loadRequests()
    ]);
}