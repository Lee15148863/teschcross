// Apple Pricing Database - Independent
const APPLE_STORAGE_KEY = 'techcross_pricing_apple';
const APPLE_VERSION_KEY = 'techcross_pricing_apple_version';
const APPLE_CURRENT_VERSION = '3.0';

// iPhone Service Types
const iphoneServiceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_high_quality: { name: 'Screen (High Quality/Premium)', description: 'Premium quality screen replacement' },
    screen_original: { name: 'Original Screen', description: 'Original manufacturer screen' },
    battery: { name: 'Battery (High Quality/Premium)', description: 'Premium quality battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration' },
    back_glass: { name: 'Back Glass Replacement', description: 'Back glass panel replacement' },
    motherboard: { name: 'Motherboard/Liquid Damage/Audio/Touch IC Repair', description: 'Complex motherboard repairs' },
    rear_camera: { name: 'Rear Camera Replacement', description: 'Back camera replacement' },
    front_camera: { name: 'Front Camera Replacement', description: 'Front camera replacement' },
    camera_lens: { name: 'Camera Lens Replacement', description: 'Camera lens replacement' },
    microphone: { name: 'Microphone Repair', description: 'Microphone repair/replacement' },
    earpiece: { name: 'Earpiece Speaker Repair', description: 'Earpiece speaker repair' },
    loudspeaker: { name: 'Loudspeaker Replacement', description: 'Loudspeaker replacement' },
    power_button: { name: 'Power Button Repair', description: 'Power button repair' }
};

// iPad Service Types (different from iPhone)
const ipadServiceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_original: { name: 'Original Screen', description: 'Original manufacturer screen' },
    battery: { name: 'Battery Replacement', description: 'Battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration' },
    motherboard: { name: 'Motherboard/Liquid Damage Repair', description: 'Motherboard repairs' },
    camera: { name: 'Camera Replacement', description: 'Camera replacement' },
    speaker: { name: 'Speaker Repair', description: 'Speaker repair/replacement' },
    power_button: { name: 'Power Button Repair', description: 'Power button repair' },
    home_button: { name: 'Home Button Repair', description: 'Home button repair' }
};

