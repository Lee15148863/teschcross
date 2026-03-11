// Pricing database - stored in localStorage
const PRICING_STORAGE_KEY = 'techcross_pricing_data';
const PRICING_VERSION_KEY = 'techcross_pricing_version';
const CURRENT_VERSION = '2.1'; // Updated version with Samsung, Xiaomi, and other brands

// Service types with descriptions
const serviceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_high_quality: { name: 'Screen (High Quality/Premium)', description: 'Premium quality screen replacement' },
    screen_original: { name: 'Original Screen', description: 'Original manufacturer screen (Samsung Services Pack)' },
    battery: { name: 'Battery (High Quality/Premium)', description: 'Premium quality battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration' },
    network_unlock: { name: 'Network Unlocking', description: 'Network unlock service' },
    frp_reset: { name: 'FRP Google Account Reset', description: 'Google account reset service' },
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

// Helper function to create default services (all 0 except network_unlock = 9999)
function createDefaultServices() {
    return {
        screen_compatible: 0, screen_high_quality: 0, screen_original: 0,
        battery: 0, charging_port: 0, software: 0, network_unlock: 9999,
        frp_reset: 0, back_glass: 0, motherboard: 0,
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
            'iphone-7': { name: 'iPhone 7 (A1778)', services: { screen_compatible: 45, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, network_unlock: 9999, frp_reset: 120, back_glass: 45, motherboard: 145, rear_camera: 40, front_camera: 30, camera_lens: 50, microphone: 45, earpiece: 50, loudspeaker: 45, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-7-plus': { name: 'iPhone 7 Plus (A1784)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, network_unlock: 9999, frp_reset: 120, back_glass: 45, motherboard: 145, rear_camera: 40, front_camera: 30, camera_lens: 50, microphone: 45, earpiece: 50, loudspeaker: 45, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-8': { name: 'iPhone 8 (A1905)', services: { screen_compatible: 45, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, network_unlock: 9999, frp_reset: 120, back_glass: 45, motherboard: 145, rear_camera: 40, front_camera: 30, camera_lens: 50, microphone: 45, earpiece: 50, loudspeaker: 45, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-8-plus': { name: 'iPhone 8 Plus (A1897)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 40, charging_port: 50, software: 20, network_unlock: 9999, frp_reset: 120, back_glass: 45, motherboard: 145, rear_camera: 40, front_camera: 30, camera_lens: 50, microphone: 45, earpiece: 50, loudspeaker: 45, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-x': { name: 'iPhone X (A1901)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, network_unlock: 9999, frp_reset: 120, back_glass: 60, motherboard: 145, rear_camera: 50, front_camera: 30, camera_lens: 55, microphone: 55, earpiece: 55, loudspeaker: 55, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-xr': { name: 'iPhone XR (A2105)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, network_unlock: 9999, frp_reset: 120, back_glass: 60, motherboard: 145, rear_camera: 50, front_camera: 30, camera_lens: 55, microphone: 55, earpiece: 55, loudspeaker: 55, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-xs': { name: 'iPhone XS (A2097)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 55, software: 20, network_unlock: 9999, frp_reset: 120, back_glass: 60, motherboard: 145, rear_camera: 50, front_camera: 30, camera_lens: 55, microphone: 55, earpiece: 55, loudspeaker: 55, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-xs-max': { name: 'iPhone XS Max (A2101)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 60, software: 20, network_unlock: 9999, frp_reset: 120, back_glass: 60, motherboard: 145, rear_camera: 50, front_camera: 30, camera_lens: 60, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-11': { name: 'iPhone 11 (A2221)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 60, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 65, front_camera: 50, camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-11-pro': { name: 'iPhone 11 Pro (A2215)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 85, front_camera: 60, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-11-pro-max': { name: 'iPhone 11 Pro Max (A2220)', services: { screen_compatible: 75, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 85, front_camera: 60, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-se-2': { name: 'iPhone SE (2nd generation) (A2296)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 45, charging_port: 50, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 55, front_camera: 40, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
            'iphone-12-mini': { name: 'iPhone 12 mini (A2399)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12': { name: 'iPhone 12 (A2403)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12-pro': { name: 'iPhone 12 Pro (A2407)', services: { screen_compatible: 60, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 110, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-12-pro-max': { name: 'iPhone 12 Pro Max (A2411)', services: { screen_compatible: 75, screen_high_quality: 0, screen_original: 0, battery: 60, charging_port: 65, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 110, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13-mini': { name: 'iPhone 13 mini (A2628)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13': { name: 'iPhone 13 (A2633)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 65, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 70, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13-pro': { name: 'iPhone 13 Pro (A2638)', services: { screen_compatible: 70, screen_high_quality: 150, screen_original: 0, battery: 60, charging_port: 65, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 105, front_camera: 65, camera_lens: 30, microphone: 65, earpiece: 65, loudspeaker: 65, power_button: 65 }, lastUpdated: new Date().toISOString() },
            'iphone-13-pro-max': { name: 'iPhone 13 Pro Max (A2643)', services: { screen_compatible: 80, screen_high_quality: 155, screen_original: 0, battery: 60, charging_port: 70, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 105, front_camera: 65, camera_lens: 30, microphone: 70, earpiece: 70, loudspeaker: 70, power_button: 70 }, lastUpdated: new Date().toISOString() },
            'iphone-se-3': { name: 'iPhone SE (3rd generation) (A2783)', services: { screen_compatible: 50, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 60, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 55, front_camera: 40, camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 60 }, lastUpdated: new Date().toISOString() },
            'iphone-14': { name: 'iPhone 14 (A2882)', services: { screen_compatible: 65, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 75, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 70, front_camera: 70, camera_lens: 30, microphone: 75, earpiece: 75, loudspeaker: 75, power_button: 75 }, lastUpdated: new Date().toISOString() },
            'iphone-14-plus': { name: 'iPhone 14 Plus (A2886)', services: { screen_compatible: 70, screen_high_quality: 0, screen_original: 0, battery: 50, charging_port: 80, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 145, motherboard: 145, rear_camera: 80, front_camera: 70, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-14-pro': { name: 'iPhone 14 Pro (A2890)', services: { screen_compatible: 70, screen_high_quality: 195, screen_original: 0, battery: 60, charging_port: 80, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 110, front_camera: 80, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-14-pro-max': { name: 'iPhone 14 Pro Max (A2894)', services: { screen_compatible: 85, screen_high_quality: 220, screen_original: 0, battery: 60, charging_port: 80, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 110, front_camera: 80, camera_lens: 30, microphone: 80, earpiece: 80, loudspeaker: 80, power_button: 80 }, lastUpdated: new Date().toISOString() },
            'iphone-15': { name: 'iPhone 15 (A3090)', services: { screen_compatible: 85, screen_high_quality: 170, screen_original: 295, battery: 55, charging_port: 75, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 90, front_camera: 80, camera_lens: 30, microphone: 75, earpiece: 75, loudspeaker: 75, power_button: 75 }, lastUpdated: new Date().toISOString() },
            'iphone-15-plus': { name: 'iPhone 15 Plus (A3094)', services: { screen_compatible: 85, screen_high_quality: 190, screen_original: 0, battery: 55, charging_port: 85, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 90, front_camera: 80, camera_lens: 30, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-15-pro': { name: 'iPhone 15 Pro (A3102)', services: { screen_compatible: 100, screen_high_quality: 190, screen_original: 0, battery: 60, charging_port: 85, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 105, front_camera: 85, camera_lens: 30, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-15-pro-max': { name: 'iPhone 15 Pro Max (A3106)', services: { screen_compatible: 105, screen_high_quality: 240, screen_original: 370, battery: 60, charging_port: 95, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 110, front_camera: 85, camera_lens: 30, microphone: 95, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-16': { name: 'iPhone 16 (A3287)', services: { screen_compatible: 95, screen_high_quality: 180, screen_original: 0, battery: 65, charging_port: 85, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-16-plus': { name: 'iPhone 16 Plus (A3290)', services: { screen_compatible: 100, screen_high_quality: 195, screen_original: 0, battery: 65, charging_port: 85, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-16-pro': { name: 'iPhone 16 Pro (A3293)', services: { screen_compatible: 135, screen_high_quality: 195, screen_original: 0, battery: 70, charging_port: 100, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 100, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-16-pro-max': { name: 'iPhone 16 Pro Max (A3296)', services: { screen_compatible: 145, screen_high_quality: 255, screen_original: 470, battery: 70, charging_port: 100, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 110, front_camera: 90, camera_lens: 35, microphone: 100, earpiece: 95, loudspeaker: 95, power_button: 95 }, lastUpdated: new Date().toISOString() },
            'iphone-16e': { name: 'iPhone 16e (A3409)', services: { screen_compatible: 90, screen_high_quality: 135, screen_original: 0, battery: 65, charging_port: 85, software: 20, network_unlock: 9999, frp_reset: 80, back_glass: 180, motherboard: 180, rear_camera: 135, front_camera: 90, camera_lens: 35, microphone: 85, earpiece: 85, loudspeaker: 85, power_button: 85 }, lastUpdated: new Date().toISOString() },
            'iphone-17': { name: 'iPhone 17 (A3513 Series)', services: { screen_compatible: 9999, screen_high_quality: 250, screen_original: 0, battery: 0, charging_port: 105, software: 20, network_unlock: 9999, frp_reset: 100, back_glass: 180, motherboard: 180, rear_camera: 135, front_camera: 95, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17-air': { name: 'iPhone 17 Air (A3517 Series)', services: { screen_compatible: 9999, screen_high_quality: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, network_unlock: 9999, frp_reset: 100, back_glass: 180, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17-pro': { name: 'iPhone 17 Pro (A3521 Series)', services: { screen_compatible: 9999, screen_high_quality: 275, screen_original: 0, battery: 0, charging_port: 0, software: 20, network_unlock: 9999, frp_reset: 100, back_glass: 180, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() },
            'iphone-17-pro-max': { name: 'iPhone 17 Pro Max (A3526)', services: { screen_compatible: 9999, screen_high_quality: 0, screen_original: 0, battery: 0, charging_port: 0, software: 20, network_unlock: 9999, frp_reset: 100, back_glass: 180, motherboard: 180, rear_camera: 0, front_camera: 0, camera_lens: 40, microphone: 0, earpiece: 0, loudspeaker: 0, power_button: 0 }, lastUpdated: new Date().toISOString() }
        }
    },
    samsung: {
        name: 'Samsung',
        models: {
            'galaxy-s7': createModel('Samsung Galaxy S7'),
            'galaxy-s7-edge': createModel('Samsung Galaxy S7 Edge'),
            'galaxy-s8': createModel('Samsung Galaxy S8'),
            'galaxy-s8-plus': createModel('Samsung Galaxy S8+'),
            'galaxy-s9': createModel('Samsung Galaxy S9'),
            'galaxy-s9-plus': createModel('Samsung Galaxy S9+'),
            'galaxy-s10e': createModel('Samsung Galaxy S10e'),
            'galaxy-s10': createModel('Samsung Galaxy S10'),
            'galaxy-s10-plus': createModel('Samsung Galaxy S10+'),
            'galaxy-s10-5g': createModel('Samsung Galaxy S10 5G'),
            'galaxy-s10-lite': createModel('Samsung Galaxy S10 Lite'),
            'galaxy-s20': createModel('Samsung Galaxy S20'),
            'galaxy-s20-plus': createModel('Samsung Galaxy S20+'),
            'galaxy-s20-ultra': createModel('Samsung Galaxy S20 Ultra'),
            'galaxy-s20-fe': createModel('Samsung Galaxy S20 FE'),
            'galaxy-s21': createModel('Samsung Galaxy S21'),
            'galaxy-s21-plus': createModel('Samsung Galaxy S21+'),
            'galaxy-s21-ultra': createModel('Samsung Galaxy S21 Ultra'),
            'galaxy-s21-fe': createModel('Samsung Galaxy S21 FE'),
            'galaxy-s22': createModel('Samsung Galaxy S22'),
            'galaxy-s22-plus': createModel('Samsung Galaxy S22+'),
            'galaxy-s22-ultra': createModel('Samsung Galaxy S22 Ultra'),
            'galaxy-s23': createModel('Samsung Galaxy S23'),
            'galaxy-s23-plus': createModel('Samsung Galaxy S23+'),
            'galaxy-s23-ultra': createModel('Samsung Galaxy S23 Ultra'),
            'galaxy-s23-fe': createModel('Samsung Galaxy S23 FE'),
            'galaxy-s24': createModel('Samsung Galaxy S24'),
            'galaxy-s24-plus': createModel('Samsung Galaxy S24+'),
            'galaxy-s24-ultra': createModel('Samsung Galaxy S24 Ultra'),
            'galaxy-s24-fe': createModel('Samsung Galaxy S24 FE'),
            'galaxy-s25': createModel('Samsung Galaxy S25'),
            'galaxy-s25-plus': createModel('Samsung Galaxy S25+'),
            'galaxy-s25-ultra': createModel('Samsung Galaxy S25 Ultra'),
            'galaxy-s26': createModel('Samsung Galaxy S26'),
            'galaxy-s26-plus': createModel('Samsung Galaxy S26+'),
            'galaxy-s26-ultra': createModel('Samsung Galaxy S26 Ultra'),
            'galaxy-note7-fe': createModel('Samsung Galaxy Note7 / FE'),
            'galaxy-note8': createModel('Samsung Galaxy Note8'),
            'galaxy-note9': createModel('Samsung Galaxy Note9'),
            'galaxy-note10': createModel('Samsung Galaxy Note10'),
            'galaxy-note10-plus': createModel('Samsung Galaxy Note10+'),
            'galaxy-note10-lite': createModel('Samsung Galaxy Note10 Lite'),
            'galaxy-note20': createModel('Samsung Galaxy Note20'),
            'galaxy-note20-ultra': createModel('Samsung Galaxy Note20 Ultra'),
            'galaxy-fold': createModel('Samsung Galaxy Fold'),
            'galaxy-z-flip': createModel('Samsung Galaxy Z Flip'),
            'galaxy-z-fold2': createModel('Samsung Galaxy Z Fold2'),
            'galaxy-z-flip3': createModel('Samsung Galaxy Z Flip3'),
            'galaxy-z-fold3': createModel('Samsung Galaxy Z Fold3'),
            'galaxy-z-flip4': createModel('Samsung Galaxy Z Flip4'),
            'galaxy-z-fold4': createModel('Samsung Galaxy Z Fold4'),
            'galaxy-z-flip5': createModel('Samsung Galaxy Z Flip5'),
            'galaxy-z-fold5': createModel('Samsung Galaxy Z Fold5'),
            'galaxy-z-flip6': createModel('Samsung Galaxy Z Flip6'),
            'galaxy-z-fold6': createModel('Samsung Galaxy Z Fold6'),
            'galaxy-z-flip7': createModel('Samsung Galaxy Z Flip7'),
            'galaxy-z-fold7': createModel('Samsung Galaxy Z Fold7'),
            'galaxy-a3-a5-a7-2017': createModel('Samsung Galaxy A3 / A5 / A7 (2017)'),
            'galaxy-a6-a8-a9-2018': createModel('Samsung Galaxy A6 / A8 / A9 (2018)'),
            'galaxy-a10': createModel('Samsung Galaxy A10'),
            'galaxy-a20-a20e': createModel('Samsung Galaxy A20 / A20e'),
            'galaxy-a40': createModel('Samsung Galaxy A40'),
            'galaxy-a50': createModel('Samsung Galaxy A50'),
            'galaxy-a70': createModel('Samsung Galaxy A70'),
            'galaxy-a80': createModel('Samsung Galaxy A80'),
            'galaxy-a12': createModel('Samsung Galaxy A12'),
            'galaxy-a22': createModel('Samsung Galaxy A22'),
            'galaxy-a32': createModel('Samsung Galaxy A32'),
            'galaxy-a42-5g': createModel('Samsung Galaxy A42 5G'),
            'galaxy-a52-a52s': createModel('Samsung Galaxy A52 / A52s'),
            'galaxy-a72': createModel('Samsung Galaxy A72'),
            'galaxy-a13': createModel('Samsung Galaxy A13'),
            'galaxy-a33-5g': createModel('Samsung Galaxy A33 5G'),
            'galaxy-a53-5g': createModel('Samsung Galaxy A53 5G'),
            'galaxy-a73-5g': createModel('Samsung Galaxy A73 5G'),
            'galaxy-a14': createModel('Samsung Galaxy A14'),
            'galaxy-a34-5g': createModel('Samsung Galaxy A34 5G'),
            'galaxy-a54-5g': createModel('Samsung Galaxy A54 5G'),
            'galaxy-a15': createModel('Samsung Galaxy A15'),
            'galaxy-a25-5g': createModel('Samsung Galaxy A25 5G'),
            'galaxy-a35-5g': createModel('Samsung Galaxy A35 5G'),
            'galaxy-a55-5g': createModel('Samsung Galaxy A55 5G'),
            'galaxy-a16-a16-5g': createModel('Samsung Galaxy A16 / A16 5G'),
            'galaxy-a36-5g': createModel('Samsung Galaxy A36 5G'),
            'galaxy-a56-5g': createModel('Samsung Galaxy A56 5G'),
            'galaxy-tab-a-10-1-2019': createModel('Samsung Galaxy Tab A 10.1 (2019)'),
            'galaxy-tab-a-8-0-2019': createModel('Samsung Galaxy Tab A 8.0 (2019)'),
            'galaxy-tab-a-8-0-s-pen-2019': createModel('Samsung Galaxy Tab A 8.0 with S Pen (2019)'),
            'galaxy-tab-s6': createModel('Samsung Galaxy Tab S6'),
            'galaxy-tab-active-pro': createModel('Samsung Galaxy Tab Active Pro'),
            'galaxy-tab-s6-lite': createModel('Samsung Galaxy Tab S6 Lite'),
            'galaxy-tab-s7': createModel('Samsung Galaxy Tab S7'),
            'galaxy-tab-s7-plus': createModel('Samsung Galaxy Tab S7+'),
            'galaxy-tab-a7-10-4-2020': createModel('Samsung Galaxy Tab A7 10.4 (2020)'),
            'galaxy-tab-active3': createModel('Samsung Galaxy Tab Active3'),
            'galaxy-tab-s7-fe': createModel('Samsung Galaxy Tab S7 FE'),
            'galaxy-tab-a7-lite': createModel('Samsung Galaxy Tab A7 Lite'),
            'galaxy-tab-a8-10-5-2021': createModel('Samsung Galaxy Tab A8 10.5 (2021)'),
            'galaxy-tab-s8': createModel('Samsung Galaxy Tab S8'),
            'galaxy-tab-s8-plus': createModel('Samsung Galaxy Tab S8+'),
            'galaxy-tab-s8-ultra': createModel('Samsung Galaxy Tab S8 Ultra'),
            'galaxy-tab-s6-lite-2022': createModel('Samsung Galaxy Tab S6 Lite (2022)'),
            'galaxy-tab-active4-pro': createModel('Samsung Galaxy Tab Active4 Pro'),
            'galaxy-tab-s9': createModel('Samsung Galaxy Tab S9'),
            'galaxy-tab-s9-plus': createModel('Samsung Galaxy Tab S9+'),
            'galaxy-tab-s9-ultra': createModel('Samsung Galaxy Tab S9 Ultra'),
            'galaxy-tab-s9-fe': createModel('Samsung Galaxy Tab S9 FE'),
            'galaxy-tab-s9-fe-plus': createModel('Samsung Galaxy Tab S9 FE+'),
            'galaxy-tab-a9': createModel('Samsung Galaxy Tab A9'),
            'galaxy-tab-a9-plus': createModel('Samsung Galaxy Tab A9+'),
            'galaxy-tab-s6-lite-2024': createModel('Samsung Galaxy Tab S6 Lite (2024)'),
            'galaxy-tab-active5': createModel('Samsung Galaxy Tab Active5'),
            'galaxy-tab-s10-plus': createModel('Samsung Galaxy Tab S10+'),
            'galaxy-tab-s10-ultra': createModel('Samsung Galaxy Tab S10 Ultra'),
            'galaxy-tab-a10': createModel('Samsung Galaxy Tab A10'),
            'galaxy-tab-a10-plus': createModel('Samsung Galaxy Tab A10+')
        }
    },
    xiaomi: {
        name: 'Xiaomi',
        models: {
            'mi-11': createModel('Xiaomi Mi 11'),
            'mi-11-lite-5g': createModel('Xiaomi Mi 11 Lite / 11 Lite 5G'),
            'mi-11-ultra': createModel('Xiaomi Mi 11 Ultra'),
            'xiaomi-11t': createModel('Xiaomi 11T'),
            'xiaomi-11t-pro': createModel('Xiaomi 11T Pro'),
            'xiaomi-12': createModel('Xiaomi 12'),
            'xiaomi-12-pro': createModel('Xiaomi 12 Pro'),
            'xiaomi-12-lite': createModel('Xiaomi 12 Lite'),
            'xiaomi-12t': createModel('Xiaomi 12T'),
            'xiaomi-12t-pro': createModel('Xiaomi 12T Pro'),
            'xiaomi-13': createModel('Xiaomi 13'),
            'xiaomi-13-pro': createModel('Xiaomi 13 Pro'),
            'xiaomi-13-ultra': createModel('Xiaomi 13 Ultra'),
            'xiaomi-13t': createModel('Xiaomi 13T'),
            'xiaomi-13t-pro': createModel('Xiaomi 13T Pro'),
            'xiaomi-14': createModel('Xiaomi 14'),
            'xiaomi-14-ultra': createModel('Xiaomi 14 Ultra'),
            'xiaomi-14t': createModel('Xiaomi 14T'),
            'xiaomi-14t-pro': createModel('Xiaomi 14T Pro'),
            'xiaomi-15': createModel('Xiaomi 15'),
            'xiaomi-15-ultra': createModel('Xiaomi 15 Ultra'),
            'xiaomi-16': createModel('Xiaomi 16'),
            'xiaomi-16-ultra': createModel('Xiaomi 16 Ultra'),
            'redmi-note-10-5g': createModel('Xiaomi Redmi Note 10 5G'),
            'redmi-note-10-pro': createModel('Xiaomi Redmi Note 10 Pro'),
            'redmi-note-11': createModel('Xiaomi Redmi Note 11'),
            'redmi-note-11-pro-5g': createModel('Xiaomi Redmi Note 11 Pro 5G'),
            'redmi-note-12-5g': createModel('Xiaomi Redmi Note 12 5G'),
            'redmi-note-12-pro-5g': createModel('Xiaomi Redmi Note 12 Pro 5G'),
            'redmi-note-12-pro-plus-5g': createModel('Xiaomi Redmi Note 12 Pro+ 5G'),
            'redmi-note-13-4g-5g': createModel('Xiaomi Redmi Note 13 4G / 5G'),
            'redmi-note-13-pro-5g': createModel('Xiaomi Redmi Note 13 Pro 5G'),
            'redmi-note-13-pro-plus-5g': createModel('Xiaomi Redmi Note 13 Pro+ 5G'),
            'redmi-note-14': createModel('Xiaomi Redmi Note 14'),
            'redmi-note-14-pro': createModel('Xiaomi Redmi Note 14 Pro'),
            'redmi-note-14-pro-plus': createModel('Xiaomi Redmi Note 14 Pro+'),
            'redmi-note-15': createModel('Xiaomi Redmi Note 15'),
            'redmi-note-15-pro': createModel('Xiaomi Redmi Note 15 Pro'),
            'redmi-10-2022': createModel('Xiaomi Redmi 10 / 10 2022'),
            'redmi-10c': createModel('Xiaomi Redmi 10C'),
            'redmi-12': createModel('Xiaomi Redmi 12'),
            'redmi-13c': createModel('Xiaomi Redmi 13C'),
            'redmi-14c': createModel('Xiaomi Redmi 14C'),
            'poco-f3': createModel('Xiaomi POCO F3'),
            'poco-x3-pro': createModel('Xiaomi POCO X3 Pro'),
            'poco-f4': createModel('Xiaomi POCO F4'),
            'poco-x4-pro-5g': createModel('Xiaomi POCO X4 Pro 5G'),
            'poco-f5': createModel('Xiaomi POCO F5'),
            'poco-x5-pro-5g': createModel('Xiaomi POCO X5 Pro 5G'),
            'poco-f6': createModel('Xiaomi POCO F6'),
            'poco-x6-pro-5g': createModel('Xiaomi POCO X6 Pro 5G'),
            'poco-f7': createModel('Xiaomi POCO F7'),
            'poco-x7-pro-5g': createModel('Xiaomi POCO X7 Pro 5G')
        }
    },
    other: {
        name: 'Other Brands',
        models: {
            'huawei-p20': createModel('Huawei P20'),
            'huawei-p20-pro': createModel('Huawei P20 Pro'),
            'huawei-p30': createModel('Huawei P30'),
            'huawei-p30-pro': createModel('Huawei P30 Pro'),
            'honor-50': createModel('Honor 50'),
            'honor-50-lite': createModel('Honor 50 Lite'),
            'honor-magic4-lite': createModel('Honor Magic4 Lite'),
            'honor-magic4-pro': createModel('Honor Magic4 Pro'),
            'honor-70': createModel('Honor 70'),
            'honor-magic5-lite': createModel('Honor Magic5 Lite'),
            'honor-magic5-pro': createModel('Honor Magic5 Pro'),
            'honor-90-lite': createModel('Honor 90 Lite'),
            'honor-90': createModel('Honor 90'),
            'honor-magic-v2': createModel('Honor Magic V2'),
            'honor-magic6-lite': createModel('Honor Magic6 Lite'),
            'honor-magic6-pro': createModel('Honor Magic6 Pro'),
            'honor-200-lite': createModel('Honor 200 Lite'),
            'honor-200': createModel('Honor 200'),
            'honor-200-pro': createModel('Honor 200 Pro'),
            'honor-magic-v3': createModel('Honor Magic V3'),
            'honor-magic7-lite': createModel('Honor Magic7 Lite'),
            'honor-magic7-pro': createModel('Honor Magic7 Pro'),
            'honor-300': createModel('Honor 300'),
            'honor-300-pro': createModel('Honor 300 Pro'),
            'pixel-6': createModel('Google Pixel 6'),
            'pixel-6-pro': createModel('Google Pixel 6 Pro'),
            'pixel-6a': createModel('Google Pixel 6a'),
            'pixel-7': createModel('Google Pixel 7'),
            'pixel-7-pro': createModel('Google Pixel 7 Pro'),
            'pixel-7a': createModel('Google Pixel 7a'),
            'pixel-fold': createModel('Google Pixel Fold'),
            'pixel-8': createModel('Google Pixel 8'),
            'pixel-8-pro': createModel('Google Pixel 8 Pro'),
            'pixel-8a': createModel('Google Pixel 8a'),
            'pixel-9': createModel('Google Pixel 9'),
            'pixel-9-pro': createModel('Google Pixel 9 Pro'),
            'pixel-9-pro-xl': createModel('Google Pixel 9 Pro XL'),
            'pixel-9-pro-fold': createModel('Google Pixel 9 Pro Fold'),
            'pixel-9a': createModel('Google Pixel 9a'),
            'pixel-10': createModel('Google Pixel 10'),
            'pixel-10-pro': createModel('Google Pixel 10 Pro'),
            'oneplus-9': createModel('OnePlus 9'),
            'oneplus-9-pro': createModel('OnePlus 9 Pro'),
            'oneplus-nord-2-5g': createModel('OnePlus Nord 2 5G'),
            'oneplus-nord-ce-2-5g': createModel('OnePlus Nord CE 2 5G'),
            'oneplus-10-pro-5g': createModel('OnePlus 10 Pro 5G'),
            'oneplus-10t-5g': createModel('OnePlus 10T 5G'),
            'oneplus-nord-2t-5g': createModel('OnePlus Nord 2T 5G'),
            'oneplus-11-5g': createModel('OnePlus 11 5G'),
            'oneplus-nord-3-5g': createModel('OnePlus Nord 3 5G'),
            'oneplus-nord-ce-3-lite': createModel('OnePlus Nord CE 3 Lite'),
            'oneplus-open': createModel('OnePlus Open'),
            'oneplus-12': createModel('OnePlus 12'),
            'oneplus-12r': createModel('OnePlus 12R'),
            'oneplus-nord-4': createModel('OnePlus Nord 4'),
            'oneplus-nord-ce-4-lite': createModel('OnePlus Nord CE 4 Lite'),
            'oneplus-13': createModel('OnePlus 13'),
            'oneplus-13r': createModel('OnePlus 13R'),
            'oneplus-nord-5': createModel('OnePlus Nord 5'),
            'oppo-find-x3-pro': createModel('OPPO Find X3 Pro'),
            'oppo-find-x3-neo': createModel('OPPO Find X3 Neo'),
            'oppo-find-x3-lite': createModel('OPPO Find X3 Lite'),
            'oppo-reno6-pro-5g': createModel('OPPO Reno6 Pro 5G'),
            'oppo-find-x5-pro': createModel('OPPO Find X5 Pro'),
            'oppo-find-x5': createModel('OPPO Find X5'),
            'oppo-reno8-pro-5g': createModel('OPPO Reno8 Pro 5G'),
            'oppo-reno8-5g': createModel('OPPO Reno8 5G'),
            'oppo-find-n2-flip': createModel('OPPO Find N2 Flip'),
            'oppo-reno10-pro-5g': createModel('OPPO Reno10 Pro 5G'),
            'oppo-reno10-5g': createModel('OPPO Reno10 5G'),
            'oppo-a78-5g': createModel('OPPO A78 5G'),
            'oppo-a98-5g': createModel('OPPO A98 5G'),
            'oppo-reno11-f-5g': createModel('OPPO Reno11 F 5G'),
            'oppo-reno12-pro-5g': createModel('OPPO Reno12 Pro 5G'),
            'oppo-reno12-5g': createModel('OPPO Reno12 5G'),
            'oppo-a79-5g': createModel('OPPO A79 5G'),
            'oppo-a60': createModel('OPPO A60'),
            'oppo-find-n3-flip': createModel('OPPO Find N3 Flip'),
            'oppo-reno13-pro-5g': createModel('OPPO Reno13 Pro 5G'),
            'oppo-reno14-series': createModel('OPPO Reno14 Series'),
            'moto-g14-g24-g34': createModel('Motorola Moto G14 / G24 / G34'),
            'moto-g54-g84': createModel('Motorola Moto G54 / G84'),
            'moto-edge-40-50-pro': createModel('Motorola Edge 40 / 50 Pro'),
            'moto-razr-40-50-ultra': createModel('Motorola Razr 40 / 50 Ultra'),
            'nokia-g22-g42-5g': createModel('Nokia G22 / G42 5G'),
            'nokia-c21-c32': createModel('Nokia C21 / C32'),
            'hmd-pulse-pulse-pro': createModel('HMD Pulse / Pulse Pro'),
            'hmd-skyline': createModel('HMD Skyline'),
            'realme-c53-c67': createModel('Realme C53 / C67'),
            'realme-11-12-pro': createModel('Realme 11 / 12 Pro'),
            'realme-13-14-pro': createModel('Realme 13 Pro / 14')
        }
    }
};

// Load pricing data from localStorage or use default
function loadPricingData() {
    const stored = localStorage.getItem(PRICING_STORAGE_KEY);
    const storedVersion = localStorage.getItem(PRICING_VERSION_KEY);
    
    // Check if version matches, if not, clear old data
    if (storedVersion !== CURRENT_VERSION) {
        console.log('Version mismatch, clearing old data. Old:', storedVersion, 'New:', CURRENT_VERSION);
        localStorage.removeItem(PRICING_STORAGE_KEY);
        localStorage.setItem(PRICING_VERSION_KEY, CURRENT_VERSION);
        savePricingData(defaultPricingData);
        return defaultPricingData;
    }
    
    if (stored) {
        try {
            const data = JSON.parse(stored);
            console.log('Loaded pricing data from localStorage');
            return data;
        } catch (e) {
            console.error('Error loading pricing data:', e);
            return defaultPricingData;
        }
    }
    return defaultPricingData;
}

// Save pricing data to localStorage
function savePricingData(data) {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(PRICING_VERSION_KEY, CURRENT_VERSION);
}

// Initialize with default data if not exists
if (!localStorage.getItem(PRICING_STORAGE_KEY)) {
    savePricingData(defaultPricingData);
}
