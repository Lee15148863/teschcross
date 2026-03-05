// Pricing page functionality
const deviceBrandSelect = document.getElementById('deviceBrand');
const deviceModelSelect = document.getElementById('deviceModel');
const serviceTypeSelect = document.getElementById('serviceType');
const pricingResult = document.getElementById('pricingResult');
const priceDisplay = document.getElementById('priceDisplay');
const serviceDescription = document.getElementById('serviceDescription');

let pricingData = loadPricingData();

// Brand selection handler
deviceBrandSelect.addEventListener('change', function() {
    const brand = this.value;
    deviceModelSelect.innerHTML = '<option value="">Select Model</option>';
    serviceTypeSelect.innerHTML = '<option value="">Select Service</option>';
    deviceModelSelect.disabled = true;
    serviceTypeSelect.disabled = true;
    pricingResult.classList.remove('show');
    
    if (brand && pricingData[brand]) {
        deviceModelSelect.disabled = false;
        const models = pricingData[brand].models;
        
        for (const [key, model] of Object.entries(models)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = model.name;
            deviceModelSelect.appendChild(option);
        }
    }
});

// Model selection handler
deviceModelSelect.addEventListener('change', function() {
    const brand = deviceBrandSelect.value;
    const model = this.value;
    serviceTypeSelect.innerHTML = '<option value="">Select Service</option>';
    serviceTypeSelect.disabled = true;
    pricingResult.classList.remove('show');
    
    if (brand && model && pricingData[brand]?.models[model]) {
        serviceTypeSelect.disabled = false;
        
        for (const [key, service] of Object.entries(serviceTypes)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = service.name;
            serviceTypeSelect.appendChild(option);
        }
    }
});

// Service selection handler
serviceTypeSelect.addEventListener('change', function() {
    const brand = deviceBrandSelect.value;
    const model = deviceModelSelect.value;
    const service = this.value;
    
    if (brand && model && service) {
        const modelData = pricingData[brand].models[model];
        const price = modelData.services[service];
        const serviceName = serviceTypes[service].name;
        const serviceInfo = serviceTypes[service];
        const modelName = modelData.name;
        const lastUpdated = modelData.lastUpdated ? new Date(modelData.lastUpdated).toLocaleString('en-IE', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Not available';
        
        // Check if this service requires contacting customer service
        if (serviceInfo.noPrice) {
            priceDisplay.textContent = 'Contact Us';
            serviceDescription.innerHTML = `${serviceName} for ${modelName}<br><small style="font-size: 14px; color: #6e6e73;">Please call us for a quote: <a href="tel:0469059854" style="color: #0071e3; text-decoration: none; font-weight: 600;">046 905 9854</a></small>`;
        } else {
            priceDisplay.textContent = price === 0 ? 'Free' : `€${price}`;
            serviceDescription.innerHTML = `${serviceName} for ${modelName}<br><small style="font-size: 14px; color: #6e6e73;">Last updated: ${lastUpdated}</small>`;
        }
        pricingResult.classList.add('show');
    } else {
        pricingResult.classList.remove('show');
    }
});

console.log('Pricing page loaded');
console.log('Available brands:', Object.keys(pricingData));
