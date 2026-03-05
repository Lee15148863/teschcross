// Computer & Gaming Console Pricing page functionality
const deviceTypeSelect = document.getElementById('deviceType');
const deviceModelSelect = document.getElementById('deviceModel');
const serviceTypeSelect = document.getElementById('serviceType');
const pricingResult = document.getElementById('pricingResult');
const priceDisplay = document.getElementById('priceDisplay');
const serviceDescription = document.getElementById('serviceDescription');

let computerPricingData = loadComputerPricingData();

// Device type selection handler
deviceTypeSelect.addEventListener('change', function() {
    const type = this.value;
    deviceModelSelect.innerHTML = '<option value="">Select Model</option>';
    serviceTypeSelect.innerHTML = '<option value="">Select Service</option>';
    deviceModelSelect.disabled = true;
    serviceTypeSelect.disabled = true;
    pricingResult.classList.remove('show');
    
    if (type && computerPricingData[type]) {
        deviceModelSelect.disabled = false;
        const models = computerPricingData[type].models;
        
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
    const type = deviceTypeSelect.value;
    const model = this.value;
    serviceTypeSelect.innerHTML = '<option value="">Select Service</option>';
    serviceTypeSelect.disabled = true;
    pricingResult.classList.remove('show');
    
    if (type && model && computerPricingData[type]?.models[model]) {
        serviceTypeSelect.disabled = false;
        const modelData = computerPricingData[type].models[model];
        
        for (const [key, service] of Object.entries(computerServiceTypes)) {
            // Only show services that exist for this model
            if (modelData.services.hasOwnProperty(key)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = service.name;
                serviceTypeSelect.appendChild(option);
            }
        }
    }
});

// Service selection handler
serviceTypeSelect.addEventListener('change', function() {
    const type = deviceTypeSelect.value;
    const model = deviceModelSelect.value;
    const service = this.value;
    
    if (type && model && service) {
        const modelData = computerPricingData[type].models[model];
        const price = modelData.services[service];
        const serviceName = computerServiceTypes[service].name;
        const modelName = modelData.name;
        const lastUpdated = modelData.lastUpdated ? new Date(modelData.lastUpdated).toLocaleString('en-IE', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Not available';
        
        priceDisplay.textContent = price === 0 ? 'Free' : `€${price}`;
        serviceDescription.innerHTML = `${serviceName} for ${modelName}<br><small style="font-size: 14px; color: #6e6e73;">Last updated: ${lastUpdated}</small>`;
        pricingResult.classList.add('show');
    } else {
        pricingResult.classList.remove('show');
    }
});

console.log('Computer pricing page loaded');
console.log('Available device types:', Object.keys(computerPricingData));
