// Pricing database - stored in localStorage
const PRICING_STORAGE_KEY = 'techcross_pricing_data';
const PRICING_VERSION_KEY = 'techcross_pricing_version';
const CURRENT_VERSION = '3.0'; // Updated version - removed network_unlock and frp_reset, updated Apple pricing

// Service types with descriptions
const serviceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_high_quality: { name: 'Screen (High Quality/Premium)', description: 'Premium quality screen replacement' },
    screen_original: { name: 'Original Screen', description: 'Original manufacturer screen (Samsung Services Pack)' },
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

// Helper function to create default services (all 0)
function createDefaultServices() {
    return {
        screen_compatible: 0, screen_high_quality: 0, screen_original: 0,
        battery: 0, charging_port: 0, software: 0,
        back_glass: 0, motherboard: 0,
        rear_camera: 0, front_camera: 0, camera_lens: 0,
        microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0
    };
}

// Helper function to create a model with default services
function createModel(name) {
    return {
        name: name,
        services: createDefaultServices(),
        lastUpdated: new Date().toISOString()
    };
}

// Default pricing data
const defaultPricingData = {
    apple: {
        name: 'Apple',
        models: {
            'iphone-7': { name: 'iPhone 7 (A1778)', services: { screen_compatible: 45, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, back_glass: 0, motherboard: 80, rear_camera: 45, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
            'iphone-7-plus': { name: 'iPhone 7 Plus (A1784)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, back_glass: 0, motherboard: 80, rear_camera: 45, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
            'iphone-8': { name: 'iPhone 8 (A1905)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, back_glass: 0, motherboard: 85, rear_camera: 45, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
            'iphone-8-plus': { name: 'iPhone 8 Plus (A1897)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, back_glass: 0, motherboard: 85, rear_camera: 45, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
            'iphone-x': { name: 'iPhone X (A1901)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, back_glass: 0, motherboard: 120, rear_camera: 60, front_camera: 50, camera_lens: 30, microphone: 55, earpiece: 55, loudspeaker: 50, power_button: 55 }, lastUpdated: new Date().toISOString() },
            'iphone-xr': { name: 'iPhone XR (A2105)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, back_glass: 0, motherboard: 120, rear_camera: 60, front_camera: 50, camera_lens: 30, microphone: 55, earpiece: 55, loudspeaker: 50, power_button: 55 }, lastUpdated: new Date().toISOString() },
            'iphone-xs': { name: 'iPhone XS (A2097)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, back_glass: 0, motherboard: 120, rear_camera: 60, front_camera: 50, camera_lens: 30, microphone: 55, earpiece: 55, loudspeaker: 50, power_button: 55 }, lastUpdated: new Date().toISOString() },
            'iphone-xs-max': { name: 'iPhone XS Max (A2101)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 60, software: 20, back_glass: 0, motherboard: 120, rear_camera: 60, front_camera: 50, camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 50, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-11': { name: 'iPhone 11 (A2221)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 60, software: 20, back_glass: 80, motherboard: 145, rear_camera: 65, front_camera: 50, camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 50, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-11-pro': { name: 'iPhone 11 Pro (A2215)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, back_glass: 80, motherboard: 145, rear_camera: 85, front_camera: 60, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 70, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-11-pro-max': { name: 'iPhone 11 Pro Max (A2220)', services: { screen_compatible: 75, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, back_glass: 80, motherboard: 145, rear_camera: 85, front_camera: 60, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 70 }, lastUpdated: new Date().toISOString() },
            'iphone-se-2': { name: 'iPhone SE (2nd generation) (A2296)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 50, software: 20, back_glass: 80, motherboard: 145, rear_camera: 55, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 45, power_button: 50 }, lastUpdated: new Date().toISOString() },
            'iphone-12-mini': { name: 'iPhone 12 mini (A2399)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, back_glass: 80, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12': { name: 'iPhone 12 (A2403)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, back_glass: 80, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12-pro': { name: 'iPhone 12 Pro (A2407)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, back_glass: 80, motherboard: 145, rear_camera: 110, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12-pro-max': { name: 'iPhone 12 Pro Max (A2411)', services: { screen_compatible: 75, screen_high_quality: 0, screen_original: 0, battery: 60, charging_port: 65, software: 20, back_glass: 80, motherboard: 145, rear_camera: 110, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13-mini': { name: 'iPhone 13 mini (A2628)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 70, software: 20, back_glass: 80, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 70, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13': { name: 'iPhone 13 (A2633)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 70, software: 20, back_glass: 80, motherboard: 150, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 70, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13-pro': { name: 'iPhone 13 Pro (A2638)', services: { screen_compatible: 70, screen_high_quality: 150, screen_original: 0, battery: 60, charging_port: 75, software: 20, back_glass: 80, motherboard: 150, rear_camera: 105, front_camera: 65, camera_lens: 30, microphone: 75, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13-pro-max': { name: 'iPhone 13 Pro Max (A2643)', services: { screen_compatible: 80, screen_high_quality: 155, screen_original: 0, battery: 60, charging_port: 80, software: 20, back_glass: 80, motherboard: 150, rear_camera: 105, front_camera: 65, camera_lens: 30, microphone: 80, earpiece: 70, loudspeaker: 70, power_button: 70 }, lastUpdated: new Date().toISOString() },
            'iphone-se-3': { name: 'iPhone SE (3rd generation) (A2783)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 50, software: 20, back_glass: 80, motherboard: 90, rear_camera: 55, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-14': { name: 'iPhone 14 (A2882)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 75, software: 20, back_glass: 80, motherboard: 150, rear_camera: 70, front_camera: 70, camera_lens: 30, microphone: 75, earpiece: 75, loudspeaker: 75, power_button: 75 }, lastUpdated: new Date().toISOString() },
            'iphone-14-plus': { name: 'iPhone 14 Plus (A2886)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, back_glass: 80, motherboard: 150, rear_camera: 80, front_camera: 70, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 75, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-14-pro': { name: 'iPhone 14 Pro (A2890)', services: { screen_compatible: 70, screen_high_quality: 195, screen_original: 0, battery: 60, charging_port: 80, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 80, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-14-pro-max': { name: 'iPhone 14 Pro Max (A2894)', services: { screen_compatible: 85, screen_high_quality: 220, screen_original: 0, battery: 60, charging_port: 80, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 80, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-15': { name: 'iPhone 15 (A3090)', services: { screen_compatible: 85, screen_high_quality: 170, screen_original: 295, battery: 55, charging_port: 75, software: 20, back_glass: 80, motherboard: 160, rear_camera: 90, front_camera: 80, camera_lens: 30, microphone: 75, earpiece: 75, loudspeaker: 75, power_button: 75 }, lastUpdated: new Date().toISOString() },
            'iphone-15-plus': { name: 'iPhone 15 Plus (A3094)', services: { screen_compatible: 85, screen_high_quality: 190, screen_original: 0, battery: 55, charging_port: 85, software: 20, back_glass: 80, motherboard: 160, rear_camera: 90, front_camera: 80, camera_lens: 30, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-15-pro': { name: 'iPhone 15 Pro (A3102)', services: { screen_compatible: 100, screen_high_quality: 190, screen_original: 0, battery: 60, charging_port: 85, software: 20, back_glass: 80, motherboard: 180, rear_camera: 105, front_camera: 85, camera_lens: 30, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-15-pro-max': { name: 'iPhone 15 Pro Max (A3106)', services: { screen_compatible: 105, screen_high_quality: 240, screen_original: 370, battery: 60, charging_port: 95, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 85, camera_lens: 30, microphone: 95, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-16': { name: 'iPhone 16 (A3287)', services: { screen_compatible: 95, screen_high_quality: 180, screen_original: 0, battery: 65, charging_port: 85, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-16-plus': { name: 'iPhone 16 Plus (A3290)', services: { screen_compatible: 100, screen_high_quality: 195, screen_original: 0, battery: 65, charging_port: 85, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-16-pro': { name: 'iPhone 16 Pro (A3293)', services: { screen_compatible: 135, screen_high_quality: 195, screen_original: 0, battery: 70, charging_port: 100, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 100, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-16-pro-max': { name: 'iPhone 16 Pro Max (A3296)', services: { screen_compatible: 145, screen_high_quality: 255, screen_original: 470, battery: 70, charging_port: 100, software: 20, back_glass: 80, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 100, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-16e': { name: 'iPhone 16e (A3409)', services: { screen_compatible: 95, screen_high_quality: 135, screen_original: 0, battery: 65, charging_port: 85, software: 20, back_glass: 80, motherboard: 180, rear_camera: 135, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-17': { name: 'iPhone 17 (A3513 Series)', services: { screen_compatible: 0, screen_high_quality: 250, screen_original: 0, battery: 0, charging_port: 105, software: 20, back_glass: 100, motherboard: 180, rear_camera: 135, front_camera: 95, camera_lens: 40, microphone: 105, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17-air': { name: 'iPhone 17 Air (A3517 Series)', services: { screen_compatible: 0, screen_high_quality: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, back_glass: 100, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17-pro': { name: 'iPhone 17 Pro (A3521 Series)', services: { screen_compatible: 0, screen_high_quality: 275, screen_original: 0, battery: 0, charging_port: 0, software: 20, back_glass: 100, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17-pro-max': { name: 'iPhone 17 Pro Max (A3526)', services: { screen_compatible: 0, screen_high_quality: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, back_glass: 100, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() }
        }
    },
    samsung: {
        name: 'Samsung',
        models: {
            // Samsung models will be added here - user will provide pricing data
            // Placeholder structure - to be populated with actual models
        }
    },
    xiaomi: {
        name: 'Xiaomi',
        models: {
            // Xiaomi models - using default pricing (all 0 = Please Contact Us)
            'redmi-note-13-pro-plus-5g': createModel('Redmi Note 13 Pro+ 5G'),
            'redmi-note-13-pro-5g': createModel('Redmi Note 13 Pro 5G'),
            'redmi-note-13-5g': createModel('Redmi Note 13 5G'),
            'redmi-note-13': createModel('Redmi Note 13'),
            'redmi-note-12-pro-plus-5g': createModel('Redmi Note 12 Pro+ 5G'),
            'redmi-note-12-pro-5g': createModel('Redmi Note 12 Pro 5G'),
            'redmi-note-12-5g': createModel('Redmi Note 12 5G'),
            'redmi-note-12': createModel('Redmi Note 12'),
            'redmi-note-11-pro-plus-5g': createModel('Redmi Note 11 Pro+ 5G'),
            'redmi-note-11-pro-5g': createModel('Redmi Note 11 Pro 5G'),
            'redmi-note-11-5g': createModel('Redmi Note 11 5G'),
            'redmi-note-11': createModel('Redmi Note 11'),
            'redmi-note-10-pro': createModel('Redmi Note 10 Pro'),
            'redmi-note-10-5g': createModel('Redmi Note 10 5G'),
            'redmi-note-10': createModel('Redmi Note 10'),
            'redmi-note-9-pro': createModel('Redmi Note 9 Pro'),
            'redmi-note-9': createModel('Redmi Note 9'),
            'redmi-note-8-pro': createModel('Redmi Note 8 Pro'),
            'redmi-note-8': createModel('Redmi Note 8'),
            'xiaomi-14-ultra': createModel('Xiaomi 14 Ultra'),
            'xiaomi-14-pro': createModel('Xiaomi 14 Pro'),
            'xiaomi-14': createModel('Xiaomi 14'),
            'xiaomi-13-ultra': createModel('Xiaomi 13 Ultra'),
            'xiaomi-13-pro': createModel('Xiaomi 13 Pro'),
            'xiaomi-13': createModel('Xiaomi 13'),
            'xiaomi-13-lite': createModel('Xiaomi 13 Lite'),
            'xiaomi-12-pro': createModel('Xiaomi 12 Pro'),
            'xiaomi-12': createModel('Xiaomi 12'),
            'xiaomi-12-lite': createModel('Xiaomi 12 Lite'),
            'xiaomi-11-ultra': createModel('Xiaomi 11 Ultra'),
            'xiaomi-11-pro': createModel('Xiaomi 11 Pro'),
            'xiaomi-11': createModel('Xiaomi 11'),
            'xiaomi-11-lite-5g-ne': createModel('Xiaomi 11 Lite 5G NE'),
            'xiaomi-10-pro': createModel('Xiaomi 10 Pro'),
            'xiaomi-10': createModel('Xiaomi 10'),
            'poco-x6-pro': createModel('POCO X6 Pro'),
            'poco-x6': createModel('POCO X6'),
            'poco-x5-pro': createModel('POCO X5 Pro'),
            'poco-x5': createModel('POCO X5'),
            'poco-x4-pro': createModel('POCO X4 Pro'),
            'poco-x3-pro': createModel('POCO X3 Pro'),
            'poco-x3-nfc': createModel('POCO X3 NFC'),
            'poco-f6-pro': createModel('POCO F6 Pro'),
            'poco-f6': createModel('POCO F6'),
            'poco-f5-pro': createModel('POCO F5 Pro'),
            'poco-f5': createModel('POCO F5'),
            'poco-f4-gt': createModel('POCO F4 GT'),
            'poco-f4': createModel('POCO F4'),
            'poco-f3': createModel('POCO F3'),
            'poco-m6-pro': createModel('POCO M6 Pro'),
            'poco-m5': createModel('POCO M5'),
            'poco-m4-pro': createModel('POCO M4 Pro'),
            'redmi-13c': createModel('Redmi 13C'),
            'redmi-12c': createModel('Redmi 12C'),
            'redmi-12': createModel('Redmi 12'),
            'redmi-11': createModel('Redmi 11'),
            'redmi-10c': createModel('Redmi 10C'),
            'redmi-10': createModel('Redmi 10'),
            'redmi-9c': createModel('Redmi 9C'),
            'redmi-9a': createModel('Redmi 9A'),
            'redmi-9': createModel('Redmi 9')
        }
    },
    google: {
        name: 'Google',
        models: {
            'pixel-9-pro-xl': createModel('Pixel 9 Pro XL'),
            'pixel-9-pro': createModel('Pixel 9 Pro'),
            'pixel-9': createModel('Pixel 9'),
            'pixel-8-pro': createModel('Pixel 8 Pro'),
            'pixel-8': createModel('Pixel 8'),
            'pixel-8a': createModel('Pixel 8a'),
            'pixel-7-pro': createModel('Pixel 7 Pro'),
            'pixel-7': createModel('Pixel 7'),
            'pixel-7a': createModel('Pixel 7a'),
            'pixel-6-pro': createModel('Pixel 6 Pro'),
            'pixel-6': createModel('Pixel 6'),
            'pixel-6a': createModel('Pixel 6a'),
            'pixel-5': createModel('Pixel 5'),
            'pixel-5a': createModel('Pixel 5a'),
            'pixel-4-xl': createModel('Pixel 4 XL'),
            'pixel-4': createModel('Pixel 4'),
            'pixel-4a': createModel('Pixel 4a')
        }
    },
    oneplus: {
        name: 'OnePlus',
        models: {
            'oneplus-12': createModel('OnePlus 12'),
            'oneplus-11': createModel('OnePlus 11'),
            'oneplus-10-pro': createModel('OnePlus 10 Pro'),
            'oneplus-10t': createModel('OnePlus 10T'),
            'oneplus-9-pro': createModel('OnePlus 9 Pro'),
            'oneplus-9': createModel('OnePlus 9'),
            'oneplus-9r': createModel('OnePlus 9R'),
            'oneplus-8-pro': createModel('OnePlus 8 Pro'),
            'oneplus-8t': createModel('OnePlus 8T'),
            'oneplus-8': createModel('OnePlus 8'),
            'oneplus-7-pro': createModel('OnePlus 7 Pro'),
            'oneplus-7t': createModel('OnePlus 7T'),
            'oneplus-7': createModel('OnePlus 7'),
            'oneplus-nord-3': createModel('OnePlus Nord 3'),
            'oneplus-nord-2t': createModel('OnePlus Nord 2T'),
            'oneplus-nord-2': createModel('OnePlus Nord 2'),
            'oneplus-nord-ce-3': createModel('OnePlus Nord CE 3'),
            'oneplus-nord-ce-2': createModel('OnePlus Nord CE 2')
        }
    },
    oppo: {
        name: 'OPPO',
        models: {
            'oppo-find-x7-ultra': createModel('Find X7 Ultra'),
            'oppo-find-x7': createModel('Find X7'),
            'oppo-find-x6-pro': createModel('Find X6 Pro'),
            'oppo-find-x5-pro': createModel('Find X5 Pro'),
            'oppo-find-x5': createModel('Find X5'),
            'oppo-find-x3-pro': createModel('Find X3 Pro'),
            'oppo-find-x3': createModel('Find X3'),
            'oppo-reno-11-pro': createModel('Reno 11 Pro'),
            'oppo-reno-11': createModel('Reno 11'),
            'oppo-reno-10-pro-plus': createModel('Reno 10 Pro+'),
            'oppo-reno-10-pro': createModel('Reno 10 Pro'),
            'oppo-reno-10': createModel('Reno 10'),
            'oppo-reno-9-pro': createModel('Reno 9 Pro'),
            'oppo-reno-9': createModel('Reno 9'),
            'oppo-reno-8-pro': createModel('Reno 8 Pro'),
            'oppo-reno-8': createModel('Reno 8'),
            'oppo-reno-7-pro': createModel('Reno 7 Pro'),
            'oppo-reno-7': createModel('Reno 7'),
            'oppo-a98': createModel('A98'),
            'oppo-a78': createModel('A78'),
            'oppo-a58': createModel('A58'),
            'oppo-a38': createModel('A38'),
            'oppo-a18': createModel('A18'),
            'oppo-a17': createModel('A17')
        }
    },
    huawei: {
        name: 'Huawei',
        models: {
            'huawei-p60-pro': createModel('P60 Pro'),
            'huawei-p50-pro': createModel('P50 Pro'),
            'huawei-p40-pro': createModel('P40 Pro'),
            'huawei-p30-pro': createModel('P30 Pro')
        }
    },
    honor: {
        name: 'Honor',
        models: {
            'honor-magic-6-pro': createModel('Magic 6 Pro'),
            'honor-magic-5-pro': createModel('Magic 5 Pro'),
            'honor-magic-4-pro': createModel('Magic 4 Pro'),
            'honor-90': createModel('Honor 90'),
            'honor-80': createModel('Honor 80'),
            'honor-70': createModel('Honor 70'),
            'honor-50': createModel('Honor 50'),
            'honor-x9b': createModel('X9b'),
            'honor-x9a': createModel('X9a'),
            'honor-x8b': createModel('X8b'),
            'honor-x8a': createModel('X8a'),
            'honor-x7b': createModel('X7b'),
            'honor-x7a': createModel('X7a'),
            'honor-x6b': createModel('X6b'),
            'honor-x6a': createModel('X6a'),
            'honor-200-pro': createModel('200 Pro'),
            'honor-200': createModel('200'),
            'honor-100': createModel('100'),
            'honor-20-pro': createModel('20 Pro'),
            'honor-10': createModel('10')
        }
    },
    other: {
        name: 'Other Brands',
        models: {
            'nokia-g60': createModel('Nokia G60'),
            'nokia-g50': createModel('Nokia G50'),
            'motorola-edge-50-pro': createModel('Motorola Edge 50 Pro'),
            'motorola-edge-40-pro': createModel('Motorola Edge 40 Pro'),
            'motorola-edge-30-pro': createModel('Motorola Edge 30 Pro'),
            'sony-xperia-1-v': createModel('Sony Xperia 1 V'),
            'sony-xperia-5-v': createModel('Sony Xperia 5 V'),
            'asus-rog-phone-8-pro': createModel('ASUS ROG Phone 8 Pro'),
            'asus-rog-phone-7': createModel('ASUS ROG Phone 7'),
            'realme-gt-5-pro': createModel('Realme GT 5 Pro'),
            'realme-gt-3': createModel('Realme GT 3')
        }
    }
};

// Load pricing data from localStorage or use defaults
function loadPricingData() {
    try {
        const storedVersion = localStorage.getItem(PRICING_VERSION_KEY);
        
        // Check if version has changed - if so, clear old data
        if (storedVersion !== CURRENT_VERSION) {
            console.log('Pricing data version changed, clearing old data');
            localStorage.removeItem(PRICING_STORAGE_KEY);
            localStorage.setItem(PRICING_VERSION_KEY, CURRENT_VERSION);
            savePricingData(defaultPricingData);
            return defaultPricingData;
        }
        
        const stored = localStorage.getItem(PRICING_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading pricing data:', e);
    }
    
    // Save defaults if nothing stored
    savePricingData(defaultPricingData);
    return defaultPricingData;
}

// Save pricing data to localStorage
function savePricingData(data) {
    try {
        localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(PRICING_VERSION_KEY, CURRENT_VERSION);
    } catch (e) {
        console.error('Error saving pricing data:', e);
    }
}
