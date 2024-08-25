import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData, saveData } from './dataManager.js';

export async function handlePersonalInfoSubmit(e) {
    e.preventDefault();
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    const personalInfo = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        height: document.getElementById('height').value,
        gender: document.getElementById('gender').value,
        patientNumber: document.getElementById('patientNumber').value
    };
    
    try {
        await saveData(currentUser, { personalInfo }, currentKey);
        alert('Personal information saved successfully!');
    } catch (error) {
        alert('Failed to save personal information: ' + error.message);
    }
}

export async function loadPersonalInfo() {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    try {
        const data = await loadData(currentUser, currentKey);
        if (data && data.personalInfo) {
            document.getElementById('name').value = data.personalInfo.name || '';
            document.getElementById('age').value = data.personalInfo.age || '';
            document.getElementById('height').value = data.personalInfo.height || '';
            document.getElementById('gender').value = data.personalInfo.gender || '';
        }
    } catch (error) {
        console.error('Failed to load personal information:', error);
    }
}