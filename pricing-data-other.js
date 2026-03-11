// Other Brands Pricing Database - Independent
const OTHER_STORAGE_KEY = 'techcross_pricing_other';
const OTHER_VERSION_KEY = 'techcross_pricing_other_version';
const OTHER_CURRENT_VERSION = '2.0';

const otherServiceTypes = {
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

function createDefaultOtherServices() {
    return { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, back_glass: 0 };
}

const defaultOtherPricingData = {
    name: 'Other Brands',
    serviceTypes: otherServiceTypes,
    models: {
        'motorola-edge-50-pro': { name: 'Motorola Edge 50 Pro', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'motorola-edge-40-pro': { name: 'Motorola Edge 40 Pro', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'motorola-g84': { name: 'Motorola Moto G84', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'nokia-g60': { name: 'Nokia G60', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'nokia-x30': { name: 'Nokia X30', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'sony-xperia-1-v': { name: 'Sony Xperia 1 V', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'sony-xperia-5-v': { name: 'Sony Xperia 5 V', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'asus-rog-phone-8': { name: 'ASUS ROG Phone 8', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'asus-zenfone-10': { name: 'ASUS Zenfone 10', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'realme-gt-6': { name: 'Realme GT 6', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() },
        'realme-12-pro-plus': { name: 'Realme 12 Pro+', services: createDefaultOtherServices(), lastUpdated: new Date().toISOString() }
    }
};

function loadOtherPricingData() {
    try {
        const storedVersion = localStorage.getItem(OTHER_VERSION_KEY);
        if (storedVersion !== OTHER_CURRENT_VERSION) {
            localStorage.removeItem(OTHER_STORAGE_KEY);
            localStorage.setItem(OTHER_VERSION_KEY, OTHER_CURRENT_VERSION);
            saveOtherPricingData(defaultOtherPricingData);
            return defaultOtherPricingData;
        }
        const stored = localStorage.getItem(OTHER_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Error loading Other brands pricing data:', e);
    }
    saveOtherPricingData(defaultOtherPricingData);
    return defaultOtherPricingData;
}

function saveOtherPricingData(data) {
    try {
        localStorage.setItem(OTHER_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(OTHER_VERSION_KEY, OTHER_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving Other brands pricing data:', e);
    }
}
