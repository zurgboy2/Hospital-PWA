import { getCurrentUser, getCurrentKey } from './store.js';
import { encryptData, decryptData } from './crypto.js';
import { loadData, saveData } from './dataManager.js';

function generateRecoveryKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create a backup
async function createBackup() {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    const data = await loadData(currentUser, currentKey);
    
    // Encrypt the data using the current key
    const encryptedBackup = await encryptData(JSON.stringify(data), currentKey);
    
    // Store in IndexedDB
    const db = await openBackupDB();
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    await store.put(encryptedBackup, currentUser);
    
    console.log('Backup created successfully');
    return encryptedBackup; // Return for potential download
}

// Restore from backup
async function restoreFromBackup(recoveryKey, backupData = null) {
    const currentUser = getCurrentUser();
    
    let encryptedBackup;
    if (backupData) {
        // Use provided backup data (e.g., from a file)
        encryptedBackup = backupData;
    } else {
        // Retrieve the encrypted backup from IndexedDB
        const db = await openBackupDB();
        const transaction = db.transaction(['backups'], 'readonly');
        const store = transaction.objectStore('backups');
        encryptedBackup = await store.get(currentUser);
    }
    
    if (!encryptedBackup) {
        throw new Error('No backup found');
    }
    
    // Decrypt the backup using the recovery key
    const decryptedData = await decryptData(encryptedBackup, recoveryKey);
    const restoredData = JSON.parse(decryptedData);
    
    // Save the restored data
    await saveData(currentUser, restoredData, recoveryKey);
    
    console.log('Data restored successfully');
}

// Open or create the backup database
function openBackupDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BackupDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore('backups');
        };
    });
}

// Schedule regular backups
function scheduleBackups() {
    // Create a backup every day
    setInterval(createBackup, 24 * 60 * 60 * 1000);
}

// Reminder to verify recovery key and create external backup
function remindBackupAndKeyVerification() {
    // Remind every 30 days
    setInterval(() => {
        alert('Please verify your recovery key and create an external backup to ensure you can recover your account if needed.');
    }, 30 * 24 * 60 * 60 * 1000);
}

// Function to download backup as a file
async function downloadBackup() {
    const backup = await createBackup();
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to restore from a file backup
async function restoreFromFile(file, recoveryKey) {
    const reader = new FileReader();
    reader.onload = async (event) => {
        const backupData = JSON.parse(event.target.result);
        await restoreFromBackup(recoveryKey, backupData);
    };
    reader.readAsText(file);
}

export { 
    generateRecoveryKey, 
    createBackup, 
    restoreFromBackup, 
    scheduleBackups, 
    remindBackupAndKeyVerification,
    downloadBackup,
    restoreFromFile
};