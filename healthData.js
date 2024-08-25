import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData, saveData } from './dataManager.js';

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

export async function loadHealthData() {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    try {
        const data = await loadData(currentUser, currentKey);
        const healthHistory = data && data.healthHistory ? data.healthHistory : [];
        populateHealthDataList(healthHistory);
        updateHealthChart(healthHistory);
    } catch (error) {
        console.error('Failed to load health data:', error);
    }
}

export function updateHealthChart(healthHistory) {
    const ctx = document.getElementById('healthChart').getContext('2d');
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    
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

export function populateHealthDataList(healthHistory) {
    const healthDataList = document.getElementById('healthDataList');
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
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
        console.error('Failed to edit health entry:', error);
    }
}