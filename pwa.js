let deferredPrompt;

export function setupPWA() {
    const installButton = document.getElementById('installButton');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.classList.remove('hidden');
    });

    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installButton.classList.add('hidden');
        } else {
            showInstallInstructions();
        }
    });

    window.addEventListener('appinstalled', (evt) => {
        console.log('Patient Dashboard app was installed.');
        installButton.classList.add('hidden');
    });

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is already installed and running in standalone mode.');
        installButton.classList.add('hidden');
    }
}

// Function to show installation instructions based on the user's browser and device
export function showInstallInstructions() {
    let instructions = '';
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
        instructions = 'To install this app on your iOS device, tap the Share button and then "Add to Home Screen".';
    } else if (/android/.test(userAgent)) {
        instructions = 'To install this app on your Android device, tap the menu button and select "Add to Home Screen".';
    } else {
        instructions = 'To install this app, click the install button in your browser\'s address bar.';
    }

    alert(instructions);
}