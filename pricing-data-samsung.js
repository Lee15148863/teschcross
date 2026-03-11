// Samsung Pricing Database - Independent
const SAMSUNG_STORAGE_KEY = 'techcross_pricing_samsung';
const SAMSUNG_VERSION_KEY = 'techcross_pricing_samsung_version';
const SAMSUNG_CURRENT_VERSION = '2.0';

// Samsung Phone Service Types
const samsungPhoneServiceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_high_quality: { name: 'Screen (High Quality/Premium)', description: 'Premium quality screen replacement' },
    screen_original: { name: 'Original Screen (Samsung Services Pack)', description: 'Original Samsung screen with warranty' },
    battery: { name: 'Battery (High Quality/Premium)', description: 'Premium quality battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration' },
    back_glass: { name: 'Back Glass Replacement', description: 'Back glass panel replacement' },
    motherboard: { name: 'Motherboard/Liquid Damage Repair', description: 'Motherboard repairs' },
    rear_camera: { name: 'Rear Camera Replacement', description: 'Back camera replacement' },
    front_camera: { name: 'Front Camera Replacement', description: 'Front camera replacement' },
    camera_lens: { name: 'Camera Lens Replacement', description: 'Camera lens replacement' },
    microphone: { name: 'Microphone Repair', description: 'Microphone repair/replacement' },
    earpiece: { name: 'Earpiece Speaker Repair', description: 'Earpiece speaker repair' },
    loudspeaker: { name: 'Loudspeaker Replacement', description: 'Loudspeaker replacement' },
    power_button: { name: 'Power Button Repair', description: 'Power button repair' }
};

// Samsung Tablet Service Types (different from phones)
const samsungTabletServiceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_original: { name: 'Original Screen (Samsung Services Pack)', description: 'Original Samsung screen' },
    battery: { name: 'Battery Replacement', description: 'Battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration' },
    motherboard: { name: 'Motherboard/Liquid Damage Repair', description: 'Motherboard repairs' },
    camera: { name: 'Camera Replacement', description: 'Camera replacement' },
    speaker: { name: 'Speaker Repair', description: 'Speaker repair/replacement' },
    power_button: { name: 'Power Button Repair', description: 'Power button repair' },
    home_button: { name: 'Home Button Repair', description: 'Home button repair' }
};

// Helper functions
function createDefaultSamsungPhoneServices() {
    return {
        screen_compatible: 0, screen_high_quality: 0, screen_original: 0,
        battery: 0, charging_port: 0, software: 0,
        back_glass: 0, motherboard: 0,
        rear_camera: 0, front_camera: 0, camera_lens: 0,
        microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0
    };
}

function createDefaultSamsungTabletServices() {
    return {
        screen_compatible: 0, screen_original: 0,
        battery: 0, charging_port: 0, software: 0,
        motherboard: 0, camera: 0, speaker: 0,
        power_button: 0, home_button: 0
    };
}

// Default Samsung pricing data
const defaultSamsungPricingData = {
    phone: {
        name: 'Samsung Phone',
        serviceTypes: samsungPhoneServiceTypes,
        models: {
            'galaxy-s24-ultra': { name: 'Galaxy S24 Ultra', services: createDefaultSamsungPhoneServices(), lastUpdated: new Date().toISOString() },
            'galaxy-s24-plus': { name: 'Galaxy S24+', services: createDefaultSamsungPhoneServices(), lastUpdated: new Date().toISOString() },
            'galaxy-s24': { name: 'Galaxy S24', services: createDefaultSamsungPhoneServices(), lastUpdated: new Date().toISOString() }
            // 更多Samsung手机型号
        }
    },
    tablet: {
        name: 'Samsung Tablet',
        serviceTypes: samsungTabletServiceTypes,
        models: {
            'galaxy-tab-s9-ultra': { name: 'Galaxy Tab S9 Ultra', services: createDefaultSamsungTabletServices(), lastUpdated: new Date().toISOString() },
            'galaxy-tab-s9-plus': { name: 'Galaxy Tab S9+', services: createDefaultSamsungTabletServices(), lastUpdated: new Date().toISOString() },
            'galaxy-tab-s9': { name: 'Galaxy Tab S9', services: createDefaultSamsungTabletServices(), lastUpdated: new Date().toISOString() },
            'galaxy-tab-a9-plus': { name: 'Galaxy Tab A9+', services: createDefaultSamsungTabletServices(), lastUpdated: new Date().toISOString() }
        }
    }
};

// Load Samsung pricing data
function loadSamsungPricingData() {
    try {
        const storedVersion = localStorage.getItem(SAMSUNG_VERSION_KEY);
        
        if (storedVersion !== SAMSUNG_CURRENT_VERSION) {
            localStorage.removeItem(SAMSUNG_STORAGE_KEY);
            localStorage.setItem(SAMSUNG_VERSION_KEY, SAMSUNG_CURRENT_VERSION);
            saveSamsungPricingData(defaultSamsungPricingData);
            return defaultSamsungPricingData;
        }
        
        const stored = localStorage.getItem(SAMSUNG_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading Samsung pricing data:', e);
    }
    
    saveSamsungPricingData(defaultSamsungPricingData);
    return defaultSamsungPricingData;
}

// Save Samsung pricing data
function saveSamsungPricingData(data) {
    try {
        localStorage.setItem(SAMSUNG_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(SAMSUNG_VERSION_KEY, SAMSUNG_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving Samsung pricing data:', e);
    }
}
