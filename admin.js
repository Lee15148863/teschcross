// Admin page functionality
const ADMIN_USERNAME_KEY = 'techcross_admin_username';
const ADMIN_PASSWORD_KEY = 'techcross_admin_password';
const ADMIN_SESSION_KEY = 'techcross_admin_session';

// Default credentials (can be changed)
const DEFAULT_USERNAME = '0876676466';
const DEFAULT_PASSWORD = '0870019999';

// Check if custom credentials exist, otherwise use default
function getAdminUsername() {
    return localStorage.getItem(ADMIN_USERNAME_KEY) || DEFAULT_USERNAME;
}

function getAdminPassword() {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_PASSWORD;
}

// Set custom credentials
function setAdminCredentials(username, password) {
    localStorage.setItem(ADMIN_USERNAME_KEY, username);
    localStorage.setItem(ADMIN_PASSWORD_KEY, password);
}

// Check if user is logged in
function checkAuth() {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session === 'authenticated') {
        showAdminPanel();
    }
}

// Login handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const correctUsername = getAdminUsername();
    const correctPassword = getAdminPassword();
    
    if (username === correctUsername && password === correctPassword) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
        showAdminPanel();
    } else {
        document.getElementById('loginError').classList.add('show');
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
        setTimeout(() => {
            document.getElementById('loginError').classList.remove('show');
        }, 3000);
    }
});

// Show admin panel
function showAdminPanel() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminNav').style.display = 'block';
    document.getElementById('adminContainer').classList.add('show');
}

// Logout
function logout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    location.reload();
}

// Change credentials function (can be called from console)
function changeAdminCredentials(newUsername, newPassword) {
    if (newUsername && newPassword && newPassword.length >= 6) {
        setAdminCredentials(newUsername, newPassword);
        console.log('Credentials changed successfully!');
        alert('Credentials changed successfully! Please login again.');
        logout();
    } else {
        console.error('Username and password are required. Password must be at least 6 characters long.');
    }
}

// Check authentication on page load
checkAuth();

let pricingData = loadPricingData();

// Tab switching
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Render pricing editor
function renderPricingEditor() {
    const editor = document.getElementById('pricing-editor');
    editor.innerHTML = '';
    
    // Add filter/search controls
    const filterSection = document.createElement('div');
    filterSection.style.cssText = 'background: #f5f5f7; padding: 20px; border-radius: 12px; margin-bottom: 24px;';
    filterSection.innerHTML = `
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
                <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Search Model</label>
                <input type="text" id="model-search" placeholder="Type to search models..." 
                       style="width: 100%; padding: 10px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px;"
                       oninput="filterModels()">
            </div>
            <div>
                <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Filter by Brand</label>
                <select id="brand-filter" onchange="filterModels()" 
                        style="padding: 10px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px;">
                    <option value="">All Brands</option>
                    ${Object.entries(pricingData).map(([key, brand]) => `<option value="${key}">${brand.name}</option>`).join('')}
                </select>
            </div>
            <div style="margin-top: 24px;">
                <button onclick="expandAll()" style="padding: 10px 20px; background: #0071e3; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 8px;">Expand All</button>
                <button onclick="collapseAll()" style="padding: 10px 20px; background: #6e6e73; color: white; border: none; border-radius: 8px; cursor: pointer;">Collapse All</button>
            </div>
        </div>
    `;
    editor.appendChild(filterSection);
    
    for (const [brandKey, brand] of Object.entries(pricingData)) {
        const brandSection = document.createElement('div');
        brandSection.className = 'brand-section';
        brandSection.dataset.brand = brandKey;
        
        const modelCount = Object.keys(brand.models).length;
        const brandHeader = document.createElement('div');
        brandHeader.className = 'brand-header';
        brandHeader.innerHTML = `
            <h3>${brand.name} <span style="font-size: 14px; color: #86868b; font-weight: normal;">(${modelCount} models)</span></h3>
            <span class="toggle-icon">▼</span>
        `;
        brandHeader.onclick = function() {
            brandContent.classList.toggle('show');
            const icon = this.querySelector('.toggle-icon');
            icon.textContent = brandContent.classList.contains('show') ? '▼' : '▶';
        };
        
        const brandContent = document.createElement('div');
        brandContent.className = 'brand-content';
        
        // Create table with all service columns
        let serviceHeaders = '';
        for (const [key, service] of Object.entries(serviceTypes)) {
            serviceHeaders += `<th style="min-width: 120px;">${service.name}</th>`;
        }
        
        const table = document.createElement('div');
        table.className = 'pricing-table';
        table.style.overflowX = 'auto';
        table.innerHTML = `
            <table style="min-width: 2000px;">
                <thead>
                    <tr>
                        <th style="position: sticky; left: 0; background: #1d1d1f; z-index: 10; min-width: 200px; color: white;">Model</th>
                        ${serviceHeaders}
                        <th style="min-width: 100px;">Action</th>
                    </tr>
                </thead>
                <tbody id="tbody-${brandKey}">
                </tbody>
            </table>
        `;
        
        brandContent.appendChild(table);
        brandSection.appendChild(brandHeader);
        brandSection.appendChild(brandContent);
        editor.appendChild(brandSection);
        
        // Add model rows
        const tbody = document.getElementById(`tbody-${brandKey}`);
        for (const [modelKey, model] of Object.entries(brand.models)) {
            const row = document.createElement('tr');
            row.dataset.modelKey = modelKey;
            row.dataset.modelName = model.name.toLowerCase();
            
            let serviceCells = '';
            for (const serviceKey in serviceTypes) {
                const price = model.services[serviceKey] || 0;
                const isNetworkUnlock = serviceKey === 'network_unlock';
                serviceCells += `<td><input type="number" value="${price}" data-brand="${brandKey}" data-model="${modelKey}" data-service="${serviceKey}" ${isNetworkUnlock ? 'disabled style="background: #f5f5f7; cursor: not-allowed;"' : ''}></td>`;
            }
            
            row.innerHTML = `
                <td style="position: sticky; left: 0; background: #fff; z-index: 5;">
                    <strong id="model-name-${brandKey}-${modelKey}">${model.name}</strong>
                    <button onclick="editModelName('${brandKey}', '${modelKey}')" 
                            style="margin-left: 8px; color: #0071e3; background: none; border: none; cursor: pointer; font-size: 12px;">
                        ✏️ Edit
                    </button>
                    <div style="font-size: 11px; color: #86868b; margin-top: 4px;">
                        Last updated: ${model.lastUpdated ? new Date(model.lastUpdated).toLocaleString('en-IE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </div>
                </td>
                ${serviceCells}
                <td><button onclick="deleteModel('${brandKey}', '${modelKey}')" style="color: #ff3b30; background: none; border: none; cursor: pointer; font-size: 14px;">Delete</button></td>
            `;
            tbody.appendChild(row);
        }
    }
}

