// OPPO Pricing Database - Independent
const OPPO_STORAGE_KEY = 'techcross_pricing_oppo';
const OPPO_VERSION_KEY = 'techcross_pricing_oppo_version';
const OPPO_CURRENT_VERSION = '2.0';

const oppoServiceTypes = {
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

function createDefaultOppoServices() {
    return { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, back_glass: 0 };
}

const defaultOppoPricingData = {
    name: 'OPPO',
    serviceTypes: oppoServiceTypes,
    models: {
        'oppo-find-x8-pro': { name: 'OPPO Find X8 Pro', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-find-x8': { name: 'OPPO Find X8', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-find-x7-ultra': { name: 'OPPO Find X7 Ultra', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-find-x7': { name: 'OPPO Find X7', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-find-x6-pro': { name: 'OPPO Find X6 Pro', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-find-x5-pro': { name: 'OPPO Find X5 Pro', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-reno-12-pro': { name: 'OPPO Reno 12 Pro', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-reno-12': { name: 'OPPO Reno 12', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-reno-11-pro': { name: 'OPPO Reno 11 Pro', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-reno-11': { name: 'OPPO Reno 11', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-reno-10-pro': { name: 'OPPO Reno 10 Pro', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-reno-10': { name: 'OPPO Reno 10', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-reno-8-pro': { name: 'OPPO Reno 8 Pro', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-reno-8': { name: 'OPPO Reno 8', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a98': { name: 'OPPO A98', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a78': { name: 'OPPO A78', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a58': { name: 'OPPO A58', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a38': { name: 'OPPO A38', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a18': { name: 'OPPO A18', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a17': { name: 'OPPO A17', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a96': { name: 'OPPO A96', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a76': { name: 'OPPO A76', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a54': { name: 'OPPO A54', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() },
        'oppo-a16': { name: 'OPPO A16', services: createDefaultOppoServices(), lastUpdated: new Date().toISOString() }
    }
};

function loadOppoPricingData() {
    try {
        const storedVersion = localStorage.getItem(OPPO_VERSION_KEY);
        if (storedVersion !== OPPO_CURRENT_VERSION) {
            localStorage.removeItem(OPPO_STORAGE_KEY);
            localStorage.setItem(OPPO_VERSION_KEY, OPPO_CURRENT_VERSION);
            saveOppoPricingData(defaultOppoPricingData);
            return defaultOppoPricingData;
        }
        const stored = localStorage.getItem(OPPO_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Error loading OPPO pricing data:', e);
    }
    saveOppoPricingData(defaultOppoPricingData);
    return defaultOppoPricingData;
}

function saveOppoPricingData(data) {
    try {
        localStorage.setItem(OPPO_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(OPPO_VERSION_KEY, OPPO_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving OPPO pricing data:', e);
    }
}
