const DB_NAME = "PatientDashboardDB";
const DB_VERSION = 2; // Increment the version to trigger an upgrade
export const STORE_NAME = "userdata"; // Match the existing store name

let dbPromise;

export function initDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                reject(new Error("IndexedDB error: " + event.target.error));
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    reject(new Error(`Object store ${STORE_NAME} not found`));
                } else {
                    resolve(db);
                }
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }
    return dbPromise;
}

export async function getDbPromise() {
    if (!dbPromise) {
        return initDB();
    }
    return dbPromise;
}

export async function checkDatabaseState() {
    try {
        await getDbPromise();
        return true;
    } catch (error) {
        return false;
    }
}