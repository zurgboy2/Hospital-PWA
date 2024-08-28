import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData, saveData } from './dataManager.js';
import { __ } from './i18n.js';

export async function handlePersonalInfoSubmit(e) {
    e.preventDefault();
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    const personalInfo = {
        name: document.getElementById('name').value.trim(),
        age: document.getElementById('age').value.trim(),
        height: document.getElementById('height').value.trim(),
        gender: document.getElementById('gender').value
    };
    
    // Basic validation
    if (!personalInfo.name || !personalInfo.age || !personalInfo.height || !personalInfo.gender) {
        alert(__('errorMessages.allFieldsRequired'));
        return;
    }

    try {
        await saveData(currentUser, { personalInfo }, currentKey);
        alert(__('successMessages.personalInfoSaved'));
        
        loadPersonalInfo();
    } catch (error) {
        console.error('Error saving personal info:', error);
        alert(__('errorMessages.personalInfoSaveFailed'));
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
        console.error(__('errorMessages.personalInfoLoadFailed'), error);
    }
}

export function updatePersonalInfoLabels() {
    document.querySelector('label[for="name"]').textContent = __('fullName');
    document.querySelector('label[for="age"]').textContent = __('age');
    document.querySelector('label[for="height"]').textContent = __('height');
    document.querySelector('label[for="gender"]').textContent = __('gender');

    // Update gender options
    const genderSelect = document.getElementById('gender');
    const genderOptions = genderSelect.querySelectorAll('option');
    genderOptions.forEach(option => {
        if (option.dataset.i18n) {
            option.textContent = __(option.dataset.i18n);
        }
    });

    // Update the placeholder option
    genderOptions[0].textContent = __('selectGender');

    // Update submit button
    const submitButton = document.querySelector('#personalInfoForm button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = __('savePersonalInfo');
    }
}