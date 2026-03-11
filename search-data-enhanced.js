// Enhanced Search Data Aggregator
// Automatically loads data from all brand databases

class SearchDataAggregator {
    constructor() {
        this.allDevices = [];
        this.initialized = false;
        this.loadAllData();
    }
    
    // Load data from all sources
    loadAllData() {
        this.allDevices = [];
        
        // Load Apple data
        this.loadAppleData();
        
        // Load Samsung data
        this.loadSamsungData();
        
        // Load Xiaomi data
        this.loadXiaomiData();
        
        // Load Google data
        this.loadGoogleData();
        
        // Load OnePlus data
        this.loadOnePlusData();
        
        // Load OPPO data
        this.loadOppoData();
        
        // Load Huawei data
        this.loadHuaweiData();
        
        // Load Honor data
        this.loadHonorData();
        
        // Load Other brands data
        this.loadOtherData();
        
        // Load computer services
        this.loadComputerData();
        
        // Load console services
        this.loadConsoleData();
        
        this.initialized = true;
        console.log(`Search index built: ${this.allDevices.length} devices loaded`);
    }
    
    // Apple data loader
    loadAppleData() {
        try {
            if (typeof loadApplePricingData === 'function') {
                const data = loadApplePricingData();
                
                // iPhone models
                if (data.iphone && data.iphone.models) {
                    Object.entries(data.iphone.models).forEach(([key, model]) => {
                        this.allDevices.push({
                            id: `apple-iphone-${key}`,
                            name: model.name,
                            brand: 'Apple',
                            category: 'Phone',
                            type: 'iPhone',
                            icon: '📱',
                            link: 'pricing-apple-iphone.html',
                            services: model.services,
                            serviceTypes: data.iphone.serviceTypes,
                            keywords: ['apple', 'iphone', 'ios', model.name.toLowerCase()],
                            popularity: this.calculatePopularity(model.name)
                        });
                    });
                }
                
                // iPad models
                if (data.ipad && data.ipad.models) {
                    Object.entries(data.ipad.models).forEach(([key, model]) => {
                        this.allDevices.push({
                            id: `apple-ipad-${key}`,
                            name: model.name,
                            brand: 'Apple',
                            category: 'Tablet',
                            type: 'iPad',
                            icon: '📲',
                            link: 'pricing-apple-ipad.html',
                            services: model.services,
                            serviceTypes: data.ipad.serviceTypes,
                            keywords: ['apple', 'ipad', 'tablet', 'ios', model.name.toLowerCase()],
                            popularity: this.calculatePopularity(model.name)
                        });
                    });
                }
            }
        } catch (error) {
            console.log('Apple data not available');
        }
    }
    
    // Samsung data loader
    loadSamsungData() {
        try {
            if (typeof loadSamsungPricingData === 'function') {
                const data = loadSamsungPricingData();
                
                // Phone models
                if (data.phone && data.phone.models) {
                    Object.entries(data.phone.models).forEach(([key, model]) => {
                        this.allDevices.push({
                            id: `samsung-phone-${key}`,
                            name: model.name,
                            brand: 'Samsung',
                            category: 'Phone',
                            type: 'Samsung Phone',
                            icon: '📱',
                            link: 'pricing-samsung.html',
                            services: model.services,
                            serviceTypes: data.phone.serviceTypes,
                            keywords: ['samsung', 'galaxy', 'android', model.name.toLowerCase()],
                            popularity: this.calculatePopularity(model.name)
                        });
                    });
                }
                
                // Tablet models
                if (data.tablet && data.tablet.models) {
                    Object.entries(data.tablet.models).forEach(([key, model]) => {
                        this.allDevices.push({
                            id: `samsung-tablet-${key}`,
                            name: model.name,
                            brand: 'Samsung',
                            category: 'Tablet',
                            type: 'Samsung Tablet',
                            icon: '📲',
                            link: 'pricing-samsung.html',
                            services: model.services,
                            serviceTypes: data.tablet.serviceTypes,
                            keywords: ['samsung', 'galaxy', 'tab', 'tablet', 'android', model.name.toLowerCase()],
                            popularity: this.calculatePopularity(model.name)
                        });
                    });
                }
            }
        } catch (error) {
            console.log('Samsung data not available');
        }
    }
    
