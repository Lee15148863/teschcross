// Samsung Pricing Database - Independent
const SAMSUNG_STORAGE_KEY = 'techcross_pricing_samsung';
const SAMSUNG_VERSION_KEY = 'techcross_pricing_samsung_version';
const SAMSUNG_CURRENT_VERSION = '3.7';

// Samsung Phone Service Types
const samsungPhoneServiceTypes = {
    screen: { name: 'Screen Repair', description: 'Screen replacement options' },
    battery: { name: 'Battery (High Quality/Premium)', description: 'Premium quality battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration (Forgot password but know Google Account)' },
    network_unlock: { name: 'Network Unlocking', description: 'Network unlock service' },
    frp_reset: { name: 'FRP Google Account Reset', description: 'Google account reset' },
    motherboard: { name: 'Motherboard/Liquid Damage/Audio/Touch IC Repair', description: 'Motherboard and IC repairs' },
    camera: { name: 'Front/Rear Camera Replacement', description: 'Front and rear camera replacement' },
    camera_lens: { name: 'Camera Lens/Back Cover Replacement', description: 'Camera lens and back cover replacement' },
    microphone: { name: 'Microphone Repair', description: 'Microphone repair/replacement' },
    earpiece: { name: 'Earpiece Speaker Repair', description: 'Earpiece speaker repair' },
    loudspeaker: { name: 'Loudspeaker Replacement', description: 'Loudspeaker replacement' },
    power_button: { name: 'Power Button Repair', description: 'Power button repair' }
};

// Samsung Tablet Service Types
const samsungTabletServiceTypes = {
    screen_compatible: { name: 'Screen (Compatible)', description: 'Compatible quality screen replacement' },
    screen_original: { name: 'Original Screen (Samsung Services Pack)', description: 'Original Samsung screen' },
    battery: { name: 'Battery Replacement', description: 'Battery replacement' },
    charging_port: { name: 'Charging Port', description: 'Charging port repair/replacement' },
    software: { name: 'Software Flash/Restore', description: 'Software repair and restoration (Forgot password but know Google Account)' },
    motherboard: { name: 'Motherboard/Liquid Damage Repair', description: 'Motherboard repairs' },
    camera: { name: 'Camera Replacement', description: 'Camera replacement' },
    speaker: { name: 'Speaker Repair', description: 'Speaker repair/replacement' },
    power_button: { name: 'Power Button Repair', description: 'Power button repair' },
    home_button: { name: 'Home Button Repair', description: 'Home button repair' }
};

