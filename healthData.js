import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData, saveData } from './dataManager.js';
import { __ } from './i18n.js';  // Import the translation function

export let healthChart;

export async function handleHealthDataSubmit(e) {
    e.preventDefault();
    const date = document.getElementById('healthDate').value;
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
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
            healthHistory[existingEntryIndex] = healthData;
        } else {
            healthHistory.push(healthData);
        }
        
        healthHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        await saveData(currentUser, { ...data, healthHistory }, currentKey);
        alert(__('successMessages.healthDataSaved'));
        await loadHealthData();
    } catch (error) {
        alert(__('errorMessages.healthDataSaveFailed') + ': ' + error.message);
    }
}

export async function loadHealthData() {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    try {
        const data = await loadData(currentUser, currentKey);
        const healthHistory = data && data.healthHistory ? data.healthHistory : [];
        populateHealthDataList(healthHistory);
        updateHealthChart(healthHistory);
    } catch (error) {
        console.error(__('errorMessages.healthDataSaveFailed'), error);
    }
}

export function updateHealthChart(healthHistory) {
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
                    label: __('waterIntake'),
                    data: healthHistory.map(entry => entry.waterIntake).reverse(),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                },
                {
                    label: __('colostomyOutput'),
                    data: healthHistory.map(entry => entry.colostomyOutput).reverse(),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1
                },
                {
                    label: __('painLevel'),
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

export function populateHealthDataList(healthHistory) {
    const healthDataList = document.getElementById('healthDataList');
    healthDataList.innerHTML = healthHistory.map(entry => `
        <div class="health-entry">
            <div class="health-entry-content">
                <span class="health-data-item"><strong>${__('date')}:</strong> ${entry.date}</span>
                <span class="health-data-item"><strong>${__('waterIntake')}:</strong> ${entry.waterIntake} ml</span>
                <span class="health-data-item"><strong>${__('colostomyOutput')}:</strong> ${entry.colostomyOutput} ml</span>
                <span class="health-data-item"><strong>${__('painLevel')}:</strong> ${entry.painLevel}</span>
            </div>
            <button class="btn-icon btn-edit" onclick="editHealthEntry('${entry.date}')">
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `).join('');
}

export async function editHealthEntry(date) {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
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
        console.error(__('errorMessages.healthDataSaveFailed'), error);
    }
}