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
        const price = pricingData[brand].models[model].services[service];
        const serviceName = serviceTypes[service].name;
        const modelName = pricingData[brand].models[model].name;
        
        priceDisplay.textContent = price === 0 ? 'Free' : `€${price}`;
        serviceDescription.textContent = `${serviceName} for ${modelName}`;
        pricingResult.classList.add('show');
    } else {
        pricingResult.classList.remove('show');
    }
});

console.log('Pricing page loaded');
console.log('Available brands:', Object.keys(pricingData));
