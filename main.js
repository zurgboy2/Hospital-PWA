import { initDB } from './db.js';
import { setupAuthHandlers } from './auth.js';
import { setupDashboardHandlers } from './dashboard.js';
import { registerServiceWorker } from './serviceWorker.js';
import { setupPWA } from './pwa.js';
import { scheduleBackups, remindBackupAndKeyVerification } from './backup.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    setupAuthHandlers();
    setupDashboardHandlers();
    registerServiceWorker();
    setupPWA();
    scheduleBackups();
    remindBackupAndKeyVerification();
    const accessToggleBtn = document.getElementById('accessToggleBtn');
    const dashboardTitle = document.getElementById('dashboardTitle');
    const loginSection = document.getElementById('loginSection');
    const doctorLoginSection = document.getElementById('doctorLoginSection');

    let isDoctorMode = false;

    accessToggleBtn.addEventListener('click', () => {
        isDoctorMode = !isDoctorMode;
        
        if (isDoctorMode) {
            dashboardTitle.textContent = 'Doctor Dashboard';
            accessToggleBtn.textContent = 'Patient Access';
            loginSection.style.display = 'none';
            doctorLoginSection.style.display = 'block';
        } else {
            dashboardTitle.textContent = 'Patient Dashboard';
            accessToggleBtn.textContent = 'Doctor Access';
            loginSection.style.display = 'block';
            doctorLoginSection.style.display = 'none';
        }
    });
});