// Filter models based on search and brand filter
function filterModels() {
    const searchTerm = document.getElementById('model-search').value.toLowerCase();
    const brandFilter = document.getElementById('brand-filter').value;
    
    document.querySelectorAll('.brand-section').forEach(section => {
        const brandKey = section.dataset.brand;
        const shouldShowBrand = !brandFilter || brandKey === brandFilter;
        
        if (!shouldShowBrand) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        const tbody = section.querySelector('tbody');
        let visibleCount = 0;
        
        tbody.querySelectorAll('tr').forEach(row => {
            const modelName = row.dataset.modelName;
            const matches = !searchTerm || modelName.includes(searchTerm);
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });
        
        // Auto-expand if filtered
        if (searchTerm || brandFilter) {
            const content = section.querySelector('.brand-content');
            content.classList.add('show');
            section.querySelector('.toggle-icon').textContent = '▼';
        }
    });
}

// Expand all brand sections
function expandAll() {
    document.querySelectorAll('.brand-content').forEach(content => {
        content.classList.add('show');
    });
    document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▼';
    });
}

// Collapse all brand sections
function collapseAll() {
    document.querySelectorAll('.brand-content').forEach(content => {
        content.classList.remove('show');
    });
    document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▶';
    });
}

// Save pricing changes
function savePricing() {
    const inputs = document.querySelectorAll('#pricing-editor input[type="number"]');
    
    inputs.forEach(input => {
        const brand = input.dataset.brand;
        const model = input.dataset.model;
        const service = input.dataset.service;
        const newValue = parseInt(input.value) || 0;
        
        if (pricingData[brand]?.models[model]?.services) {
            const oldValue = pricingData[brand].models[model].services[service];
            
            // Only update timestamp if the price actually changed
            if (oldValue !== newValue) {
                pricingData[brand].models[model].services[service] = newValue;
                pricingData[brand].models[model].lastUpdated = new Date().toISOString();
                console.log(`Price updated for ${model} - ${service}: ${oldValue} -> ${newValue}`);
            }
        }
    });
    
    savePricingData(pricingData);
    
    const message = document.getElementById('save-message');
    message.classList.add('show');
    setTimeout(() => message.classList.remove('show'), 3000);
    
    console.log('Pricing saved successfully');
}

