export const STORE_NAME = "userdata";
export const DOCTOR_STORE_NAME = "doctordata";

export function initDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                reject(new Error("IndexedDB error: " + event.target.error));
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME) || !db.objectStoreNames.contains(DOCTOR_STORE_NAME)) {
                    reject(new Error(`Required object store not found`));
                } else {
                    resolve(db);
                }
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
                if (!db.objectStoreNames.contains(DOCTOR_STORE_NAME)) {
                    db.createObjectStore(DOCTOR_STORE_NAME);
                }
            };
        });
    }
    return dbPromise;
}