// Helper functions
function createDefaultSamsungPhoneServices() {
    return {
        screen: { compatible: 0, original: 0 },
        battery: 0, charging_port: 0, software: 0,
        network_unlock: 0, frp_reset: 0, motherboard: 0,
        camera: 0, camera_lens: 0,
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

// Default Samsung pricing data - Part 1: S Series (S8-S21)
// Fields: screen{compatible,original}, battery, charging_port, software, network_unlock, frp_reset, motherboard, camera, camera_lens, microphone, earpiece, loudspeaker, power_button
// Values: number=price, 0=ask/contact us, -1=not available (hidden)
const samsungPhoneModels_Part1 = {
    's8':       { name: 'Galaxy S8 (SM-G950)',          services: { screen: { compatible: -1, original: 130 }, battery: 50, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's8-plus':  { name: 'Galaxy S8+ (SM-G955)',         services: { screen: { compatible: -1, original: 150 }, battery: 50, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's9':       { name: 'Galaxy S9 (SM-G960)',          services: { screen: { compatible: -1, original: 130 }, battery: 50, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's9-plus':  { name: 'Galaxy S9+ (SM-G965)',         services: { screen: { compatible: -1, original: 155 }, battery: 50, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's10e':     { name: 'Galaxy S10e (SM-G970)',        services: { screen: { compatible: -1, original: 165 }, battery: 50, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's10':      { name: 'Galaxy S10 (SM-G973)',         services: { screen: { compatible: -1, original: 200 }, battery: 50, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's10-plus': { name: 'Galaxy S10+ (SM-G975)',        services: { screen: { compatible: -1, original: 220 }, battery: 50, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's10-5g':   { name: 'Galaxy S10 5G (SM-G977)',      services: { screen: { compatible: -1, original: 210 }, battery: 50, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's20':      { name: 'Galaxy S20 (SM-G980/SM-G981)', services: { screen: { compatible: -1, original: 200 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's20-plus': { name: 'Galaxy S20+ (SM-G985/SM-G986)',services: { screen: { compatible: -1, original: 220 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's20-ultra':{ name: 'Galaxy S20 Ultra (SM-G988)',   services: { screen: { compatible: -1, original: 240 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's20-fe':   { name: 'Galaxy S20 FE (SM-G780/SM-G781)',services:{ screen: { compatible: -1, original: 145 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's21':      { name: 'Galaxy S21 (SM-G991)',         services: { screen: { compatible: 175, original: 200 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's21-plus': { name: 'Galaxy S21+ (SM-G996)',        services: { screen: { compatible: -1, original: 240 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's21-ultra':{ name: 'Galaxy S21 Ultra (SM-G998)',   services: { screen: { compatible: -1, original: 270 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() }
};

// Part 2: S Series (S21 FE - S26)
const samsungPhoneModels_Part2 = {
    's21-fe':   { name: 'Galaxy S21 FE (SM-G990)',          services: { screen: { compatible: -1, original: 160 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's22':      { name: 'Galaxy S22 (SM-S901)',              services: { screen: { compatible: -1, original: 210 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's22-plus': { name: 'Galaxy S22+ (SM-S906)',             services: { screen: { compatible: -1, original: 240 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's22-ultra':{ name: 'Galaxy S22 Ultra (SM-S908)',        services: { screen: { compatible: 280, original: 305 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's23':      { name: 'Galaxy S23 (SM-S911)',              services: { screen: { compatible: 195, original: 210 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's23-plus': { name: 'Galaxy S23+ (SM-S916)',             services: { screen: { compatible: -1, original: 245 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 130, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's23-ultra':{ name: 'Galaxy S23 Ultra (SM-S918)',        services: { screen: { compatible: 270, original: 300 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 130, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's23-fe':   { name: 'Galaxy S23 FE (SM-S711)',           services: { screen: { compatible: 130, original: 165 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 130, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's24':      { name: 'Galaxy S24 (SM-S921)',              services: { screen: { compatible: 200, original: 230 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 130, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's24-plus': { name: 'Galaxy S24+ (SM-S926)',             services: { screen: { compatible: -1, original: 240 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 130, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's24-ultra':{ name: 'Galaxy S24 Ultra (SM-S928)',        services: { screen: { compatible: -1, original: 305 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 130, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's24-fe':   { name: 'Galaxy S24 FE (SM-S721)',           services: { screen: { compatible: 135, original: 180 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 130, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's25':      { name: 'Galaxy S25 (SM-S931)',              services: { screen: { compatible: 180, original: 0  }, battery: 65, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 145, camera: 0,  camera_lens: 40, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's25-plus': { name: 'Galaxy S25+ (SM-S936)',             services: { screen: { compatible: 210, original: 0  }, battery: 65, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 145, camera: 0,  camera_lens: 40, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's25-ultra':{ name: 'Galaxy S25 Ultra (SM-S938)',        services: { screen: { compatible: 290, original: 305 }, battery: 65, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 145, camera: 0,  camera_lens: 40, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's26':      { name: 'Galaxy S26 (SM-S941 Series)',       services: { screen: { compatible: -1, original: 0  }, battery: 65, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 145, camera: 0,  camera_lens: 40, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's26-plus': { name: 'Galaxy S26+ (SM-S946 Series)',      services: { screen: { compatible: -1, original: 0  }, battery: 65, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 145, camera: 0,  camera_lens: 40, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    's26-ultra':{ name: 'Galaxy S26 Ultra (SM-S948 Series)', services: { screen: { compatible: -1, original: 0  }, battery: 65, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 145, camera: 0,  camera_lens: 40, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() }
};

// Part 3: Note Series
const samsungPhoneModels_Part3 = {
    'note7':       { name: 'Galaxy Note7/FE (SM-N930/SM-N935)',   services: { screen: { compatible: -1, original: 0  }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    'note8':       { name: 'Galaxy Note8 (SM-N950)',               services: { screen: { compatible: -1, original: 0  }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    'note9':       { name: 'Galaxy Note9 (SM-N960)',               services: { screen: { compatible: -1, original: 0  }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    'note10':      { name: 'Galaxy Note10 (SM-N970/SM-N971)',      services: { screen: { compatible: -1, original: 230 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    'note10-plus': { name: 'Galaxy Note10+ (SM-N975/SM-N976)',     services: { screen: { compatible: -1, original: 250 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    'note10-lite': { name: 'Galaxy Note10 Lite (SM-N770)',         services: { screen: { compatible: -1, original: 230 }, battery: 60, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    'note20':      { name: 'Galaxy Note20 (SM-N980/SM-N981)',      services: { screen: { compatible: -1, original: 235 }, battery: 70, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0,  camera_lens: 40, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() },
    'note20-ultra':{ name: 'Galaxy Note20 Ultra (SM-N985/SM-N986)',services: { screen: { compatible: -1, original: 280 }, battery: 70, charging_port: 60, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 135, camera: 0,  camera_lens: 40, microphone: 60, earpiece: 60, loudspeaker: 60, power_button: 0  }, lastUpdated: new Date().toISOString() }
};

// Part 4: A Series (A10-A52s)
const samsungPhoneModels_Part4 = {
    'a10':        { name: 'Galaxy A10 (SM-A105)',              services: { screen: { compatible: 60, original: -1  }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a20':        { name: 'Galaxy A20/A20e (SM-A205/SM-A202)', services: { screen: { compatible: 60, original: 80  }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a40':        { name: 'Galaxy A40 (SM-A405)',              services: { screen: { compatible: -1, original: 110 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a50':        { name: 'Galaxy A50 (SM-A505)',              services: { screen: { compatible: -1, original: 110 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a70':        { name: 'Galaxy A70 (SM-A705)',              services: { screen: { compatible: -1, original: 135 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a12':        { name: 'Galaxy A12 (SM-A125/SM-A127)',      services: { screen: { compatible: 60, original: -1  }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a22-a32-4g': { name: 'Galaxy A22/A32 4G',                services: { screen: { compatible: 100, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a22-a32-5g': { name: 'Galaxy A22/A32 5G',                services: { screen: { compatible: 65,  original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a42-5g':     { name: 'Galaxy A42 5G (SM-A426)',           services: { screen: { compatible: 100, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a52':        { name: 'Galaxy A52/A52s (SM-A525/A526/A528)',services: { screen: { compatible: -1, original: 130 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a72':        { name: 'Galaxy A72 (SM-A725)',              services: { screen: { compatible: -1, original: 140 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0,  camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() }
};

// Part 5: A Series (A13-A56)
const samsungPhoneModels_Part5 = {
    'a13':    { name: 'Galaxy A13 (SM-A135/SM-A136)',      services: { screen: { compatible: 65,  original: -1  }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a33-5g': { name: 'Galaxy A33 5G (SM-A336)',           services: { screen: { compatible: -1,  original: 120 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a53-5g': { name: 'Galaxy A53 5G (SM-A536)',           services: { screen: { compatible: -1,  original: 130 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a73-5g': { name: 'Galaxy A73 5G (SM-A736)',           services: { screen: { compatible: -1,  original: 130 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a14':    { name: 'Galaxy A14 (SM-A145/SM-A146)',      services: { screen: { compatible: 60,  original: -1  }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a34-5g': { name: 'Galaxy A34 5G (SM-A346)',           services: { screen: { compatible: -1,  original: 150 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a54-5g': { name: 'Galaxy A54 5G (SM-A546)',           services: { screen: { compatible: -1,  original: 130 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a15':    { name: 'Galaxy A15 (SM-A155/SM-A156)',      services: { screen: { compatible: -1,  original: 95  }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a25-5g': { name: 'Galaxy A25 5G (SM-A256)',           services: { screen: { compatible: -1,  original: 115 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a35-5g': { name: 'Galaxy A35 5G (SM-A356)',           services: { screen: { compatible: -1,  original: 120 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a55-5g': { name: 'Galaxy A55 5G (SM-A556)',           services: { screen: { compatible: -1,  original: 150 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a16':    { name: 'Galaxy A16/A16 5G (SM-A165/SM-A166)',services:{ screen: { compatible: -1,  original: 105 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a36-5g': { name: 'Galaxy A36 5G (SM-A366)',           services: { screen: { compatible: 135, original: 150 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a56-5g': { name: 'Galaxy A56 5G (SM-A566)',           services: { screen: { compatible: 135, original: 150 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 120, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() }
};

// Part 6: A Series (A0x series)
const samsungPhoneModels_Part6 = {
    'a07-5g':   { name: 'Galaxy A07 5G (SM-A076)',  services: { screen: { compatible: 60, original: -1 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a07':      { name: 'Galaxy A07 (SM-A075)',      services: { screen: { compatible: 60, original: -1 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a06-5g':   { name: 'Galaxy A06 5G (SM-A066)',  services: { screen: { compatible: 60, original: -1 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a06':      { name: 'Galaxy A06 (SM-A065)',      services: { screen: { compatible: 60, original: -1 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a05s':     { name: 'Galaxy A05s (SM-A057)',     services: { screen: { compatible: 60, original: -1 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a05':      { name: 'Galaxy A05 (SM-A055)',      services: { screen: { compatible: 60, original: -1 }, battery: 50, charging_port: 50, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 100, camera: 0, camera_lens: 30, microphone: 50, earpiece: 50, loudspeaker: 50, power_button: 50 }, lastUpdated: new Date().toISOString() },
    'a04s':     { name: 'Galaxy A04s (SM-A047)',     services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a04e':     { name: 'Galaxy A04e (SM-A042)',     services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a04':      { name: 'Galaxy A04 (SM-A045)',      services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a03s':     { name: 'Galaxy A03s (SM-A037)',     services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a03-core': { name: 'Galaxy A03 Core (SM-A032)', services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a03':      { name: 'Galaxy A03 (SM-A035)',      services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a02s':     { name: 'Galaxy A02s (SM-A025)',     services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a02':      { name: 'Galaxy A02 (SM-A022)',      services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a01-core': { name: 'Galaxy A01 Core (SM-A013)', services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() },
    'a01':      { name: 'Galaxy A01 (SM-A015)',      services: { screen: { compatible: 60, original: -1 }, battery: 45, charging_port: 45, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 80,  camera: 0, camera_lens: 30, microphone: 45, earpiece: 45, loudspeaker: 45, power_button: 45 }, lastUpdated: new Date().toISOString() }
};

// Part 7: Foldables and Xcover (at the end of list)
// motherboard=0 means "ask/contact us" for foldables
const samsungPhoneModels_Part7 = {
    'fold':    { name: 'Galaxy Fold (SM-F900/SM-F907)',    services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-flip':  { name: 'Galaxy Z Flip (SM-F700/SM-F707)',  services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-fold2': { name: 'Galaxy Z Fold2 (SM-F916)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-flip3': { name: 'Galaxy Z Flip3 (SM-F711)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-fold3': { name: 'Galaxy Z Fold3 (SM-F926)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-flip4': { name: 'Galaxy Z Flip4 (SM-F721)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-fold4': { name: 'Galaxy Z Fold4 (SM-F936)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-flip5': { name: 'Galaxy Z Flip5 (SM-F731)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-fold5': { name: 'Galaxy Z Fold5 (SM-F946)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-flip6': { name: 'Galaxy Z Flip6 (SM-F741)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-fold6': { name: 'Galaxy Z Fold6 (SM-F956)',         services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-flip7': { name: 'Galaxy Z Flip7 (SM-F751 Series)',  services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'z-fold7': { name: 'Galaxy Z Fold7 (SM-F966 Series)',  services: { screen: { compatible: -1, original: 0 }, battery: 90, charging_port: 90, software: 20, network_unlock: 30, frp_reset: 40, motherboard: 0, camera: 0, camera_lens: 0, microphone: 90, earpiece: 90, loudspeaker: 90, power_button: 0 }, lastUpdated: new Date().toISOString() },
    'xcover-all':{ name: 'Galaxy Xcover (All)',            services: { screen: { compatible: -1, original: -1 }, battery: -1, charging_port: -1, software: 20, network_unlock: 30, frp_reset: 40, motherboard: -1, camera: -1, camera_lens: -1, microphone: -1, earpiece: -1, loudspeaker: -1, power_button: -1 }, lastUpdated: new Date().toISOString() }
};

// Default Samsung pricing data - Combine all parts
const defaultSamsungPricingData = {
    phone: {
        name: 'Samsung Phone',
        serviceTypes: samsungPhoneServiceTypes,
        models: {
            ...samsungPhoneModels_Part1,
            ...samsungPhoneModels_Part2,
            ...samsungPhoneModels_Part3,
            ...samsungPhoneModels_Part4,
            ...samsungPhoneModels_Part5,
            ...samsungPhoneModels_Part6,
            ...samsungPhoneModels_Part7
        }
    },
    tablet: {
        name: 'Samsung Tablet',
        serviceTypes: samsungTabletServiceTypes,
        models: {
            'tab-s9-ultra': { name: 'Galaxy Tab S9 Ultra', services: createDefaultSamsungTabletServices(), lastUpdated: new Date().toISOString() },
            'tab-s9-plus':  { name: 'Galaxy Tab S9+',      services: createDefaultSamsungTabletServices(), lastUpdated: new Date().toISOString() },
            'tab-s9':       { name: 'Galaxy Tab S9',        services: createDefaultSamsungTabletServices(), lastUpdated: new Date().toISOString() },
            'tab-a9-plus':  { name: 'Galaxy Tab A9+',       services: createDefaultSamsungTabletServices(), lastUpdated: new Date().toISOString() }
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
