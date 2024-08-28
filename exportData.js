import { __ } from './i18n.js';
import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData } from './dataManager.js';

export async function setupExportDataHandler() {
    document.getElementById('exportDataBtn').addEventListener('click', showExportDataModal);
}

function showExportDataModal() {
    const modal = document.createElement('div');
    modal.className = 'export-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="export-modal-content">
            <h2>${__('exportDataAsExcel')}</h2>
            <div class="export-input-group">
                <label for="startDate">${__('startDate')}:</label>
                <input type="date" id="startDate" required>
            </div>
            <div class="export-input-group">
                <label for="endDate">${__('endDate')}:</label>
                <input type="date" id="endDate" required>
            </div>
            <div class="export-input-group">
                <p>${__('selectDataToExport')}:</p>
                <div class="export-checkbox-group">
                    <input type="checkbox" id="exportHealth" value="healthHistory">
                    <label for="exportHealth">${__('healthData')}</label>
                </div>
                <div class="export-checkbox-group">
                    <input type="checkbox" id="exportNotes" value="notes">
                    <label for="exportNotes">${__('notes')}</label>
                </div>
                <div class="export-checkbox-group">
                    <input type="checkbox" id="exportPersonal" value="personalInfo">
                    <label for="exportPersonal">${__('personalInformation')}</label>
                </div>
            </div>
            <div class="export-btn-group">
                <button id="generateExcelBtn" class="btn-primary">${__('generateExcel')}</button>
                <button id="closeModalBtn" class="btn-secondary">${__('cancel')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('generateExcelBtn').addEventListener('click', handleExportData);
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Close modal if clicking outside the content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

async function handleExportData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const exportHealth = document.getElementById('exportHealth').checked;
    const exportNotes = document.getElementById('exportNotes').checked;
    const exportPersonal = document.getElementById('exportPersonal').checked;

    if (!startDate || !endDate) {
        alert(__('selectBothDates'));
        return;
    }

    if (!exportHealth && !exportNotes && !exportPersonal) {
        alert(__('selectAtLeastOneDataType'));
        return;
    }

    try {
        const data = await fetchDataForExport(startDate, endDate, exportHealth, exportNotes, exportPersonal);
        generateExcelFile(data);
        document.body.removeChild(document.querySelector('.export-modal'));
    } catch (error) {
        console.error(__('errorExportingData'), error);
        alert(__('errorExportingDataAlert'));
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
        XLSX.utils.book_append_sheet(workbook, healthSheet, __('healthData'));
    }

    if (data.notes) {
        const notesSheet = XLSX.utils.json_to_sheet(data.notes);
        XLSX.utils.book_append_sheet(workbook, notesSheet, __('notes'));
    }

    if (data.personalInfo) {
        const personalSheet = XLSX.utils.json_to_sheet([data.personalInfo]);
        XLSX.utils.book_append_sheet(workbook, personalSheet, __('personalInformation'));
    }

    XLSX.writeFile(workbook, `${__('patientDataExport')}_${new Date().toISOString().split('T')[0]}.xlsx`);
}