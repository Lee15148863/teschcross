// Static search data for all services
const searchData = {
    // Computer services
    computer: [
        { name: 'Diagnostic Fee / Assessment', category: 'Computer', price: '€30', type: 'Diagnostics', link: 'computer-pricing.html', icon: '💻' },
        { name: 'Screen Replacement (Standard)', category: 'Computer', price: '€100 - €150+', type: 'Screen', link: 'computer-pricing.html', icon: '💻' },
        { name: 'MacBook Screen Assembly', category: 'Computer', price: '€250 - €450+', type: 'Screen', link: 'computer-pricing.html', icon: '💻' },
        { name: 'Battery Replacement (PC)', category: 'Computer', price: 'ASK', type: 'Battery', link: 'computer-pricing.html', icon: '💻' },
        { name: 'MacBook Battery Replacement', category: 'Computer', price: '€120 - €180+', type: 'Battery', link: 'computer-pricing.html', icon: '💻' },
        { name: 'DC Jack / Charging Port Repair', category: 'Computer', price: '€70 - €120', type: 'Power', link: 'computer-pricing.html', icon: '💻' },
        { name: 'Keyboard / Palmrest Replacement', category: 'Computer', price: '€80 - €150+', type: 'Keyboard', link: 'computer-pricing.html', icon: '💻' },
        { name: 'Fan Replacement & Thermal Paste', category: 'Computer', price: '€60 - €90', type: 'Cooling', link: 'computer-pricing.html', icon: '💻' },
        { name: 'SSD Upgrade & OS Install', category: 'Computer', price: 'ASK', type: 'Storage', link: 'computer-pricing.html', icon: '💻' },
        { name: 'RAM Upgrade', category: 'Computer', price: 'ASK', type: 'Memory', link: 'computer-pricing.html', icon: '💻' },
        { name: 'Liquid Damage Repair / Cleaning', category: 'Computer', price: '€150 - €300', type: 'Motherboard', link: 'computer-pricing.html', icon: '💻' },
        { name: 'OS Reinstallation / Virus Removal', category: 'Computer', price: '€50 - €80', type: 'Software', link: 'computer-pricing.html', icon: '💻' },
        { name: 'Data Recovery (Logical)', category: 'Computer', price: '€80 - €200+', type: 'Data', link: 'computer-pricing.html', icon: '💻' },
        { name: 'Screen Hinge / Cover Repair', category: 'Computer', price: '€80 - €130', type: 'Hinge/Body', link: 'computer-pricing.html', icon: '💻' }
    ],
    
    // Gaming consoles
    console: [
        // PlayStation 5
        { name: 'PlayStation 5 HDMI Port Repair', category: 'Gaming Console', brand: 'Sony', price: '€85', type: 'PS5', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'PlayStation 5 Motherboard/PSU Repair', category: 'Gaming Console', brand: 'Sony', price: '€120', type: 'PS5', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'PlayStation 5 Deep Cleaning', category: 'Gaming Console', brand: 'Sony', price: '€60', type: 'PS5', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'PlayStation 5 Disc Drive Repair', category: 'Gaming Console', brand: 'Sony', price: 'ASK', type: 'PS5', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'PlayStation 5 System Reinstall', category: 'Gaming Console', brand: 'Sony', price: '€40', type: 'PS5', link: 'computer-pricing.html#console', icon: '🎮' },
        
        // PS5 Controllers
        { name: 'PS5 DualSense Charging Port', category: 'Gaming Console', brand: 'Sony', price: '€50', type: 'PS5 Controller', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'PS5 DualSense Analog Stick Drift', category: 'Gaming Console', brand: 'Sony', price: '€50 - €65', type: 'PS5 Controller', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'PS5 DualSense Edge Charging Port', category: 'Gaming Console', brand: 'Sony', price: '€70', type: 'PS5 Controller', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'PS5 DualSense Edge Analog Stick Drift', category: 'Gaming Console', brand: 'Sony', price: '€60 - €75', type: 'PS5 Controller', link: 'computer-pricing.html#console', icon: '🎮' },
        
        // Xbox Series
        { name: 'Xbox Series X/S HDMI Port Repair', category: 'Gaming Console', brand: 'Microsoft', price: '€85', type: 'Xbox', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Xbox Series X/S Motherboard/PSU Repair', category: 'Gaming Console', brand: 'Microsoft', price: '€120', type: 'Xbox', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Xbox Series X/S Deep Cleaning', category: 'Gaming Console', brand: 'Microsoft', price: '€60', type: 'Xbox', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Xbox Series X/S Disc Drive Repair', category: 'Gaming Console', brand: 'Microsoft', price: 'ASK', type: 'Xbox', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Xbox Series X/S System Reinstall', category: 'Gaming Console', brand: 'Microsoft', price: '€55', type: 'Xbox', link: 'computer-pricing.html#console', icon: '🎮' },
        
        // Xbox Controllers
        { name: 'Xbox Wireless Controller Charging Port', category: 'Gaming Console', brand: 'Microsoft', price: '€50', type: 'Xbox Controller', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Xbox Wireless Controller Analog Stick Drift', category: 'Gaming Console', brand: 'Microsoft', price: '€60 - €75', type: 'Xbox Controller', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Xbox Elite Series 2 Charging Port', category: 'Gaming Console', brand: 'Microsoft', price: '€85', type: 'Xbox Controller', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Xbox Elite Series 2 Analog Stick Drift', category: 'Gaming Console', brand: 'Microsoft', price: '€70 - €85', type: 'Xbox Controller', link: 'computer-pricing.html#console', icon: '🎮' },
        
        // Nintendo Switch
        { name: 'Nintendo Switch HDMI Port Repair', category: 'Gaming Console', brand: 'Nintendo', price: '€100', type: 'Switch', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Nintendo Switch Motherboard/PSU Repair', category: 'Gaming Console', brand: 'Nintendo', price: '€120', type: 'Switch', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Nintendo Switch Card Reader Repair', category: 'Gaming Console', brand: 'Nintendo', price: '€100', type: 'Switch', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Nintendo Switch Joy-Con Drift', category: 'Gaming Console', brand: 'Nintendo', price: '€75', type: 'Switch', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Nintendo Switch LCD Screen', category: 'Gaming Console', brand: 'Nintendo', price: '€120 - €125', type: 'Switch', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Nintendo Switch OLED Screen', category: 'Gaming Console', brand: 'Nintendo', price: '€190', type: 'Switch OLED', link: 'computer-pricing.html#console', icon: '🎮' },
        { name: 'Nintendo Switch 2', category: 'Gaming Console', brand: 'Nintendo', price: 'ASK', type: 'Switch 2', link: 'computer-pricing.html#console', icon: '🎮' }
    ]
};

// Function to get all searchable items
function getAllSearchData() {
    const allData = [];
    
    // Add computer services
    searchData.computer.forEach(item => {
        allData.push(item);
    });
    
    // Add console services
    searchData.console.forEach(item => {
        allData.push(item);
    });
    
    // Add phone/tablet data from pricing-data.js if available
    try {
        if (typeof loadPricingData === 'function') {
            const phonePricingData = loadPricingData();
            if (phonePricingData) {
                Object.keys(phonePricingData).forEach(brandKey => {
                    const brand = phonePricingData[brandKey];
                    if (brand && brand.models) {
                        Object.keys(brand.models).forEach(modelKey => {
                            const model = brand.models[modelKey];
                            if (model && model.name) {
                                allData.push({
                                    name: model.name,
                                    category: 'Phone/Tablet',
                                    brand: brand.name,
                                    type: brand.name,
                                    icon: '📱',
                                    link: 'pricing.html',
                                    services: model.services || {}
                                });
                            }
                        });
                    }
                });
            }
        }
    } catch (error) {
        console.log('Phone pricing data not available:', error);
    }
    
    return allData;
}
