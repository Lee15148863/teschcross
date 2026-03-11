// OnePlus Pricing Database - Independent
const ONEPLUS_STORAGE_KEY = 'techcross_pricing_oneplus';
const ONEPLUS_VERSION_KEY = 'techcross_pricing_oneplus_version';
const ONEPLUS_CURRENT_VERSION = '2.0';

const oneplusServiceTypes = {
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

function createDefaultOnePlusServices() {
    return { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, back_glass: 0 };
}

const defaultOnePlusPricingData = {
    name: 'OnePlus',
    serviceTypes: oneplusServiceTypes,
    models: {
        'oneplus-13': { name: 'OnePlus 13', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-12': { name: 'OnePlus 12', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-11': { name: 'OnePlus 11', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-10-pro': { name: 'OnePlus 10 Pro', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-10t': { name: 'OnePlus 10T', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-9-pro': { name: 'OnePlus 9 Pro', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-9': { name: 'OnePlus 9', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-8-pro': { name: 'OnePlus 8 Pro', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-8t': { name: 'OnePlus 8T', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-4': { name: 'OnePlus Nord 4', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-3': { name: 'OnePlus Nord 3', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-2t': { name: 'OnePlus Nord 2T', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-ce-4': { name: 'OnePlus Nord CE 4', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-ce-3': { name: 'OnePlus Nord CE 3', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-ce-2': { name: 'OnePlus Nord CE 2', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-n30': { name: 'OnePlus Nord N30', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-n20': { name: 'OnePlus Nord N20', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() },
        'oneplus-nord-n10': { name: 'OnePlus Nord N10', services: createDefaultOnePlusServices(), lastUpdated: new Date().toISOString() }
    }
};

function loadOnePlusPricingData() {
    try {
        const storedVersion = localStorage.getItem(ONEPLUS_VERSION_KEY);
        if (storedVersion !== ONEPLUS_CURRENT_VERSION) {
            localStorage.removeItem(ONEPLUS_STORAGE_KEY);
            localStorage.setItem(ONEPLUS_VERSION_KEY, ONEPLUS_CURRENT_VERSION);
            saveOnePlusPricingData(defaultOnePlusPricingData);
            return defaultOnePlusPricingData;
        }
        const stored = localStorage.getItem(ONEPLUS_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Error loading OnePlus pricing data:', e);
    }
    saveOnePlusPricingData(defaultOnePlusPricingData);
    return defaultOnePlusPricingData;
}

function saveOnePlusPricingData(data) {
    try {
        localStorage.setItem(ONEPLUS_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(ONEPLUS_VERSION_KEY, ONEPLUS_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving OnePlus pricing data:', e);
    }
}
