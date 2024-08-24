const PBKDF2_ITERATIONS = 600000;
const SALT_BYTES = 32;
const KEY_BYTES = 32;
const KEY_USAGE = ['encrypt', 'decrypt'];
const ALGORITHM = { name: 'AES-GCM', length: 256 };

// Initialize IndexedDB
let db;
const DB_NAME = "PatientDashboardDB";
const DB_VERSION = 1;
const STORE_NAME = "userdata";

const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(new Error("IndexedDB error: " + event.target.error));

    request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        db.createObjectStore(STORE_NAME);
    };
});

// Cryptographic functions
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256"
        },
        keyMaterial,
        ALGORITHM,
        false,
        KEY_USAGE
    );
}

async function encryptData(data, key) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: ALGORITHM.name,
            iv: iv
        },
        key,
        encodedData
    );

    return {
        iv: Array.from(iv),
        encryptedData: Array.from(new Uint8Array(encryptedContent))
    };
}

async function decryptData(encryptedData, key) {
    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: ALGORITHM.name,
            iv: new Uint8Array(encryptedData.iv)
        },
        key,
        new Uint8Array(encryptedData.encryptedData)
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedContent));
}

// User management functions
async function createAccount(username, password) {
    if (username.length < 4 || password.length < 12) {
        throw new Error('Username must be at least 4 characters and password at least 12 characters.');
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const key = await deriveKey(password, salt);
    const keyVerification = await encryptData("verification", key);

    await dbPromise;
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

async function login(username, password) {
    await dbPromise;
    const transaction = db.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = objectStore.get(username);
        
        request.onsuccess = async (event) => {
            const result = event.target.result;
            if (result && result.salt && result.keyVerification) {
                const salt = new Uint8Array(result.salt);
                const key = await deriveKey(password, salt);
                
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

// Data management functions
async function saveData(username, data, key) {
    const encryptedData = await encryptData(data, key);

    await dbPromise;
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

async function loadData(username, key) {
    await dbPromise;
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

let currentUser = null;
let currentKey = null;
let isCreatingAccount = false;

// Login and Account Creation
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        if (isCreatingAccount) {
            currentKey = await createAccount(username, password);
            alert('Account created successfully!');
        } else {
            currentKey = await login(username, password);
        }
        currentUser = username;
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

function handleLogout() {
    currentUser = null;
    currentKey = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    isCreatingAccount = false;
    document.getElementById('loginButton').innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    document.getElementById('createAccountLink').textContent = 'Create one';
}

const API_URL = 'https://isa-scavenger-761151e3e681.herokuapp.com'; // Replace with your actual API URL

async function getProxyToken(action) {
    const requestBody = { script_id: 'hospital_script', action };
    const response = await fetch(`${API_URL}/get_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    if (data.token) return data.token;
    throw new Error('Failed to get token: ' + JSON.stringify(data));
}

async function makeRequest(action, additionalData = {}) {
    try {
        const token = await getProxyToken(action);
        const requestBody = { 
            token, 
            action, 
            script_id: 'hospital_script', // Make sure this matches what the backend expects
            ...additionalData 
        };
        const response = await fetch(`${API_URL}/proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error('makeRequest error:', error);
        throw error;
    }
}

async function fetchArticles() {
    try {
        const response = await makeRequest('fetchArticles');

        let articles;
        if (response && typeof response === 'object') {
            if (Array.isArray(response)) {
                articles = response;
            } else if (response.articles && Array.isArray(response.articles)) {
                articles = response.articles;
            } else {
                console.error('Unexpected response structure:', response);
                articles = [];
            }
        } else {
            console.error('Invalid response:', response);
            articles = [];
        }

        // Cache the new articles
        localStorage.setItem('cachedArticles', JSON.stringify({ articles }));

        return articles;
    } catch (error) {
        console.error('Failed to fetch articles:', error);
        // In case of error, try to use cached data
        const cachedArticles = localStorage.getItem('cachedArticles');
        const parsedData = cachedArticles ? JSON.parse(cachedArticles) : { articles: [] };
        return parsedData.articles || [];
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

let currentArticles = []; // Declare a variable to store the current articles

function displayArticles(articles) {
    currentArticles = articles; // Store the articles for later use
    const articlesList = document.getElementById('articlesList');
    if (!Array.isArray(articles)) {
        console.error('Articles is not an array:', articles);
        articlesList.innerHTML = '<p>No articles available at the moment.</p>';
        return;
    }
    articlesList.innerHTML = articles.map((article, index) => `
        <div class="article-item">
            <div class="article-content">
                <h4>${article.title}</h4>
                <p>${truncateText(article.fullText, 100)}</p>
            </div>
            <div class="article-footer">
                <button onclick="openArticleModal(${index})">Read more</button>
            </div>
        </div>
    `).join('');
}

// Function to open article modal
function openArticleModal(index) {
    const article = currentArticles[index]; // Use currentArticles instead of articles
    const modal = document.getElementById('articleModal');
    const modalContent = document.getElementById('articleModalContent');
    
    modalContent.innerHTML = `
        <h2>${article.title}</h2>
        <p>${article.fullText}</p>
    `;
    
    modal.style.display = 'block';
}

// Function to close article modal
function closeArticleModal() {
    const modal = document.getElementById('articleModal');
    modal.style.display = 'none';
}

// Event listener for closing modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('articleModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}


// Function to load articles
async function loadArticles() {
    const articles = await fetchArticles();
    displayArticles(articles);
    
    // Cache the articles for offline use
    if ('caches' in window) {
        const cache = await caches.open('articles-cache');
        await cache.put('articles', new Response(JSON.stringify(articles)));
    }
}

async function loadDashboard() {
    await Promise.all([
        loadPersonalInfo(),
        loadNotes(),
        loadHealthData(),
        loadArticles()
    ]);
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// Info Tab
async function loadPatientInfo() {
    // In a real application, this would fetch data from a server
    const patientInfo = {
        name: "John Doe",
        id: "12345",
        lastCheckup: "2023-08-15"
    };
    
    const infoHtml = `
        <p><strong>Name:</strong> ${patientInfo.name}</p>
        <p><strong>Patient ID:</strong> ${patientInfo.id}</p>
        <p><strong>Last Checkup:</strong> ${patientInfo.lastCheckup}</p>
    `;
    
    document.getElementById('patientInfo').innerHTML = infoHtml;
}

// Personal Tab
async function handlePersonalInfoSubmit(e) {
    e.preventDefault();
    const personalInfo = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value
    };
    
    try {
        await saveData(currentUser, { personalInfo }, currentKey);
        alert('Personal information saved successfully!');
    } catch (error) {
        alert('Failed to save personal information: ' + error.message);
    }
}

async function loadPersonalInfo() {
    try {
        const data = await loadData(currentUser, currentKey);
        if (data && data.personalInfo) {
            document.getElementById('name').value = data.personalInfo.name || '';
            document.getElementById('age').value = data.personalInfo.age || '';
            document.getElementById('height').value = data.personalInfo.height || '';
            document.getElementById('weight').value = data.personalInfo.weight || '';
        }
    } catch (error) {
        console.error('Failed to load personal information:', error);
    }
}

// Notes Tab
async function handleAddNote() {
    const noteText = prompt('Enter your note:');
    if (noteText) {
        try {
            const data = await loadData(currentUser, currentKey) || {};
            const notes = data.notes || [];
            notes.push({ id: Date.now(), text: noteText });
            await saveData(currentUser, { ...data, notes }, currentKey);
            loadNotes();
        } catch (error) {
            alert('Failed to add note: ' + error.message);
        }
    }
}

async function loadNotes() {
    try {
        const data = await loadData(currentUser, currentKey);
        const notes = data && data.notes ? data.notes : [];
        const notesHtml = notes.map(note => `
            <div class="note-item">
                <p>${note.text}</p>
                <div class="note-actions">
                    <button onclick="editNote(${note.id})">Edit</button>
                    <button onclick="deleteNote(${note.id})">Delete</button>
                </div>
            </div>
        `).join('');
        document.getElementById('notesList').innerHTML = notesHtml;
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

async function editNote(noteId) {
    try {
        const data = await loadData(currentUser, currentKey);
        const note = data.notes.find(n => n.id === noteId);
        if (note) {
            const newText = prompt('Edit your note:', note.text);
            if (newText !== null) {
                note.text = newText;
                await saveData(currentUser, data, currentKey);
                loadNotes();
            }
        }
    } catch (error) {
        alert('Failed to edit note: ' + error.message);
    }
}

async function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        try {
            const data = await loadData(currentUser, currentKey);
            data.notes = data.notes.filter(n => n.id !== noteId);
            await saveData(currentUser, data, currentKey);
            loadNotes();
        } catch (error) {
            alert('Failed to delete note: ' + error.message);
        }
    }
}

let healthChart;

// Health Tab
async function handleHealthDataSubmit(e) {
    e.preventDefault();
    const date = document.getElementById('healthDate').value;
    const healthData = {
        date: date,
        waterIntake: parseInt(document.getElementById('waterIntake').value),
        colostomyOutput: parseInt(document.getElementById('colostomyOutput').value),
        painLevel: parseInt(document.getElementById('painLevel').value)
    };
    
    try {
        const data = await loadData(currentUser, currentKey) || {};
        const healthHistory = data.healthHistory || [];
        const existingEntryIndex = healthHistory.findIndex(entry => entry.date === date);
        
        if (existingEntryIndex !== -1) {
            // Update existing entry
            healthHistory[existingEntryIndex] = healthData;
        } else {
            // Add new entry
            healthHistory.push(healthData);
        }
        
        // Sort entries by date, most recent first
        healthHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        await saveData(currentUser, { ...data, healthHistory }, currentKey);
        alert('Health data saved successfully!');
        await loadHealthData();
    } catch (error) {
        alert('Failed to save health data: ' + error.message);
    }
}

async function loadHealthData() {
    try {
        const data = await loadData(currentUser, currentKey);
        const healthHistory = data && data.healthHistory ? data.healthHistory : [];
        populateHealthDataList(healthHistory);
        updateHealthChart(healthHistory);
    } catch (error) {
        console.error('Failed to load health data:', error);
    }
}

function populateHealthDataList(healthHistory) {
    const healthDataList = document.getElementById('healthDataList');
    healthDataList.innerHTML = healthHistory.map(entry => `
        <div class="health-entry">
            <div class="health-entry-content">
                <span class="health-data-item"><strong>Date:</strong> ${entry.date}</span>
                <span class="health-data-item"><strong>Water:</strong> ${entry.waterIntake} ml</span>
                <span class="health-data-item"><strong>Output:</strong> ${entry.colostomyOutput} ml</span>
                <span class="health-data-item"><strong>Pain:</strong> ${entry.painLevel}</span>
            </div>
            <button class="btn-icon btn-edit" onclick="editHealthEntry('${entry.date}')">
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `).join('');
}

function updateHealthChart(healthHistory) {
    const ctx = document.getElementById('healthChart').getContext('2d');
    
    if (healthChart) {
        healthChart.destroy();
    }
    
    healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: healthHistory.map(entry => entry.date).reverse(),
            datasets: [
                {
                    label: 'Water Intake (ml)',
                    data: healthHistory.map(entry => entry.waterIntake).reverse(),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                },
                {
                    label: 'Colostomy Output (ml)',
                    data: healthHistory.map(entry => entry.colostomyOutput).reverse(),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1
                },
                {
                    label: 'Pain Level',
                    data: healthHistory.map(entry => entry.painLevel).reverse(),
                    borderColor: 'rgba(255, 206, 86, 1)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function editHealthEntry(date) {
    try {
        const data = await loadData(currentUser, currentKey);
        const healthHistory = data && data.healthHistory ? data.healthHistory : [];
        const entry = healthHistory.find(e => e.date === date);
        if (entry) {
            document.getElementById('healthDate').value = entry.date;
            document.getElementById('waterIntake').value = entry.waterIntake;
            document.getElementById('colostomyOutput').value = entry.colostomyOutput;
            document.getElementById('painLevel').value = entry.painLevel;
        }
    } catch (error) {
        console.error('Failed to edit health entry:', error);
    }
}

// Expose functions to global scope for onclick events
window.editHealthEntry = editHealthEntry;
window.editNote = editNote;
window.deleteNote = deleteNote;

// PWA installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('pwaInstructions').style.display = 'block';
});

document.addEventListener('DOMContentLoaded', () => {
    const pwaInstructions = document.getElementById('pwaInstructions');
    if (pwaInstructions) {
        pwaInstructions.addEventListener('click', (e) => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the PWA prompt');
                    } else {
                        console.log('User dismissed the PWA prompt');
                    }
                    deferredPrompt = null;
                });
            }
        });
    } else {
        console.warn('PWA instructions element not found. PWA installation prompt may not be available.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('createAccountLink').addEventListener('click', toggleAccountCreation);
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    document.getElementById('personalInfoForm').addEventListener('submit', handlePersonalInfoSubmit);
    document.getElementById('addNoteBtn').addEventListener('click', handleAddNote);
    document.getElementById('healthTrackerForm').addEventListener('submit', handleHealthDataSubmit);
    
    // Set default date to today and max date to today
    const today = new Date().toISOString().split('T')[0];
    const healthDateInput = document.getElementById('healthDate');
    healthDateInput.value = today;
    healthDateInput.max = today;
});


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/hospital-PWA/service-worker.js')
    });
}

// Expose functions to global scope for onclick events
window.editNote = editNote;
window.deleteNote = deleteNote;