    // Generic brand data loader
    loadBrandData(brandName, loadFunction, link, icon = '📱') {
        try {
            if (typeof loadFunction === 'function') {
                const data = loadFunction();
                
                if (data && data.models) {
                    Object.entries(data.models).forEach(([key, model]) => {
                        this.allDevices.push({
                            id: `${brandName.toLowerCase()}-${key}`,
                            name: model.name,
                            brand: brandName,
                            category: 'Phone',
                            type: `${brandName} Phone`,
                            icon: icon,
                            link: link,
                            services: model.services,
                            serviceTypes: data.serviceTypes,
                            keywords: [brandName.toLowerCase(), 'android', model.name.toLowerCase()],
                            popularity: this.calculatePopularity(model.name)
                        });
                    });
                }
            }
        } catch (error) {
            console.log(`${brandName} data not available`);
        }
    }
    
    loadXiaomiData() {
        this.loadBrandData('Xiaomi', loadXiaomiPricingData, 'pricing-xiaomi.html');
    }
    
    loadGoogleData() {
        this.loadBrandData('Google', loadGooglePricingData, 'pricing-google.html');
    }
    
    loadOnePlusData() {
        this.loadBrandData('OnePlus', loadOnePlusPricingData, 'pricing-oneplus.html');
    }
    
    loadOppoData() {
        this.loadBrandData('OPPO', loadOppoPricingData, 'pricing-oppo.html');
    }
    
    loadHuaweiData() {
        this.loadBrandData('Huawei', loadHuaweiPricingData, 'pricing-huawei.html');
    }
    
    loadHonorData() {
        this.loadBrandData('Honor', loadHonorPricingData, 'pricing-honor.html');
    }
    
    loadOtherData() {
        this.loadBrandData('Other', loadOtherPricingData, 'pricing-other.html');
    }
    
    // Computer services
    loadComputerData() {
        const computerServices = [
            { name: 'Diagnostic Fee / Assessment', price: '€30', type: 'Diagnostics' },
            { name: 'Screen Replacement (Standard)', price: '€100 - €150+', type: 'Screen' },
            { name: 'MacBook Screen Assembly', price: '€250 - €450+', type: 'Screen' },
            { name: 'Battery Replacement (PC)', price: 'Contact Us', type: 'Battery' },
            { name: 'MacBook Battery Replacement', price: '€120 - €180+', type: 'Battery' },
            { name: 'DC Jack / Charging Port Repair', price: '€70 - €120', type: 'Power' },
            { name: 'Keyboard / Palmrest Replacement', price: '€80 - €150+', type: 'Keyboard' },
            { name: 'Fan Replacement & Thermal Paste', price: '€60 - €90', type: 'Cooling' },
            { name: 'SSD Upgrade & OS Install', price: 'Contact Us', type: 'Storage' },
            { name: 'RAM Upgrade', price: 'Contact Us', type: 'Memory' },
            { name: 'Liquid Damage Repair / Cleaning', price: '€150 - €300', type: 'Motherboard' },
            { name: 'OS Reinstallation / Virus Removal', price: '€50 - €80', type: 'Software' },
            { name: 'Data Recovery (Logical)', price: '€80 - €200+', type: 'Data' },
            { name: 'Screen Hinge / Cover Repair', price: '€80 - €130', type: 'Hinge/Body' }
        ];
        
        computerServices.forEach((service, index) => {
            this.allDevices.push({
                id: `computer-${index}`,
                name: service.name,
                brand: 'Computer',
                category: 'Computer',
                type: service.type,
                icon: '💻',
                link: 'computer-pricing.html',
                price: service.price,
                keywords: ['computer', 'laptop', 'pc', 'macbook', service.name.toLowerCase(), service.type.toLowerCase()],
                popularity: 50
            });
        });
    }
    
