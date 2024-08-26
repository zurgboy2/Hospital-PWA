import { loadPersonalInfo, handlePersonalInfoSubmit } from './personalInfo.js';
import { loadHealthData, handleHealthDataSubmit } from './healthData.js';
import { loadNotes, handleAddNote } from './note.js';
import { loadArticles } from './article.js';
import { loadRequests } from './requests.js';
import { downloadBackup } from './backup.js';

export function setupDashboardHandlers() {
    // Existing handlers
    initializeTabs();
    document.getElementById('personalInfoForm').addEventListener('submit', handlePersonalInfoSubmit);
    document.getElementById('addNoteBtn').addEventListener('click', handleAddNote);
    document.getElementById('healthTrackerForm').addEventListener('submit', handleHealthDataSubmit);
    document.querySelector('.tab-button[data-tab="requests"]').addEventListener('click', loadRequests);
    
    // New handler for backup button
    document.getElementById('createBackupBtn').addEventListener('click', handleCreateBackup);

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

async function handleCreateBackup() {
    try {
        await downloadBackup();
        alert('Backup created and downloaded successfully!');
    } catch (error) {
        console.error('Failed to create backup:', error);
        alert('Failed to create backup. Please try again.');
    }
}