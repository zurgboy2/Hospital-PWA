import { loadPersonalInfo, handlePersonalInfoSubmit } from './personalInfo.js';
import { loadHealthData, handleHealthDataSubmit } from './healthData.js';
import { loadNotes, handleAddNote } from './note.js';
import { loadArticles } from './article.js';
import { loadRequests } from './requests.js';
import { selectBackupDirectory, createBackup, scheduleBackups } from './backup.js';
import { setupExportDataHandler } from './exportData.js';

export function setupDashboardHandlers() {
    // Existing handlers
    initializeTabs();
    document.getElementById('personalInfoForm').addEventListener('submit', handlePersonalInfoSubmit);
    document.getElementById('addNoteBtn').addEventListener('click', handleAddNote);
    document.getElementById('healthTrackerForm').addEventListener('submit', handleHealthDataSubmit);
    document.querySelector('.tab-button[data-tab="requests"]').addEventListener('click', loadRequests);
    document.getElementById('createBackupBtn').addEventListener('click', handleCreateBackup);
    document.getElementById('selectBackupDirBtn').addEventListener('click', handleSelectBackupDirectory);
    document.getElementById('createBackupBtn').addEventListener('click', handleCreateBackup);
    setupExportDataHandler();


    const today = new Date().toISOString().split('T')[0];
    const healthDateInput = document.getElementById('healthDate');
    healthDateInput.value = today;
    healthDateInput.max = today;
}

async function handleSelectBackupDirectory() {
    await selectBackupDirectory();
}

async function handleCreateBackup() {
    try {
        await createBackup();
        alert('Backup created successfully!');
    } catch (error) {
        console.error('Failed to create backup:', error);
        alert('Failed to create backup. Please try again.');
    }
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
    scheduleBackups();

    // Check if a backup directory has been selected before
    const backupDirSelected = localStorage.getItem('backupDirectorySelected');
    if (!backupDirSelected) {
        alert('Please select a directory for automatic backups in the settings.');
    }
}
