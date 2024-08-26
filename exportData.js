import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData } from './dataManager.js';

export async function setupExportDataHandler() {
    document.getElementById('exportDataBtn').addEventListener('click', showExportDataModal);
}

function showExportDataModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Export Data as Excel</h2>
            <div class="input-group">
                <label for="startDate">Start Date:</label>
                <input type="date" id="startDate" required>
            </div>
            <div class="input-group">
                <label for="endDate">End Date:</label>
                <input type="date" id="endDate" required>
            </div>
            <div class="input-group">
                <label>Select data to export:</label>
                <div>
                    <input type="checkbox" id="exportHealth" value="healthHistory">
                    <label for="exportHealth">Health Data</label>
                </div>
                <div>
                    <input type="checkbox" id="exportNotes" value="notes">
                    <label for="exportNotes">Notes</label>
                </div>
                <div>
                    <input type="checkbox" id="exportPersonal" value="personalInfo">
                    <label for="exportPersonal">Personal Information</label>
                </div>
            </div>
            <button id="generateExcelBtn" class="btn-primary">Generate Excel</button>
            <button id="closeModalBtn" class="btn-secondary">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('generateExcelBtn').addEventListener('click', handleExportData);
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

async function handleExportData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const exportHealth = document.getElementById('exportHealth').checked;
    const exportNotes = document.getElementById('exportNotes').checked;
    const exportPersonal = document.getElementById('exportPersonal').checked;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }

    if (!exportHealth && !exportNotes && !exportPersonal) {
        alert('Please select at least one data type to export.');
        return;
    }

    try {
        const data = await fetchDataForExport(startDate, endDate, exportHealth, exportNotes, exportPersonal);
        generateExcelFile(data);
        document.body.removeChild(document.querySelector('.modal'));
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('An error occurred while exporting data. Please try again.');
    }
}

async function fetchDataForExport(startDate, endDate, exportHealth, exportNotes, exportPersonal) {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    const allData = await loadData(currentUser, currentKey);

    const filteredData = {};

    if (exportHealth) {
        filteredData.healthHistory = allData.healthHistory.filter(entry => 
            entry.date >= startDate && entry.date <= endDate
        );
    }

    if (exportNotes) {
        filteredData.notes = allData.notes.filter(note => 
            note.date >= startDate && note.date <= endDate
        );
    }

    if (exportPersonal) {
        filteredData.personalInfo = allData.personalInfo;
    }

    return filteredData;
}

function generateExcelFile(data) {
    const workbook = XLSX.utils.book_new();

    if (data.healthHistory) {
        const healthSheet = XLSX.utils.json_to_sheet(data.healthHistory);
        XLSX.utils.book_append_sheet(workbook, healthSheet, "Health Data");
    }

    if (data.notes) {
        const notesSheet = XLSX.utils.json_to_sheet(data.notes);
        XLSX.utils.book_append_sheet(workbook, notesSheet, "Notes");
    }

    if (data.personalInfo) {
        const personalSheet = XLSX.utils.json_to_sheet([data.personalInfo]);
        XLSX.utils.book_append_sheet(workbook, personalSheet, "Personal Information");
    }

    XLSX.writeFile(workbook, `patient_data_export_${new Date().toISOString().split('T')[0]}.xlsx`);
}