// Default Apple pricing data
const defaultApplePricingData = {
    iphone: {
        name: 'iPhone',
        serviceTypes: iphoneServiceTypes,
        models: {
            'iphone-17-pro-max': { name: 'iPhone 17 Pro Max (A3526)', services: { screen_compatible: 0, screen_high_quality: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, back_glass: 100, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17-pro': { name: 'iPhone 17 Pro (A3521 Series)', services: { screen_compatible: 0, screen_high_quality: 275, screen_original: 0, battery: 0, charging_port: 0, software: 20, back_glass: 100, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17-air': { name: 'iPhone 17 Air (A3517 Series)', services: { screen_compatible: 0, screen_high_quality: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, back_glass: 100, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17': { name: 'iPhone 17 (A3513 Series)', services: { screen_compatible: 0, screen_high_quality: 250, screen_original: 0, battery: 0, charging_port: 105, software: 20, back_glass: 100, motherboard: 180, rear_camera: 135, front_camera: 95, camera_lens: 40, microphone: 105, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-16-pro-max': { name: 'iPhone 16 Pro Max (A3296)', services: { screen_compatible: 145, screen_high_quality: 255, screen_original: 470, battery: 70, charging_port: 100, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 100, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-16-pro': { name: 'iPhone 16 Pro (A3293)', services: { screen_compatible: 135, screen_high_quality: 195, screen_original: 0, battery: 70, charging_port: 100, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 100, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-16-plus': { name: 'iPhone 16 Plus (A3290)', services: { screen_compatible: 100, screen_high_quality: 195, screen_original: 0, battery: 65, charging_port: 85, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-16': { name: 'iPhone 16 (A3287)', services: { screen_compatible: 95, screen_high_quality: 180, screen_original: 0, battery: 65, charging_port: 85, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-16e': { name: 'iPhone 16e (A3409)', services: { screen_compatible: 95, screen_high_quality: 135, screen_original: 0, battery: 65, charging_port: 85, software: 20, back_glass: 80, motherboard: 180, rear_camera: 135, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-15-pro-max': { name: 'iPhone 15 Pro Max (A3106)', services: { screen_compatible: 105, screen_high_quality: 240, screen_original: 370, battery: 60, charging_port: 95, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 85, camera_lens: 30, microphone: 95, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-15-pro': { name: 'iPhone 15 Pro (A3102)', services: { screen_compatible: 100, screen_high_quality: 190, screen_original: 0, battery: 60, charging_port: 85, software: 20, back_glass: 80, motherboard: 180, rear_camera: 105, front_camera: 85, camera_lens: 30, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-15-plus': { name: 'iPhone 15 Plus (A3094)', services: { screen_compatible: 85, screen_high_quality: 190, screen_original: 0, battery: 55, charging_port: 85, software: 20, back_glass: 80, motherboard: 160, rear_camera: 90, front_camera: 80, camera_lens: 30, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-15': { name: 'iPhone 15 (A3090)', services: { screen_compatible: 85, screen_high_quality: 170, screen_original: 295, battery: 55, charging_port: 75, software: 20, back_glass: 80, motherboard: 160, rear_camera: 90, front_camera: 80, camera_lens: 30, microphone: 75, earpiece: 75, loudspeaker: 75, power_button: 75 }, lastUpdated: new Date().toISOString() },
            'iphone-14-pro-max': { name: 'iPhone 14 Pro Max (A2894)', services: { screen_compatible: 85, screen_high_quality: 220, screen_original: 0, battery: 60, charging_port: 80, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 80, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-14-pro': { name: 'iPhone 14 Pro (A2890)', services: { screen_compatible: 70, screen_high_quality: 195, screen_original: 0, battery: 60, charging_port: 80, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 80, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-14-plus': { name: 'iPhone 14 Plus (A2886)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, back_glass: 80, motherboard: 150, rear_camera: 80, front_camera: 70, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 75, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-14': { name: 'iPhone 14 (A2882)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 75, software: 20, back_glass: 80, motherboard: 150, rear_camera: 70, front_camera: 70, camera_lens: 30, microphone: 75, earpiece: 75, loudspeaker: 75, power_button: 75 }, lastUpdated: new Date().toISOString() },
            'iphone-se-3': { name: 'iPhone SE (3rd generation) (A2783)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 50, software: 20, back_glass: 80, motherboard: 90, rear_camera: 55, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-13-pro-max': { name: 'iPhone 13 Pro Max (A2643)', services: { screen_compatible: 80, screen_high_quality: 155, screen_original: 0, battery: 60, charging_port: 80, software: 20, back_glass: 80, motherboard: 150, rear_camera: 105, front_camera: 65, camera_lens: 30, microphone: 80, earpiece: 70, loudspeaker: 70, power_button: 70 }, lastUpdated: new Date().toISOString() },
            'iphone-13-pro': { name: 'iPhone 13 Pro (A2638)', services: { screen_compatible: 70, screen_high_quality: 150, screen_original: 0, battery: 60, charging_port: 75, software: 20, back_glass: 80, motherboard: 150, rear_camera: 105, front_camera: 65, camera_lens: 30, microphone: 75, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13': { name: 'iPhone 13 (A2633)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 70, software: 20, back_glass: 80, motherboard: 150, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 70, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13-mini': { name: 'iPhone 13 mini (A2628)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 70, software: 20, back_glass: 80, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 70, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12-pro-max': { name: 'iPhone 12 Pro Max (A2411)', services: { screen_compatible: 75, screen_high_quality: 0, screen_original: 0, battery: 60, charging_port: 65, software: 20, back_glass: 80, motherboard: 145, rear_camera: 110, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12-pro': { name: 'iPhone 12 Pro (A2407)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, back_glass: 80, motherboard: 145, rear_camera: 110, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12': { name: 'iPhone 12 (A2403)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, back_glass: 80, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12-mini': { name: 'iPhone 12 mini (A2399)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, back_glass: 80, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-se-2': { name: 'iPhone SE (2nd generation) (A2296)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 50, software: 20, back_glass: 80, motherboard: 145, rear_camera: 55, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 45, power_button: 50 }, lastUpdated: new Date().toISOString() },
            'iphone-11-pro-max': { name: 'iPhone 11 Pro Max (A2220)', services: { screen_compatible: 75, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, back_glass: 80, motherboard: 145, rear_camera: 85, front_camera: 60, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 70 }, lastUpdated: new Date().toISOString() },
            'iphone-11-pro': { name: 'iPhone 11 Pro (A2215)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, back_glass: 80, motherboard: 145, rear_camera: 85, front_camera: 60, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 70, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-11': { name: 'iPhone 11 (A2221)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 60, software: 20, back_glass: 80, motherboard: 145, rear_camera: 65, front_camera: 50, camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 50, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-xs-max': { name: 'iPhone XS Max (A2101)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 60, software: 20, back_glass: 0, motherboard: 120, rear_camera: 60, front_camera: 50, camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 50, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-xs': { name: 'iPhone XS (A2097)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, back_glass: 0, motherboard: 120, rear_camera: 60, front_camera: 50, camera_lens: 30, microphone: 55, earpiece: 55, loudspeaker: 50, power_button: 55 }, lastUpdated: new Date().toISOString() },
            'iphone-xr': { name: 'iPhone XR (A2105)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, back_glass: 0, motherboard: 120, rear_camera: 60, front_camera: 50, camera_lens: 30, microphone: 55, earpiece: 55, loudspeaker: 50, power_button: 55 }, lastUpdated: new Date().toISOString() },
            'iphone-x': { name: 'iPhone X (A1901)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, back_glass: 0, motherboard: 120, rear_camera: 60, front_camera: 50, camera_lens: 30, microphone: 55, earpiece: 55, loudspeaker: 50, power_button: 55 }, lastUpdated: new Date().toISOString() },
            'iphone-8-plus': { name: 'iPhone 8 Plus (A1897)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, back_glass: 0, motherboard: 85, rear_camera: 45, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
            'iphone-8': { name: 'iPhone 8 (A1905)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, back_glass: 0, motherboard: 85, rear_camera: 45, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
            'iphone-7-plus': { name: 'iPhone 7 Plus (A1784)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, back_glass: 0, motherboard: 80, rear_camera: 45, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
            'iphone-7': { name: 'iPhone 7 (A1778)', services: { screen_compatible: 45, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, back_glass: 0, motherboard: 80, rear_camera: 45, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() }
        }
    },
    ipad: {
        name: 'iPad',
        serviceTypes: ipadServiceTypes,
        models: {
            'ipad-pro-12-9-2024': { name: 'iPad Pro 12.9" (2024)', services: { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, home_button: 0 }, lastUpdated: new Date().toISOString() },
            'ipad-pro-11-2024': { name: 'iPad Pro 11" (2024)', services: { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, home_button: 0 }, lastUpdated: new Date().toISOString() },
            'ipad-air-2024': { name: 'iPad Air (2024)', services: { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, home_button: 0 }, lastUpdated: new Date().toISOString() },
            'ipad-10': { name: 'iPad (10th gen)', services: { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, home_button: 0 }, lastUpdated: new Date().toISOString() },
            'ipad-mini-6': { name: 'iPad mini (6th gen)', services: { screen_compatible: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, motherboard: 0, camera: 0, speaker: 0, power_button: 0, home_button: 0 }, lastUpdated: new Date().toISOString() }
        }
    }
};

// Load Apple pricing data
function loadApplePricingData() {
    try {
        const storedVersion = localStorage.getItem(APPLE_VERSION_KEY);
        
        if (storedVersion !== APPLE_CURRENT_VERSION) {
            console.log('Apple pricing version changed, clearing old data');
            localStorage.removeItem(APPLE_STORAGE_KEY);
            localStorage.setItem(APPLE_VERSION_KEY, APPLE_CURRENT_VERSION);
            saveApplePricingData(defaultApplePricingData);
            return defaultApplePricingData;
        }
        
        const stored = localStorage.getItem(APPLE_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading Apple pricing data:', e);
    }
    
    saveApplePricingData(defaultApplePricingData);
    return defaultApplePricingData;
}

// Save Apple pricing data
function saveApplePricingData(data) {
    try {
        localStorage.setItem(APPLE_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(APPLE_VERSION_KEY, APPLE_CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving Apple pricing data:', e);
    }
}
