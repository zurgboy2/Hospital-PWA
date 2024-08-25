import { getDbPromise, STORE_NAME } from './db.js';
import { getCurrentUser, getCurrentKey } from './store.js';
import { encryptData, decryptData } from './crypto.js';

export async function saveData(username, data, key) {
    const encryptedData = await encryptData(data, key);

    const db = await getDbPromise();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result) {
                result.data = encryptedData;
                objectStore.put(result, username);
                resolve();
            } else {
                reject(new Error('User data not found.'));
            }
        };
        
        request.onerror = () => reject(new Error('Failed to save data.'));
    });
}

export async function loadData(username, key) {
    const db = await getDbPromise();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = async (event) => {
            const result = event.target.result;
            if (result && result.data) {
                try {
                    const decryptedData = await decryptData(result.data, key);
                    resolve(decryptedData);
                } catch (error) {
                    reject(new Error('Failed to decrypt data.'));
                }
            } else {
                resolve(null); // No existing data
            }
        };
        
        request.onerror = () => reject(new Error('Failed to load data.'));
    });
}