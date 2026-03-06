// Computer & Gaming Console Pricing page functionality
let computerPricingData = null;

// Wait for data to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load pricing data
    computerPricingData = loadComputerPricingData();
    console.log('Computer pricing page loaded');
    console.log('Available device types:', Object.keys(computerPricingData));
    console.log('Computer models:', computerPricingData.computer ? Object.keys(computerPricingData.computer.models) : 'none');
    console.log('Console models:', computerPricingData.console ? Object.keys(computerPricingData.console.models) : 'none');
});

const deviceTypeSelect = document.getElementById('deviceType');
const deviceModelSelect = document.getElementById('deviceModel');
const serviceTypeSelect = document.getElementById('serviceType');
const pricingResult = document.getElementById('pricingResult');
const priceDisplay = document.getElementById('priceDisplay');
const serviceDescription = document.getElementById('serviceDescription');

// Device type selection handler
deviceTypeSelect.addEventListener('change', function() {
    const type = this.value;
    deviceModelSelect.innerHTML = '<option value="">Select Model</option>';
    serviceTypeSelect.innerHTML = '<option value="">Select Service</option>';
    deviceModelSelect.disabled = true;
    serviceTypeSelect.disabled = true;
    pricingResult.classList.remove('show');
    
    console.log('Selected type:', type);
    console.log('Pricing data available:', computerPricingData !== null);
    
    if (!computerPricingData) {
        console.error('Pricing data not loaded yet');
        return;
    }
    
    if (type && computerPricingData[type]) {
        console.log('Type data found:', computerPricingData[type].name);
        deviceModelSelect.disabled = false;
        const models = computerPricingData[type].models;
        console.log('Models found:', Object.keys(models).length);
        
        for (const [key, model] of Object.entries(models)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = model.name;
            deviceModelSelect.appendChild(option);
            console.log('Added model:', model.name);
        }
    } else {
        console.error('Type not found in pricing data:', type);
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
        
        // Handle different price types
        let priceText = '';
        if (price === 0) {
            priceText = 'N/A';
        } else if (price === 9999) {
            priceText = 'ASK';
        } else if (price === 30) {
            priceText = '€30*';
        } else {
            priceText = `€${price}`;
        }
        
        priceDisplay.textContent = priceText;
        
        // Add note for diagnostic fee
        let additionalNote = '';
        if (service === 'diagnostic') {
            additionalNote = '<br><small style="font-size: 13px; color: #856404;">*Applied to repair cost</small>';
        } else if (service === 'liquid') {
            additionalNote = '<br><small style="font-size: 13px; color: #856404;">*No Fix No Fee</small>';
        } else if (price === 9999) {
            additionalNote = '<br><small style="font-size: 13px; color: #856404;">*Please contact us for pricing</small>';
        }
        
        serviceDescription.innerHTML = `${serviceName} for ${modelName}${additionalNote}<br><small style="font-size: 14px; color: #6e6e73;">Last updated: ${lastUpdated}</small>`;
        pricingResult.classList.add('show');
    } else {
        pricingResult.classList.remove('show');
    }
});
