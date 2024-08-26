import { initDB } from './db.js';
import { deriveKey, encryptData, decryptData, SALT_BYTES } from './crypto.js';

const DOCTOR_STORE_NAME = 'doctordata';

let currentDoctorSection = 'login'; // Can be 'login' or 'signup'

export function setupDoctorHandlers() {
    document.getElementById('doctorLoginForm').addEventListener('submit', handleDoctorLogin);
    document.getElementById('doctorCreateAccountLink').addEventListener('click', showDoctorSignup);
    document.getElementById('doctorSignupForm').addEventListener('submit', handleDoctorSignup);
    document.getElementById('doctorLoginLink').addEventListener('click', showDoctorLogin);
}

export function showDoctorLogin() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('doctorLoginSection').style.display = 'block';
    document.getElementById('doctorSignupSection').style.display = 'none';
    currentDoctorSection = 'login';
}


async function handleDoctorLogin(e) {
    e.preventDefault();
    const username = document.getElementById('doctorUsername').value;
    const password = document.getElementById('doctorPassword').value;
    
    try {
        const doctorData = await loginDoctor(username, password);
        if (doctorData.tokenStatus === 'pending') {
            alert(`Your account is pending approval. Your token is: ${doctorData.token}\nPlease provide this token to the admin for approval.`);
        } else if (doctorData.tokenStatus === 'approved') {
            alert('Login successful. Redirecting to doctor dashboard...');
            // TODO: Implement doctor dashboard redirect
        }
    } catch (error) {
        alert(error.message);
    }
}

export function showDoctorSignup() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('doctorLoginSection').style.display = 'none';
    document.getElementById('doctorSignupSection').style.display = 'block';
    currentDoctorSection = 'signup';
}


async function createDoctorAccount(username, password) {
    const db = await initDB();
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const key = await deriveKey(password, salt);
    const token = generateToken();
    const encryptedToken = await encryptData(token, key);

    const transaction = db.transaction([DOCTOR_STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(DOCTOR_STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = (event) => {
            if (event.target.result) {
                reject(new Error('Username already exists.'));
            } else {
                objectStore.put({ salt: Array.from(salt), encryptedToken, tokenStatus: 'pending' }, username);
                resolve(token);
            }
        };
        
        request.onerror = () => reject(new Error('Failed to create account.'));
    });
}

async function loginDoctor(username, password) {
    const db = await initDB();
    const transaction = db.transaction([DOCTOR_STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(DOCTOR_STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = async (event) => {
            const result = event.target.result;
            if (result && result.salt && result.encryptedToken) {
                const salt = new Uint8Array(result.salt);
                const key = await deriveKey(password, salt);
                try {
                    const token = await decryptData(result.encryptedToken, key);
                    resolve({ token, tokenStatus: result.tokenStatus });
                } catch (error) {
                    reject(new Error('Invalid password.'));
                }
            } else {
                reject(new Error('Doctor not found.'));
            }
        };
        
        request.onerror = () => reject(new Error('Login failed.'));
    });
}

function generateToken() {
    return Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Call this function to set up doctor-related event listeners
setupDoctorHandlers();