// Add new model
function addNewModel() {
    const brand = document.getElementById('new-brand').value;
    const modelId = document.getElementById('new-model-id').value.trim();
    const modelName = document.getElementById('new-model-name').value.trim();
    
    if (!modelId || !modelName) {
        alert('Please fill in Model ID and Model Name');
        return;
    }
    
    if (pricingData[brand].models[modelId]) {
        alert('This model ID already exists');
        return;
    }
    
    const services = {};
    for (const serviceKey in serviceTypes) {
        const input = document.getElementById(`new-${serviceKey}`);
        if (input) {
            services[serviceKey] = parseInt(input.value) || 0;
        }
    }
    
    pricingData[brand].models[modelId] = {
        name: modelName,
        services: services,
        lastUpdated: new Date().toISOString()
    };
    
    savePricingData(pricingData);
    renderPricingEditor();
    
    // Clear form
    document.getElementById('new-model-id').value = '';
    document.getElementById('new-model-name').value = '';
    
    const message = document.getElementById('add-message');
    message.classList.add('show');
    setTimeout(() => message.classList.remove('show'), 3000);
    
    console.log('Model added:', modelId);
}

// Render service inputs for new model form
function renderNewModelServices() {
    const container = document.getElementById('new-model-services');
    container.innerHTML = '';
    
    for (const [key, service] of Object.entries(serviceTypes)) {
        const div = document.createElement('div');
        div.className = 'form-group';
        
        const isNetworkUnlock = key === 'network_unlock';
        const defaultValue = isNetworkUnlock ? 9999 : (key.includes('screen') && key !== 'screen_compatible' ? 0 : 99);
        
        div.innerHTML = `
            <label>${service.name}</label>
            <input type="number" id="new-${key}" value="${defaultValue}" ${isNetworkUnlock ? 'disabled' : ''}>
        `;
        container.appendChild(div);
    }
}

// Render brand select dropdown
function renderBrandSelect() {
    const select = document.getElementById('new-brand');
    select.innerHTML = '';
    
    for (const brandKey in pricingData) {
        const option = document.createElement('option');
        option.value = brandKey;
        option.textContent = pricingData[brandKey].name;
        select.appendChild(option);
    }
}

// Render current brands list
function renderCurrentBrands() {
    const container = document.getElementById('current-brands-list');
    container.innerHTML = '';
    
    for (const [key, brand] of Object.entries(pricingData)) {
        const modelCount = Object.keys(brand.models).length;
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f5f5f7;';
        
        const isCoreBrand = ['apple', 'samsung', 'xiaomi', 'other'].includes(key);
        div.innerHTML = `
            <div>
                <strong>${brand.name}</strong>
                <p style="font-size: 12px; color: #6e6e73; margin: 4px 0 0 0;">${modelCount} models</p>
            </div>
            <button onclick="deleteBrand('${key}')" 
                    style="color: #ff3b30; background: none; border: none; cursor: pointer; font-size: 14px; padding: 8px 16px;"
                    ${isCoreBrand ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                Delete
            </button>
        `;
        container.appendChild(div);
    }
}

// Add new brand
function addNewBrand() {
    const brandId = document.getElementById('new-brand-id').value.trim().toLowerCase();
    const brandName = document.getElementById('new-brand-name').value.trim();
    
    if (!brandId || !brandName) {
        alert('Please fill in all fields');
        return;
    }
    
    if (pricingData[brandId]) {
        alert('This brand ID already exists');
        return;
    }
    
    // Add new brand with empty models
    pricingData[brandId] = {
        name: brandName,
        models: {}
    };
    
    savePricingData(pricingData);
    renderPricingEditor();
    renderBrandSelect();
    renderCurrentBrands();
    
    // Clear form
    document.getElementById('new-brand-id').value = '';
    document.getElementById('new-brand-name').value = '';
    
    const message = document.getElementById('brand-message');
    message.classList.add('show');
    setTimeout(() => message.classList.remove('show'), 3000);
    
    console.log('Brand added:', brandId);
}

// Delete brand
function deleteBrand(brandKey) {
    const coreBrands = ['apple', 'samsung', 'xiaomi', 'other'];
    if (coreBrands.includes(brandKey)) {
        alert('Cannot delete core brands');
        return;
    }
    
    const modelCount = Object.keys(pricingData[brandKey].models).length;
    if (!confirm(`Are you sure you want to delete "${pricingData[brandKey].name}"? This will delete ${modelCount} models.`)) {
        return;
    }
    
    delete pricingData[brandKey];
    savePricingData(pricingData);
    renderPricingEditor();
    renderBrandSelect();
    renderCurrentBrands();
    
    console.log('Brand deleted:', brandKey);
}

