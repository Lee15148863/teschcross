// Honor Pricing Database - Independent
const HONOR_STORAGE_KEY = 'techcross_pricing_honor';
const HONOR_VERSION_KEY = 'techcross_pricing_honor_version';
const HONOR_CURRENT_VERSION = '2.0';

const honorServiceTypes = {
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

function createDefaultHonorServices() {
    return { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, back_glass: 0 };
}

const defaultHonorPricingData = {
    name: 'Honor',
    serviceTypes: honorServiceTypes,
    models: {
        'honor-magic-7-pro': { name: 'Honor Magic 7 Pro', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-magic-6-pro': { name: 'Honor Magic 6 Pro', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-magic-5-pro': { name: 'Honor Magic 5 Pro', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-90': { name: 'Honor 90', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-80': { name: 'Honor 80', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-70': { name: 'Honor 70', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-60': { name: 'Honor 60', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-50': { name: 'Honor 50', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x9b': { name: 'Honor X9b', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x9a': { name: 'Honor X9a', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x8b': { name: 'Honor X8b', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x8a': { name: 'Honor X8a', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x7b': { name: 'Honor X7b', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x7a': { name: 'Honor X7a', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x6b': { name: 'Honor X6b', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x6a': { name: 'Honor X6a', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-x5-plus': { name: 'Honor X5 Plus', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-200-pro': { name: 'Honor 200 Pro', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-200': { name: 'Honor 200', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() },
        'honor-100': { name: 'Honor 100', services: createDefaultHonorServices(), lastUpdated: new Date().toISOString() }
    }
};

function loadHonorPricingData() {
    try {
        const storedVersion = localStorage.getItem(HONOR_VERSION_KEY);
        if (storedVersion !== HONOR_CURRENT_VERSION) {
            localStorage.removeItem(HONOR_STORAGE_KEY);
            localStorage.setItem(HONOR_VERSION_KEY, HONOR_CURRENT_VERSION);
            saveHonorPricingData(defaultHonorPricingData);
            return defaultHonorPricingData;
        }
        const stored = localStorage.getItem(HONOR_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Error loading Honor pricing data:', e);
    }
    saveHonorPricingData(defaultHonorPricingData);
    return defaultHonorPricingData;
}

function saveHonorPricingData(data) {
    try {
        localStorage.setItem(HONOR_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(HONOR_VERSION_KEY, HONOR_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving Honor pricing data:', e);
    }
}
