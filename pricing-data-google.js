// Google Pricing Database - Independent
const GOOGLE_STORAGE_KEY = 'techcross_pricing_google';
const GOOGLE_VERSION_KEY = 'techcross_pricing_google_version';
const GOOGLE_CURRENT_VERSION = '2.0';

const googleServiceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_original: { name: 'Original Screen', description: 'Original manufacturer screen' },
    battery: { name: 'Battery Replacement', description: 'Battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration' },
    motherboard: { name: 'Motherboard/Liquid Damage Repair', description: 'Motherboard repairs' },
    camera: { name: 'Camera Replacement', description: 'Camera replacement' },
    speaker: { name: 'Speaker Repair', description: 'Speaker repair/replacement' },
    power_button: { name: 'Power Button Repair', description: 'Power button repair' },
    back_glass: { name: 'Back Glass Replacement', description: 'Back glass panel replacement' }
};

function createDefaultGoogleServices() {
    return { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, back_glass: 0 };
}

const defaultGooglePricingData = {
    name: 'Google',
    serviceTypes: googleServiceTypes,
    models: {
        'pixel-9-pro-xl': { name: 'Pixel 9 Pro XL', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-9-pro': { name: 'Pixel 9 Pro', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-9': { name: 'Pixel 9', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-8-pro': { name: 'Pixel 8 Pro', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-8': { name: 'Pixel 8', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-8a': { name: 'Pixel 8a', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-7-pro': { name: 'Pixel 7 Pro', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-7': { name: 'Pixel 7', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-7a': { name: 'Pixel 7a', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-6-pro': { name: 'Pixel 6 Pro', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-6': { name: 'Pixel 6', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-6a': { name: 'Pixel 6a', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-5': { name: 'Pixel 5', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-5a': { name: 'Pixel 5a', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-4a-5g': { name: 'Pixel 4a 5G', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-4a': { name: 'Pixel 4a', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() },
        'pixel-4-xl': { name: 'Pixel 4 XL', services: createDefaultGoogleServices(), lastUpdated: new Date().toISOString() }
    }
};

function loadGooglePricingData() {
    try {
        const storedVersion = localStorage.getItem(GOOGLE_VERSION_KEY);
        if (storedVersion !== GOOGLE_CURRENT_VERSION) {
            localStorage.removeItem(GOOGLE_STORAGE_KEY);
            localStorage.setItem(GOOGLE_VERSION_KEY, GOOGLE_CURRENT_VERSION);
            saveGooglePricingData(defaultGooglePricingData);
            return defaultGooglePricingData;
        }
        const stored = localStorage.getItem(GOOGLE_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Error loading Google pricing data:', e);
    }
    saveGooglePricingData(defaultGooglePricingData);
    return defaultGooglePricingData;
}

function saveGooglePricingData(data) {
    try {
        localStorage.setItem(GOOGLE_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(GOOGLE_VERSION_KEY, GOOGLE_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving Google pricing data:', e);
    }
}
