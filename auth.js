import { deriveKey, encryptData, decryptData, SALT_BYTES } from './crypto.js';
import { saveData, loadData } from './dataManager.js';
import { setCurrentUser, setCurrentKey, getCurrentUser, getCurrentKey } from './store.js';
import { getDbPromise, STORE_NAME } from './db.js';
import { loadDashboard } from './dashboard.js';

let db;

export let isCreatingAccount = false;

export function setupAuthHandlers() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('createAccountLink').addEventListener('click', toggleAccountCreation);
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
}

export async function createAccount(username, password) {
    const db = await getDbPromise();

    if (username.length < 4 || password.length < 12) {
        throw new Error('Username must be at least 4 characters and password at least 12 characters.');
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const key = await deriveKey(password, salt);
    const keyVerification = await encryptData("verification", key);

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = (event) => {
            if (event.target.result) {
                reject(new Error('Username already exists.'));
            } else {
                objectStore.put({ salt: Array.from(salt), keyVerification, personalInfo: null, notes: [], healthData: [] }, username);
                resolve(key);
            }
        };
        
        request.onerror = () => reject(new Error('Failed to create account.'));
    });
}

export async function login(username, password) {
    const db = await getDbPromise();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = async (event) => {
            const result = event.target.result;
            if (result && result.salt && result.keyVerification) {
                const salt = new Uint8Array(result.salt);
                const key = await deriveKey(password, salt);
                setCurrentUser(username);
                setCurrentKey(key);
                try {
                    const decrypted = await decryptData(result.keyVerification, key);
                    if (decrypted === "verification") {
                        resolve(key);
                    } else {
                        reject(new Error('Invalid password.'));
                    }
                } catch (error) {
                    reject(new Error('Invalid password.'));
                }
            } else {
                reject(new Error('User not found.'));
            }
        };
        
        request.onerror = () => reject(new Error('Login failed.'));
    });
}

export function handleLogout() {
    setCurrentUser(null);
    setCurrentKey(null);
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    isCreatingAccount = false;
    document.getElementById('loginButton').innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    document.getElementById('createAccountLink').textContent = 'Create one';
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        let key;
        if (isCreatingAccount) {
            key = await createAccount(username, password);
            alert('Account created successfully!');
        } else {
            key = await login(username, password);
        }
        setCurrentUser(username);
        setCurrentKey(key);
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        loadDashboard();
    } catch (error) {
        alert(error.message);
    }
}

function toggleAccountCreation(e) {
    e.preventDefault();
    isCreatingAccount = !isCreatingAccount;
    const loginButton = document.getElementById('loginButton');
    if (isCreatingAccount) {
        loginButton.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        e.target.textContent = 'Back to Login';
    } else {
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        e.target.textContent = 'Create one';
    }
}