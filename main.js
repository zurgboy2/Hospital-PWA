import { initDB } from './db.js';
import { setupAuthHandlers } from './auth.js';
import { setupDashboardHandlers } from './dashboard.js';
import { registerServiceWorker } from './serviceWorker.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    setupAuthHandlers();
    setupDashboardHandlers();
    registerServiceWorker();
});