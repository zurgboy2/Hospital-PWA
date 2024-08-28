import { deriveKey, encryptData, decryptData, SALT_BYTES } from './crypto.js';
import { saveData, loadData } from './dataManager.js';
import { setCurrentUser, setCurrentKey, getCurrentUser, getCurrentKey } from './store.js';
import { generateRecoveryKey } from './backup.js';
import { getDbPromise, STORE_NAME } from './db.js';
import { loadDashboard } from './dashboard.js';
import { __ } from './i18n.js';

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
        throw new Error(__('usernamePasswordRequirements'));
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const key = await deriveKey(password, salt);
    const keyVerification = await encryptData("verification", key);

    const recoveryKey = generateRecoveryKey();
    const encryptedRecoveryKey = await encryptData(recoveryKey, key);

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = (event) => {
            if (event.target.result) {
                reject(new Error(__('usernameExists')));
            } else {
                objectStore.put({ salt: Array.from(salt), keyVerification, encryptedRecoveryKey, personalInfo: null, notes: [], healthData: [] }, username);
                resolve({ key, recoveryKey });
            }
        };
        
        request.onerror = () => reject(new Error(__('failedtoCreate')));
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
                        reject(new Error(__('invalidPassword')));
                    }
                } catch (error) {
                    reject(new Error(__('invalidPassword')));
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
    document.getElementById('loginButton').innerHTML = `<i class="fas fa-sign-in-alt"></i> ${__('login')}`;
    document.getElementById('createAccountLink').textContent = __('createOne');
    const accessToggleBtn = document.getElementById('accessToggleBtn');
    if (accessToggleBtn) {
        accessToggleBtn.style.display = 'block';
    }
    document.querySelector('.language-selector').style.display = 'block';

}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        let result;
        if (isCreatingAccount) {
            result = await createAccount(username, password);
            await new Promise(resolve => showRecoveryKey(result.recoveryKey, resolve));
        } else {
            result = { key: await login(username, password) };
        }
        setCurrentUser(username);
        setCurrentKey(result.key);
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        const accessToggleBtn = document.getElementById('accessToggleBtn');
        if (accessToggleBtn) {
            accessToggleBtn.style.display = 'none';
        }
        document.querySelector('.language-selector').style.display = 'none';

        loadDashboard();
    } catch (error) {
        alert(error.message);
    }
}

function showRecoveryKey(recoveryKey, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${__('welcomeNewAccount')}</h2>
            <h3>${__('importantThingsToKnow')}</h3>
            <p>${__('appDescription')}</p>
            <p><strong>${__('readCarefully')}</strong></p>
            <ul>
                <li>${__('infoSavedLocally')}</li>
                <li>${__('useSameBrowser')}</li>
                <li>${__('forgotPasswordInfo')}</li>
                <li>${__('saveRegularly')}</li>
            </ul>
            <h3>${__('specialRecoveryCode')}</h3>
            <p>${__('hereIsRecoveryCode')}</p>
            <p class="recovery-key">${recoveryKey}</p>
            <p><strong>${__('veryImportant')}</strong> ${__('keepCodeSafe')}</p>
            <h3>${__('howToUseApp')}</h3>
            <ol>
                <li>${__('alwaysUseSameBrowser')}</li>
                <li>${__('regularlyBackup')}</li>
                <li>${__('ifForgotPassword')}
                    <ul>
                        <li>${__('createNewAccount')}</li>
                        <li>${__('userRecoveryCode')}</li>
                        <li>${__('needLastBackup')}</li>
                    </ul>
                </li>
                <li>"${__('keepInfoSafe')}</li>
            </ol>
            <button id="closeModal" class="btn-primary">${__('readyToStart')}</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('closeModal').addEventListener('click', () => {
        document.body.removeChild(modal);
        callback(); // Resolve the promise when the user closes the modal
    });
}

function toggleAccountCreation(e) {
    e.preventDefault();
    isCreatingAccount = !isCreatingAccount;
    const loginButton = document.getElementById('loginButton');
    const authHeader = document.getElementById('authHeader');
    const authDescription = document.getElementById('authDescription');
    const usernameLabel = document.querySelector('label[for="username"]');
    const passwordLabel = document.querySelector('label[for="password"]');

    if (isCreatingAccount) {
        loginButton.innerHTML = `<i class="fas fa-user-plus"></i> ${__('createAccount')}`;
        e.target.textContent = __('backToLogin');
        authHeader.textContent = __('createAccount');
        authDescription.textContent = __('rememberedAccount');
        usernameLabel.textContent = __('chooseUsername');
        passwordLabel.textContent = __('choosePassword');
    } else {
        loginButton.innerHTML = `<i class="fas fa-sign-in-alt"></i> ${__('login')}`;
        e.target.textContent = __('createOne');
        authHeader.textContent = __('login');
        authDescription.textContent = __('noAccount');
        usernameLabel.textContent = __('username');
        passwordLabel.textContent = __('password');
    }

    // Clear input fields when toggling
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}