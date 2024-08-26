import { getCurrentUser, getCurrentKey } from './store.js';
import { encryptData, decryptData } from './crypto.js';
import { loadData, saveData } from './dataManager.js';

let backupDirectory = null;

// Check if the File System Access API is supported
const isFileSystemAccessSupported = 'showDirectoryPicker' in window;

// Function to let user select a backup directory
export async function selectBackupDirectory() {
    if (!isFileSystemAccessSupported) {
        alert('Your browser does not support selecting directories. Backups will be downloaded manually.');
        return;
    }

    try {
        backupDirectory = await window.showDirectoryPicker();
        localStorage.setItem('backupDirectorySelected', 'true');
        alert('Backup directory selected successfully. Automatic backups will be saved here.');
    } catch (error) {
        console.error('Failed to select backup directory:', error);
        alert('Failed to select backup directory. Please try again.');
    }
}

export function generateRecoveryKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Function to create and save a backup
export async function createBackup() {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    const data = await loadData(currentUser, currentKey);
    
    // Encrypt the data using the current key
    const encryptedBackup = await encryptData(JSON.stringify(data), currentKey);
    const backupContent = JSON.stringify(encryptedBackup);

    const filename = `backup_${currentUser}_${new Date().toISOString()}.json`;

    if (backupDirectory && isFileSystemAccessSupported) {
        try {
            const fileHandle = await backupDirectory.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(backupContent);
            await writable.close();
            console.log('Backup saved successfully to selected directory');
        } catch (error) {
            console.error('Failed to save backup to selected directory:', error);
            // Fallback to download if saving to directory fails
            downloadBackup(backupContent, filename);
        }
    } else {
        // Fallback to download if directory not selected or API not supported
        downloadBackup(backupContent, filename);
    }
}

// Function to download backup as a file
function downloadBackup(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to schedule regular backups
export function scheduleBackups() {
    // Check if a backup is needed every hour when the app is open
    setInterval(async () => {
        const lastBackup = localStorage.getItem('lastBackupTime');
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (!lastBackup || now - parseInt(lastBackup) > oneDay) {
            await createBackup();
            localStorage.setItem('lastBackupTime', now.toString());
        }
    }, 60 * 60 * 1000); // Check every hour
}

// Function to restore from a backup file
export async function restoreFromFile(file, recoveryKey) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const encryptedBackup = JSON.parse(event.target.result);
                const decryptedData = await decryptData(encryptedBackup, recoveryKey);
                const restoredData = JSON.parse(decryptedData);
                await saveData(restoredData.username, restoredData, recoveryKey);
                resolve(restoredData.username);
            } catch (error) {
                reject(new Error('Failed to restore from backup: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read the backup file'));
        reader.readAsText(file);
    });
}
