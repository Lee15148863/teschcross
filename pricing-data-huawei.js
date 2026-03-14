// Huawei Pricing Database - Independent
const HUAWEI_STORAGE_KEY = 'techcross_pricing_huawei';
const HUAWEI_VERSION_KEY = 'techcross_pricing_huawei_version';
const HUAWEI_CURRENT_VERSION = '2.0';

const huaweiServiceTypes = {
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

function createDefaultHuaweiServices() {
    return { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, back_glass: 0 };
}

const defaultHuaweiPricingData = {
    name: 'Huawei',
    serviceTypes: huaweiServiceTypes,
    models: {
        'huawei-p60-pro': { name: 'Huawei P60 Pro', services: createDefaultHuaweiServices(), lastUpdated: new Date().toISOString() },
        'huawei-p50-pro': { name: 'Huawei P50 Pro', services: createDefaultHuaweiServices(), lastUpdated: new Date().toISOString() },
        'huawei-p40-pro': { name: 'Huawei P40 Pro', services: createDefaultHuaweiServices(), lastUpdated: new Date().toISOString() },
        'huawei-p30-pro': { name: 'Huawei P30 Pro', services: createDefaultHuaweiServices(), lastUpdated: new Date().toISOString() }
    }
};

function loadHuaweiPricingData() {
    try {
        const storedVersion = localStorage.getItem(HUAWEI_VERSION_KEY);
        if (storedVersion !== HUAWEI_CURRENT_VERSION) {
            localStorage.removeItem(HUAWEI_STORAGE_KEY);
            localStorage.setItem(HUAWEI_VERSION_KEY, HUAWEI_CURRENT_VERSION);
            saveHuaweiPricingData(defaultHuaweiPricingData);
            return defaultHuaweiPricingData;
        }
        const stored = localStorage.getItem(HUAWEI_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Error loading Huawei pricing data:', e);
    }
    saveHuaweiPricingData(defaultHuaweiPricingData);
    return defaultHuaweiPricingData;
}

function saveHuaweiPricingData(data) {
    try {
        localStorage.setItem(HUAWEI_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(HUAWEI_VERSION_KEY, HUAWEI_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving Huawei pricing data:', e);
    }
}
