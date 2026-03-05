// Pricing database - stored in localStorage
const PRICING_STORAGE_KEY = 'techcross_pricing_data';

// Default pricing data
const defaultPricingData = {
    apple: {
        name: 'Apple',
        models: {
            'iphone-16-pro-max': { name: 'iPhone 16 Pro Max', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-16-pro': { name: 'iPhone 16 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-16-plus': { name: 'iPhone 16 Plus', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-16': { name: 'iPhone 16', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-15-pro-max': { name: 'iPhone 15 Pro Max', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-15-pro': { name: 'iPhone 15 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-15-plus': { name: 'iPhone 15 Plus', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-15': { name: 'iPhone 15', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-14-pro-max': { name: 'iPhone 14 Pro Max', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-14-pro': { name: 'iPhone 14 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-14-plus': { name: 'iPhone 14 Plus', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-14': { name: 'iPhone 14', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-13-pro-max': { name: 'iPhone 13 Pro Max', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-13-pro': { name: 'iPhone 13 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-13-mini': { name: 'iPhone 13 Mini', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-13': { name: 'iPhone 13', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-12-pro-max': { name: 'iPhone 12 Pro Max', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-12-pro': { name: 'iPhone 12 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-12-mini': { name: 'iPhone 12 Mini', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-12': { name: 'iPhone 12', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-11-pro-max': { name: 'iPhone 11 Pro Max', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-11-pro': { name: 'iPhone 11 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-11': { name: 'iPhone 11', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-xs-max': { name: 'iPhone XS Max', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-xs': { name: 'iPhone XS', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-xr': { name: 'iPhone XR', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'iphone-x': { name: 'iPhone X', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-pro-13-m4': { name: 'iPad Pro 13" M4 (2024)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-pro-11-m4': { name: 'iPad Pro 11" M4 (2024)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-air-13-m2': { name: 'iPad Air 13" M2 (2024)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-air-11-m2': { name: 'iPad Air 11" M2 (2024)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-10': { name: 'iPad 10th Gen (2022)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-9': { name: 'iPad 9th Gen (2021)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-mini-6': { name: 'iPad Mini 6th Gen (2021)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-pro-12-9-5': { name: 'iPad Pro 12.9" 5th Gen (2021)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-pro-11-3': { name: 'iPad Pro 11" 3rd Gen (2021)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-air-4': { name: 'iPad Air 4th Gen (2020)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-8': { name: 'iPad 8th Gen (2020)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-pro-12-9-4': { name: 'iPad Pro 12.9" 4th Gen (2020)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            'ipad-pro-11-2': { name: 'iPad Pro 11" 2nd Gen (2020)', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() }
        }
    },
    samsung: {
        name: 'Samsung',
        models: {
            's24-ultra': { name: 'Galaxy S24 Ultra', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            's24': { name: 'Galaxy S24', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            's23-ultra': { name: 'Galaxy S23 Ultra', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            's23': { name: 'Galaxy S23', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            's22': { name: 'Galaxy S22', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            's21': { name: 'Galaxy S21', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() }
        }
    },
    xiaomi: {
        name: 'Xiaomi',
        models: {
            '14-pro': { name: 'Xiaomi 14 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            '13-pro': { name: 'Xiaomi 13 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() },
            '12-pro': { name: 'Xiaomi 12 Pro', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() }
        }
    },
    other: {
        name: 'Other Brands',
        models: {
            'standard': { name: 'Standard Phone', services: { screen: 9999, battery: 9999, water: 9999, diagnostic: 0, charging: 9999, camera: 9999 }, lastUpdated: new Date().toISOString() }
        }
    }
};

const serviceTypes = {
    screen: { name: 'Screen Replacement', description: 'Cracked or damaged screen repair' },
    battery: { name: 'Battery Replacement', description: 'Original quality battery replacement' },
    water: { name: 'Water Damage or Motherboard Repair', description: 'Please contact us for quote', noPrice: true },
    diagnostic: { name: 'Free Diagnostics', description: 'Complete device check-up' },
    charging: { name: 'Charging Port Repair', description: 'Fix charging issues' },
    camera: { name: 'Camera Repair', description: 'Front or back camera replacement' }
};

// Load pricing data from localStorage or use default
function loadPricingData() {
    const stored = localStorage.getItem(PRICING_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
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
}

// Initialize with default data if not exists
if (!localStorage.getItem(PRICING_STORAGE_KEY)) {
    savePricingData(defaultPricingData);
}