    // Console services
    loadConsoleData() {
        const consoleServices = [
            // PS5
            { name: 'PlayStation 5 HDMI Port Repair', brand: 'Sony', price: '€85', type: 'PS5', keywords: ['ps5', 'playstation', 'hdmi'] },
            { name: 'PlayStation 5 Motherboard/PSU Repair', brand: 'Sony', price: '€120', type: 'PS5', keywords: ['ps5', 'playstation', 'motherboard'] },
            { name: 'PlayStation 5 Deep Cleaning', brand: 'Sony', price: '€60', type: 'PS5', keywords: ['ps5', 'playstation', 'cleaning'] },
            { name: 'PlayStation 5 Disc Drive Repair', brand: 'Sony', price: 'Contact Us', type: 'PS5', keywords: ['ps5', 'playstation', 'disc'] },
            { name: 'PS5 DualSense Charging Port', brand: 'Sony', price: '€50', type: 'PS5 Controller', keywords: ['ps5', 'dualsense', 'controller', 'charging'] },
            { name: 'PS5 DualSense Analog Stick Drift', brand: 'Sony', price: '€50 - €65', type: 'PS5 Controller', keywords: ['ps5', 'dualsense', 'controller', 'drift', 'analog'] },
            
            // Xbox
            { name: 'Xbox Series X/S HDMI Port Repair', brand: 'Microsoft', price: '€85', type: 'Xbox', keywords: ['xbox', 'series', 'hdmi'] },
            { name: 'Xbox Series X/S Motherboard/PSU Repair', brand: 'Microsoft', price: '€120', type: 'Xbox', keywords: ['xbox', 'series', 'motherboard'] },
            { name: 'Xbox Wireless Controller Charging Port', brand: 'Microsoft', price: '€50', type: 'Xbox Controller', keywords: ['xbox', 'controller', 'charging'] },
            { name: 'Xbox Wireless Controller Analog Stick Drift', brand: 'Microsoft', price: '€60 - €75', type: 'Xbox Controller', keywords: ['xbox', 'controller', 'drift', 'analog'] },
            
            // Switch
            { name: 'Nintendo Switch HDMI Port Repair', brand: 'Nintendo', price: '€100', type: 'Switch', keywords: ['switch', 'nintendo', 'hdmi'] },
            { name: 'Nintendo Switch Joy-Con Drift', brand: 'Nintendo', price: '€75', type: 'Switch', keywords: ['switch', 'nintendo', 'joycon', 'drift'] },
            { name: 'Nintendo Switch LCD Screen', brand: 'Nintendo', price: '€120 - €125', type: 'Switch', keywords: ['switch', 'nintendo', 'screen', 'lcd'] },
            { name: 'Nintendo Switch OLED Screen', brand: 'Nintendo', price: '€190', type: 'Switch OLED', keywords: ['switch', 'nintendo', 'oled', 'screen'] }
        ];
        
        consoleServices.forEach((service, index) => {
            this.allDevices.push({
                id: `console-${index}`,
                name: service.name,
                brand: service.brand,
                category: 'Gaming Console',
                type: service.type,
                icon: '🎮',
                link: 'computer-pricing.html#console',
                price: service.price,
                keywords: service.keywords,
                popularity: 60
            });
        });
    }
    
    // Calculate popularity score based on model name
    calculatePopularity(name) {
        const nameLower = name.toLowerCase();
        let score = 50; // Base score
        
        // Newer models get higher scores
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 5; year--) {
            if (nameLower.includes(year.toString())) {
                score += (year - (currentYear - 5)) * 10;
                break;
            }
        }
        
        // Popular series
        if (nameLower.includes('pro max')) score += 20;
        else if (nameLower.includes('pro')) score += 15;
        else if (nameLower.includes('plus')) score += 10;
        else if (nameLower.includes('ultra')) score += 20;
        
        // Popular brands
        if (nameLower.includes('iphone')) score += 30;
        else if (nameLower.includes('samsung')) score += 25;
        else if (nameLower.includes('galaxy')) score += 20;
        
        return Math.min(score, 100);
    }
    
    // Get all devices
    getAllDevices() {
        if (!this.initialized) {
            this.loadAllData();
        }
        return this.allDevices;
    }
    
    // Refresh data
    refresh() {
        this.loadAllData();
    }
}

// Create global instance
window.searchDataAggregator = new SearchDataAggregator();

// Legacy function for compatibility
function getAllSearchData() {
    return window.searchDataAggregator.getAllDevices();
}
