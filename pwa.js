export function setupPWA() {
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
    
}

// PWA installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('pwaInstructions').style.display = 'block';
});



