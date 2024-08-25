const CACHE_NAME = 'patient-dashboard-cache-v1';
const urlsToCache = [
  '/hospital-PWA/',
  '/hospital-PWA/index.html',
  '/hospital-PWA/styles.css',
  '/hospital-PWA/main.js',
  '/hospital-PWA/manifest.json',
  '/hospital-PWA/api.js',
  '/hospital-PWA/article.js',
  '/hospital-PWA/auth.js',
  '/hospital-PWA/crypto.js',
  '/hospital-PWA/dashboard.js',
  '/hospital-PWA/dataManager.js',
  '/hospital-PWA/db.js',
  '/hospital-PWA/healthData.js',
  '/hospital-PWA/note.js',
  '/hospital-PWA/personalInfo.js',
  '/hospital-PWA/pwa.js',
  '/hospital-PWA/requests.js',
  '/hospital-PWA/serviceWorker.js',
  '/hospital-PWA/store.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});