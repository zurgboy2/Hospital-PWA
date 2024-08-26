import { deriveKey, encryptData, decryptData, SALT_BYTES } from './crypto.js';
import { saveData, loadData } from './dataManager.js';
import { setCurrentUser, setCurrentKey, getCurrentUser, getCurrentKey } from './store.js';
import { generateRecoveryKey } from './backup.js';
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

    const recoveryKey = generateRecoveryKey();
    const encryptedRecoveryKey = await encryptData(recoveryKey, key);

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = (event) => {
            if (event.target.result) {
                reject(new Error('Username already exists.'));
            } else {
                objectStore.put({ salt: Array.from(salt), keyVerification, encryptedRecoveryKey, personalInfo: null, notes: [], healthData: [] }, username);
                resolve({ key, recoveryKey });
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
        loadDashboard();
    } catch (error) {
        alert(error.message);
    }
}

function showRecoveryKey(recoveryKey, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block'; // Explicitly set display to block
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Welcome to Your New Account!</h2>
            <h3>Important Things to Know</h3>
            <p>This app works only on this computer and this web browser. It's like a digital notebook that only you can see.</p>
            <p><strong>Please read this information carefully:</strong></p>
            <ul>
                <li>Your information is only saved on this computer. It's not shared with anyone else.</li>
                <li>Always use the same web browser (like Chrome, Firefox, or Safari) to open this app.</li>
                <li>If you forget your password, you'll need a special code to get your information back.</li>
                <li>It's a good idea to save your information regularly, just in case.</li>
            </ul>
            <h3>Your Special Recovery Code</h3>
            <p>Here's your special recovery code:</p>
            <p class="recovery-key">${recoveryKey}</p>
            <p><strong>Very Important:</strong> Write down this code and keep it somewhere safe, like in a drawer at home. You'll need it if you ever forget your password.</p>
            <h3>How to Use This App</h3>
            <ol>
                <li>Always use the same web browser to open this app.</li>
                <li>Regularly save your information using the "Save" or "Backup" button you'll see when you use the app.</li>
                <li>If you forget your password:
                    <ul>
                        <li>You'll need to create a new account</li>
                        <li>Then, use your special recovery code to get your old information back</li>
                        <li>You'll also need the last save or "backup" you made</li>
                    </ul>
                </li>
                <li>Remember, keeping your password and recovery code safe is very important. Don't share them with anyone.</li>
            </ol>
            <button id="closeModal" class="btn-primary">I've Read This and I'm Ready to Start</button>
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
        loginButton.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        e.target.textContent = 'Back to Login';
        authHeader.textContent = 'Create Account';
        authDescription.textContent = 'Remembered you had one? ';
        usernameLabel.textContent = 'Choose a Username';
        passwordLabel.textContent = 'Choose a Password';
    } else {
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        e.target.textContent = 'Create one';
        authHeader.textContent = 'Login';
        authDescription.textContent = "Don't have an account?";
        usernameLabel.textContent = 'Username';
        passwordLabel.textContent = 'Password';
    }

    // Clear input fields when toggling
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}