// Edit model name
function editModelName(brandKey, modelKey) {
    const currentName = pricingData[brandKey].models[modelKey].name;
    const newName = prompt('Enter new model name:', currentName);
    
    if (newName && newName.trim() && newName !== currentName) {
        pricingData[brandKey].models[modelKey].name = newName.trim();
        pricingData[brandKey].models[modelKey].lastUpdated = new Date().toISOString();
        savePricingData(pricingData);
        
        // Update display
        document.getElementById(`model-name-${brandKey}-${modelKey}`).textContent = newName.trim();
        
        console.log('Model name updated:', modelKey, 'to', newName);
    }
}

// Render current services list
function renderCurrentServices() {
    const container = document.getElementById('current-services-list');
    container.innerHTML = '';
    
    for (const [key, service] of Object.entries(serviceTypes)) {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f5f5f7;';
        
        const isNetworkUnlock = key === 'network_unlock';
        div.innerHTML = `
            <div>
                <strong>${service.name}</strong>
                <p style="font-size: 12px; color: #6e6e73; margin: 4px 0 0 0;">${service.description}</p>
                ${isNetworkUnlock ? '<span style="font-size: 11px; color: #ff3b30;">Fixed price (contact required)</span>' : ''}
            </div>
            <button onclick="deleteService('${key}')" 
                    style="color: #ff3b30; background: none; border: none; cursor: pointer; font-size: 14px; padding: 8px 16px;"
                    ${isNetworkUnlock ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                Delete
            </button>
        `;
        container.appendChild(div);
    }
}

// Add new service type
function addNewService() {
    const serviceId = document.getElementById('new-service-id').value.trim();
    const serviceName = document.getElementById('new-service-name').value.trim();
    const serviceDesc = document.getElementById('new-service-desc').value.trim();
    
    if (!serviceId || !serviceName || !serviceDesc) {
        alert('Please fill in all fields');
        return;
    }
    
    if (serviceTypes[serviceId]) {
        alert('This service ID already exists');
        return;
    }
    
    // Add to serviceTypes
    serviceTypes[serviceId] = {
        name: serviceName,
        description: serviceDesc
    };
    
    // Add this service to all existing models with default price 9999
    for (const brand in pricingData) {
        for (const modelKey in pricingData[brand].models) {
            pricingData[brand].models[modelKey].services[serviceId] = 9999;
            pricingData[brand].models[modelKey].lastUpdated = new Date().toISOString();
        }
    }
    
    savePricingData(pricingData);
    renderPricingEditor();
    renderNewModelServices();
    renderCurrentServices();
    
    // Clear form
    document.getElementById('new-service-id').value = '';
    document.getElementById('new-service-name').value = '';
    document.getElementById('new-service-desc').value = '';
    
    const message = document.getElementById('service-message');
    message.classList.add('show');
    setTimeout(() => message.classList.remove('show'), 3000);
    
    console.log('Service type added:', serviceId);
}

// Delete service type
function deleteService(serviceKey) {
    if (serviceKey === 'network_unlock') {
        alert('Cannot delete network unlock service');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${serviceTypes[serviceKey].name}"? This will remove it from all models.`)) {
        return;
    }
    
    // Remove from serviceTypes
    delete serviceTypes[serviceKey];
    
    // Remove from all models
    for (const brand in pricingData) {
        for (const modelKey in pricingData[brand].models) {
            delete pricingData[brand].models[modelKey].services[serviceKey];
            pricingData[brand].models[modelKey].lastUpdated = new Date().toISOString();
        }
    }
    
    savePricingData(pricingData);
    renderPricingEditor();
    renderNewModelServices();
    renderCurrentServices();
    
    console.log('Service type deleted:', serviceKey);
}

// Delete model
function deleteModel(brand, modelKey) {
    if (confirm('Are you sure you want to delete this model?')) {
        delete pricingData[brand].models[modelKey];
        savePricingData(pricingData);
        renderPricingEditor();
        console.log('Model deleted:', modelKey);
    }
}

// Initialize
renderPricingEditor();
renderBrandSelect();
renderNewModelServices();
renderCurrentBrands();
renderCurrentServices();
console.log('Admin page loaded');
