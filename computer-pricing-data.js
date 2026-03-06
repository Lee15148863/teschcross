// Computer & Gaming Console Pricing database - stored in localStorage
const COMPUTER_PRICING_STORAGE_KEY = 'techcross_computer_pricing_data';

// Default pricing data based on CSV files
const defaultComputerPricingData = {
    computer: {
        name: 'Computer / Laptop',
        models: {
            'standard-laptop': { 
                name: 'Standard Laptop (Dell, HP, Lenovo, ASUS, etc.)', 
                services: { 
                    diagnostic: 30,
                    screen: 125,
                    battery: 9999,
                    dcjack: 95,
                    keyboard: 115,
                    cooling: 75,
                    ssd: 9999,
                    ram: 9999,
                    liquid: 225,
                    software: 65,
                    data: 140,
                    hinge: 105
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'macbook-air': { 
                name: 'MacBook Air', 
                services: { 
                    diagnostic: 30,
                    screen: 350,
                    battery: 150,
                    dcjack: 95,
                    keyboard: 115,
                    cooling: 75,
                    ssd: 9999,
                    ram: 9999,
                    liquid: 225,
                    software: 65,
                    data: 140,
                    hinge: 105
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'macbook-pro': { 
                name: 'MacBook Pro', 
                services: { 
                    diagnostic: 30,
                    screen: 350,
                    battery: 150,
                    dcjack: 95,
                    keyboard: 115,
                    cooling: 75,
                    ssd: 9999,
                    ram: 9999,
                    liquid: 225,
                    software: 65,
                    data: 140,
                    hinge: 105
                }, 
                lastUpdated: new Date().toISOString() 
            }
        }
    },
    console: {
        name: 'Gaming Console',
        models: {
            // PlayStation 5 Series
            'ps5-disc': { 
                name: 'PlayStation 5 (Disc Edition)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 9999,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'ps5-digital': { 
                name: 'PlayStation 5 (Digital Edition)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 0,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'ps5-slim-disc': { 
                name: 'PlayStation 5 Slim (Disc Edition)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 9999,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'ps5-slim-digital': { 
                name: 'PlayStation 5 Slim (Digital Edition)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 0,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'ps5-pro': { 
                name: 'PlayStation 5 Pro', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 9999,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            
            // Xbox Series
            'xbox-series-x': { 
                name: 'Xbox Series X (1TB Black)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 9999,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'xbox-series-s': { 
                name: 'Xbox Series S (512GB White)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 0,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'xbox-series-s-1tb': { 
                name: 'Xbox Series S (1TB Carbon Black)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 0,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'xbox-series-x-digital': { 
                name: 'Xbox Series X Digital (1TB Robot White)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 0,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'xbox-series-x-galaxy': { 
                name: 'Xbox Series X Galaxy (2TB Special Edition)', 
                services: { 
                    hdmi: 85,
                    motherboard: 120,
                    cleaning: 60,
                    disc: 9999,
                    controller: 0,
                    screen_console: 0
                }, 
                lastUpdated: new Date().toISOString() 
            },
            
            // Nintendo Switch Series
            'switch-original': { 
                name: 'Nintendo Switch (HAC-001)', 
                services: { 
                    hdmi: 100,
                    motherboard: 120,
                    cleaning: 0,
                    disc: 100,
                    controller: 75,
                    screen_console: 125
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'switch-lite': { 
                name: 'Nintendo Switch Lite (HDH-001)', 
                services: { 
                    hdmi: 100,
                    motherboard: 120,
                    cleaning: 0,
                    disc: 100,
                    controller: 75,
                    screen_console: 120
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'switch-oled': { 
                name: 'Nintendo Switch OLED (HEG-001)', 
                services: { 
                    hdmi: 100,
                    motherboard: 120,
                    cleaning: 0,
                    disc: 100,
                    controller: 75,
                    screen_console: 190
                }, 
                lastUpdated: new Date().toISOString() 
            },
            'switch-2': { 
                name: 'Nintendo Switch 2 (BEE-001)', 
                services: { 
                    hdmi: 9999,
                    motherboard: 9999,
                    cleaning: 9999,
                    disc: 9999,
                    controller: 9999,
                    screen_console: 9999
                }, 
                lastUpdated: new Date().toISOString() 
            }
        }
    }
};

const computerServiceTypes = {
    // Computer/Laptop services
    diagnostic: { name: 'Diagnostic Fee / Assessment', description: 'Applied to repair cost', category: 'computer' },
    screen: { name: 'Screen Replacement', description: 'LCD/LED screen repair (MacBook: Full Assembly)', category: 'computer' },
    battery: { name: 'Battery Replacement', description: 'Original quality battery', category: 'computer' },
    dcjack: { name: 'DC Jack / Charging Port Repair', description: 'Fix charging port issues', category: 'computer' },
    keyboard: { name: 'Keyboard / Palmrest Replacement', description: 'Full keyboard replacement', category: 'computer' },
    cooling: { name: 'Fan Replacement & Thermal Paste', description: 'Cooling system maintenance', category: 'computer' },
    ssd: { name: 'SSD Upgrade & OS Install', description: 'Storage upgrade with OS installation', category: 'computer' },
    ram: { name: 'RAM Upgrade', description: 'Memory upgrade', category: 'computer' },
    liquid: { name: 'Liquid Damage Repair / Cleaning', description: 'No Fix No Fee', category: 'computer' },
    software: { name: 'OS Reinstallation / Virus Removal', description: 'Software troubleshooting', category: 'computer' },
    data: { name: 'Data Recovery (Logical)', description: 'Recover lost data', category: 'computer' },
    hinge: { name: 'Screen Hinge / Cover Repair', description: 'Fix broken hinges', category: 'computer' },
    
    // Console services
    hdmi: { name: 'HDMI Port Repair', description: 'Fix HDMI connection issues', category: 'console' },
    motherboard: { name: 'Motherboard/PSU Repair', description: 'Motherboard or power supply repair', category: 'console' },
    cleaning: { name: 'Deep Cleaning (Overheating)', description: 'Cooling system cleaning', category: 'console' },
    disc: { name: 'Disc Drive/Card Reader', description: 'Fix disc reading or card reader issues', category: 'console' },
    controller: { name: 'Analog Stick Drift/Joy Connection', description: 'Controller repair', category: 'console' },
    screen_console: { name: 'LCD/OLED Screen', description: 'Screen replacement for handheld consoles', category: 'console' }
};

// Load pricing data from localStorage or use default
function loadComputerPricingData() {
    const stored = localStorage.getItem(COMPUTER_PRICING_STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            // Check if old structure exists (laptop instead of computer)
            if (data.laptop && !data.computer) {
                console.warn('Old data structure detected (laptop), migrating to new structure (computer)');
                // Migrate old data
                data.computer = data.laptop;
                delete data.laptop;
                saveComputerPricingData(data);
                return data;
            }
            // Validate data structure
            if (data.computer && data.console) {
                console.log('Loaded computer pricing data from localStorage');
                return data;
            } else {
                console.warn('Invalid data structure in localStorage, using default');
                localStorage.removeItem(COMPUTER_PRICING_STORAGE_KEY);
                return defaultComputerPricingData;
            }
        } catch (e) {
            console.error('Error loading computer pricing data:', e);
            localStorage.removeItem(COMPUTER_PRICING_STORAGE_KEY);
            return defaultComputerPricingData;
        }
    }
    console.log('No stored data found, using default');
    return defaultComputerPricingData;
}

// Save pricing data to localStorage
function saveComputerPricingData(data) {
    localStorage.setItem(COMPUTER_PRICING_STORAGE_KEY, JSON.stringify(data));
    console.log('Computer pricing data saved to localStorage');
}

// Initialize with default data if not exists or invalid
const currentData = loadComputerPricingData();
if (!localStorage.getItem(COMPUTER_PRICING_STORAGE_KEY) || !currentData.computer || !currentData.console) {
    console.log('Initializing computer pricing data...');
    saveComputerPricingData(defaultComputerPricingData);
}
