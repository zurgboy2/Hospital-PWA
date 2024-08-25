const DB_NAME = "PatientDashboardDB";
const DB_VERSION = 2; // Increment the version to trigger an upgrade
export const STORE_NAME = "userdata"; // Match the existing store name

let dbPromise;

export function initDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            console.log(`Opening IndexedDB: ${DB_NAME}, version ${DB_VERSION}`);
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject(new Error("IndexedDB error: " + event.target.error));
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                console.log(`Successfully opened database: ${db.name}, version ${db.version}`);
                console.log("Object store names:", Array.from(db.objectStoreNames));
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    console.error(`Object store ${STORE_NAME} not found in the database`);
                    reject(new Error(`Object store ${STORE_NAME} not found`));
                } else {
                    resolve(db);
                }
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                const newVersion = event.newVersion;
                console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    console.log(`Creating object store: ${STORE_NAME}`);
                    db.createObjectStore(STORE_NAME);
                } else {
                    console.log(`Object store ${STORE_NAME} already exists`);
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
        const db = await getDbPromise();
        console.log("Database connection successful");
        console.log("Database name:", db.name);
        console.log("Database version:", db.version);
        console.log("Object store names:", Array.from(db.objectStoreNames));
        return true;
    } catch (error) {
        console.error("Error checking database state:", error);
        return false;
    }
}