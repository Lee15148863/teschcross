// Xiaomi Pricing Database - Independent
const XIAOMI_STORAGE_KEY = 'techcross_pricing_xiaomi';
const XIAOMI_VERSION_KEY = 'techcross_pricing_xiaomi_version';
const XIAOMI_CURRENT_VERSION = '2.0';

// Xiaomi Service Types (10 services)
const xiaomiServiceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_original: { name: 'Original Screen', description: 'Original manufacturer screen' },
    battery: { name: 'Battery Replacement', description: 'Battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration' },
    motherboard: { name: 'Motherboard/Liquid Damage Repair', description: 'Motherboard repairs. Water damage repair includes motherboard repair only. Replacement of additional components (e.g., display, charging port, earpiece, microphone, etc.) is not included and will be charged separately at parts cost if needed.' },
    camera: { name: 'Camera Replacement', description: 'Camera replacement' },
    speaker: { name: 'Speaker Repair', description: 'Speaker repair/replacement' },
    power_button: { name: 'Power Button Repair', description: 'Power button repair' },
    back_glass: { name: 'Back Glass Replacement', description: 'Back glass panel replacement' }
};

// Helper function to create default Xiaomi services
function createDefaultXiaomiServices() {
    return {
        screen_compatible: 0, screen_original: 0, battery: 0,
        charging_port: 0, software: 20, motherboard: 0,
        camera: 0, speaker: 0, power_button: 0, back_glass: 0
    };
}

// Default Xiaomi pricing data
const defaultXiaomiPricingData = {
    name: 'Xiaomi',
    serviceTypes: xiaomiServiceTypes,
    models: {
        'xiaomi-15-ultra': { name: 'Xiaomi 15 Ultra', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-15-pro': { name: 'Xiaomi 15 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-15': { name: 'Xiaomi 15', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-14-ultra': { name: 'Xiaomi 14 Ultra', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-14-pro': { name: 'Xiaomi 14 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-14': { name: 'Xiaomi 14', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-13-ultra': { name: 'Xiaomi 13 Ultra', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-13-pro': { name: 'Xiaomi 13 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-13': { name: 'Xiaomi 13', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-12-pro': { name: 'Xiaomi 12 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'xiaomi-12': { name: 'Xiaomi 12', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-14-pro-plus': { name: 'Redmi Note 14 Pro+', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-14-pro': { name: 'Redmi Note 14 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-14': { name: 'Redmi Note 14', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-13-pro-plus': { name: 'Redmi Note 13 Pro+', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-13-pro': { name: 'Redmi Note 13 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-13': { name: 'Redmi Note 13', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-12-pro-plus': { name: 'Redmi Note 12 Pro+', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-12-pro': { name: 'Redmi Note 12 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'redmi-note-12': { name: 'Redmi Note 12', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-f6-pro': { name: 'POCO F6 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-f6': { name: 'POCO F6', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-f5-pro': { name: 'POCO F5 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-f5': { name: 'POCO F5', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-x6-pro': { name: 'POCO X6 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-x6': { name: 'POCO X6', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-x5-pro': { name: 'POCO X5 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-x5': { name: 'POCO X5', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-m6-pro': { name: 'POCO M6 Pro', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() },
        'poco-m6': { name: 'POCO M6', services: createDefaultXiaomiServices(), lastUpdated: new Date().toISOString() }
    }
};

// Load Xiaomi pricing data
function loadXiaomiPricingData() {
    try {
        const storedVersion = localStorage.getItem(XIAOMI_VERSION_KEY);
        
        if (storedVersion !== XIAOMI_CURRENT_VERSION) {
            console.log('Xiaomi pricing version changed, clearing old data');
            localStorage.removeItem(XIAOMI_STORAGE_KEY);
            localStorage.setItem(XIAOMI_VERSION_KEY, XIAOMI_CURRENT_VERSION);
            saveXiaomiPricingData(defaultXiaomiPricingData);
            return defaultXiaomiPricingData;
        }
        
        const stored = localStorage.getItem(XIAOMI_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading Xiaomi pricing data:', e);
    }
    
    saveXiaomiPricingData(defaultXiaomiPricingData);
    return defaultXiaomiPricingData;
}

// Save Xiaomi pricing data
function saveXiaomiPricingData(data) {
    try {
        localStorage.setItem(XIAOMI_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(XIAOMI_VERSION_KEY, XIAOMI_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving Xiaomi pricing data:', e);
    }
}
