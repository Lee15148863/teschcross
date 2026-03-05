// Computer & Gaming Console Pricing database - stored in localStorage
const COMPUTER_PRICING_STORAGE_KEY = 'techcross_computer_pricing_data';

// Default pricing data
const defaultComputerPricingData = {
    laptop: {
        name: 'Laptop',
        models: {
            'macbook-air': { name: 'MacBook Air', services: { screen: 9999, battery: 9999, keyboard: 9999, diagnostic: 0, hinge: 9999, upgrade: 9999 }, lastUpdated: new Date().toISOString() },
            'macbook-pro': { name: 'MacBook Pro', services: { screen: 9999, battery: 9999, keyboard: 9999, diagnostic: 0, hinge: 9999, upgrade: 9999 }, lastUpdated: new Date().toISOString() },
            'dell-laptop': { name: 'Dell Laptop', services: { screen: 9999, battery: 9999, keyboard: 9999, diagnostic: 0, hinge: 9999, upgrade: 9999 }, lastUpdated: new Date().toISOString() },
            'hp-laptop': { name: 'HP Laptop', services: { screen: 9999, battery: 9999, keyboard: 9999, diagnostic: 0, hinge: 9999, upgrade: 9999 }, lastUpdated: new Date().toISOString() },
            'lenovo-laptop': { name: 'Lenovo Laptop', services: { screen: 9999, battery: 9999, keyboard: 9999, diagnostic: 0, hinge: 9999, upgrade: 9999 }, lastUpdated: new Date().toISOString() },
            'asus-laptop': { name: 'ASUS Laptop', services: { screen: 9999, battery: 9999, keyboard: 9999, diagnostic: 0, hinge: 9999, upgrade: 9999 }, lastUpdated: new Date().toISOString() },
            'other-laptop': { name: 'Other Laptop', services: { screen: 9999, battery: 9999, keyboard: 9999, diagnostic: 0, hinge: 9999, upgrade: 9999 }, lastUpdated: new Date().toISOString() }
        }
    },
    console: {
        name: 'Gaming Console',
        models: {
            'ps5': { name: 'PlayStation 5', services: { hdmi: 9999, disc: 9999, overheating: 9999, diagnostic: 0, power: 9999, controller: 9999 }, lastUpdated: new Date().toISOString() },
            'ps4': { name: 'PlayStation 4', services: { hdmi: 9999, disc: 9999, overheating: 9999, diagnostic: 0, power: 9999, controller: 9999 }, lastUpdated: new Date().toISOString() },
            'xbox-series': { name: 'Xbox Series X/S', services: { hdmi: 9999, disc: 9999, overheating: 9999, diagnostic: 0, power: 9999, controller: 9999 }, lastUpdated: new Date().toISOString() },
            'xbox-one': { name: 'Xbox One', services: { hdmi: 9999, disc: 9999, overheating: 9999, diagnostic: 0, power: 9999, controller: 9999 }, lastUpdated: new Date().toISOString() },
            'nintendo-switch': { name: 'Nintendo Switch', services: { hdmi: 9999, disc: 9999, overheating: 9999, diagnostic: 0, power: 9999, controller: 9999 }, lastUpdated: new Date().toISOString() }
        }
    }
};

const computerServiceTypes = {
    // Laptop services
    screen: { name: 'Screen Replacement', description: 'LCD/LED screen repair' },
    battery: { name: 'Battery Replacement', description: 'Original quality battery' },
    keyboard: { name: 'Keyboard Replacement', description: 'Full keyboard replacement' },
    diagnostic: { name: 'Free Diagnostics', description: 'Complete device check-up' },
    hinge: { name: 'Hinge Repair', description: 'Fix broken hinges' },
    upgrade: { name: 'SSD/RAM Upgrade', description: 'Performance upgrade' },
    // Console services
    hdmi: { name: 'HDMI Port Repair', description: 'Fix HDMI connection issues' },
    disc: { name: 'Disc Drive Repair', description: 'Fix disc reading issues' },
    overheating: { name: 'Overheating Fix', description: 'Cooling system repair' },
    power: { name: 'Power Supply Repair', description: 'Fix power issues' },
    controller: { name: 'Controller Repair', description: 'Fix controller issues' }
};

// Load pricing data from localStorage or use default
function loadComputerPricingData() {
    const stored = localStorage.getItem(COMPUTER_PRICING_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error loading computer pricing data:', e);
            return defaultComputerPricingData;
        }
    }
    return defaultComputerPricingData;
}

// Save pricing data to localStorage
function saveComputerPricingData(data) {
    localStorage.setItem(COMPUTER_PRICING_STORAGE_KEY, JSON.stringify(data));
}

// Initialize with default data if not exists
if (!localStorage.getItem(COMPUTER_PRICING_STORAGE_KEY)) {
    saveComputerPricingData(defaultComputerPricingData);
}
