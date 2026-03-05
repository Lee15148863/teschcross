// Computer Admin page functionality - uses same credentials as phone admin
const ADMIN_USERNAME_KEY = 'techcross_admin_username';
const ADMIN_PASSWORD_KEY = 'techcross_admin_password';
const ADMIN_SESSION_KEY = 'techcross_admin_session';

// Default credentials (same as phone admin)
const DEFAULT_USERNAME = '0876676466';
const DEFAULT_PASSWORD = '0870019999';

// Check if custom credentials exist, otherwise use default
function getAdminUsername() {
    return localStorage.getItem(ADMIN_USERNAME_KEY) || DEFAULT_USERNAME;
}

function getAdminPassword() {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_PASSWORD;
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

// Check authentication on page load
checkAuth();

let computerPricingData = loadComputerPricingData();

// Render pricing editor
function renderPricingEditor() {
    const editor = document.getElementById('pricing-editor');
    editor.innerHTML = '';
    
    for (const [typeKey, type] of Object.entries(computerPricingData)) {
        const typeSection = document.createElement('div');
        typeSection.className = 'type-section';
        
        const typeHeader = document.createElement('div');
        typeHeader.className = 'type-header';
        typeHeader.innerHTML = `
            <h3>${type.name}</h3>
            <span>▼</span>
        `;
        typeHeader.onclick = function() {
            typeContent.classList.toggle('show');
        };
        
        const typeContent = document.createElement('div');
        typeContent.className = 'type-content show';
        
        // Determine which services to show based on device type
        let serviceHeaders = '';
        let firstModel = Object.values(type.models)[0];
        if (firstModel) {
            for (const serviceKey of Object.keys(firstModel.services)) {
                const serviceName = computerServiceTypes[serviceKey]?.name || serviceKey;
                serviceHeaders += `<th>${serviceName}</th>`;
            }
        }
        
        const table = document.createElement('div');
        table.className = 'pricing-table';
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Model</th>
                        ${serviceHeaders}
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="tbody-${typeKey}">
                </tbody>
            </table>
        `;
        
        typeContent.appendChild(table);
        typeSection.appendChild(typeHeader);
        typeSection.appendChild(typeContent);
        editor.appendChild(typeSection);
        
        // Add model rows
        const tbody = document.getElementById(`tbody-${typeKey}`);
        for (const [modelKey, model] of Object.entries(type.models)) {
            const row = document.createElement('tr');
            let serviceCells = '';
            for (const [serviceKey, price] of Object.entries(model.services)) {
                serviceCells += `<td><input type="number" value="${price}" data-type="${typeKey}" data-model="${modelKey}" data-service="${serviceKey}"></td>`;
            }
            
            row.innerHTML = `
                <td>
                    <strong id="model-name-${typeKey}-${modelKey}">${model.name}</strong>
                    <button onclick="editModelName('${typeKey}', '${modelKey}')" 
                            style="margin-left: 8px; color: #0071e3; background: none; border: none; cursor: pointer; font-size: 12px;">
                        ✏️ Edit
                    </button>
                </td>
                ${serviceCells}
                <td><button onclick="deleteModel('${typeKey}', '${modelKey}')" style="color: #ff3b30; background: none; border: none; cursor: pointer; font-size: 14px;">Delete</button></td>
            `;
            tbody.appendChild(row);
        }
    }
}

// Save pricing changes
function savePricing() {
    const inputs = document.querySelectorAll('#pricing-editor input[type="number"]');
    
    inputs.forEach(input => {
        const type = input.dataset.type;
        const model = input.dataset.model;
        const service = input.dataset.service;
        const value = parseInt(input.value) || 0;
        
        if (computerPricingData[type]?.models[model]?.services) {
            computerPricingData[type].models[model].services[service] = value;
            // Update timestamp when price changes
            computerPricingData[type].models[model].lastUpdated = new Date().toISOString();
        }
    });
    
    saveComputerPricingData(computerPricingData);
    
    const message = document.getElementById('save-message');
    message.classList.add('show');
    setTimeout(() => message.classList.remove('show'), 3000);
    
    console.log('Computer pricing saved successfully');
}

// Delete model
function deleteModel(type, modelKey) {
    if (confirm('Are you sure you want to delete this model?')) {
        delete computerPricingData[type].models[modelKey];
        saveComputerPricingData(computerPricingData);
        renderPricingEditor();
        console.log('Model deleted:', modelKey);
    }
}

// Initialize
renderPricingEditor();
console.log('Computer admin page loaded');


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

// Render service inputs for new model form
function renderNewModelServices() {
    const container = document.getElementById('new-model-services');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [key, service] of Object.entries(computerServiceTypes)) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label>${service.name}</label>
            <input type="number" id="new-${key}" value="99">
        `;
        container.appendChild(div);
    }
}

// Render current services list
function renderCurrentServices() {
    const container = document.getElementById('current-services-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [key, service] of Object.entries(computerServiceTypes)) {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f5f5f7;';
        
        const isDiagnostic = key === 'diagnostic';
        div.innerHTML = `
            <div>
                <strong>${service.name}</strong>
                <p style="font-size: 12px; color: #6e6e73; margin: 4px 0 0 0;">${service.description}</p>
            </div>
            <button onclick="deleteService('${key}')" 
                    style="color: #ff3b30; background: none; border: none; cursor: pointer; font-size: 14px; padding: 8px 16px;"
                    ${isDiagnostic ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                Delete
            </button>
        `;
        container.appendChild(div);
    }
}

// Add new model
function addNewModel() {
    const type = document.getElementById('new-type').value;
    const modelId = document.getElementById('new-model-id').value.trim();
    const modelName = document.getElementById('new-model-name').value.trim();
    
    if (!modelId || !modelName) {
        alert('Please fill in Model ID and Model Name');
        return;
    }
    
    if (computerPricingData[type].models[modelId]) {
        alert('This model ID already exists');
        return;
    }
    
    const services = {};
    for (const serviceKey in computerServiceTypes) {
        const input = document.getElementById(`new-${serviceKey}`);
        if (input) {
            services[serviceKey] = parseInt(input.value) || 0;
        }
    }
    
    computerPricingData[type].models[modelId] = {
        name: modelName,
        services: services,
        lastUpdated: new Date().toISOString()
    };
    
    saveComputerPricingData(computerPricingData);
    renderPricingEditor();
    
    // Clear form
    document.getElementById('new-model-id').value = '';
    document.getElementById('new-model-name').value = '';
    
    const message = document.getElementById('add-message');
    message.classList.add('show');
    setTimeout(() => message.classList.remove('show'), 3000);
    
    console.log('Model added:', modelId);
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
    
    if (computerServiceTypes[serviceId]) {
        alert('This service ID already exists');
        return;
    }
    
    // Add to computerServiceTypes
    computerServiceTypes[serviceId] = {
        name: serviceName,
        description: serviceDesc
    };
    
    // Add this service to all existing models with default price 9999
    for (const type in computerPricingData) {
        for (const modelKey in computerPricingData[type].models) {
            computerPricingData[type].models[modelKey].services[serviceId] = 9999;
            computerPricingData[type].models[modelKey].lastUpdated = new Date().toISOString();
        }
    }
    
    saveComputerPricingData(computerPricingData);
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
    if (serviceKey === 'diagnostic') {
        alert('Cannot delete diagnostic service');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${computerServiceTypes[serviceKey].name}"? This will remove it from all models.`)) {
        return;
    }
    
    // Remove from computerServiceTypes
    delete computerServiceTypes[serviceKey];
    
    // Remove from all models
    for (const type in computerPricingData) {
        for (const modelKey in computerPricingData[type].models) {
            delete computerPricingData[type].models[modelKey].services[serviceKey];
            computerPricingData[type].models[modelKey].lastUpdated = new Date().toISOString();
        }
    }
    
    saveComputerPricingData(computerPricingData);
    renderPricingEditor();
    renderNewModelServices();
    renderCurrentServices();
    
    console.log('Service type deleted:', serviceKey);
}

// Initialize new functions
renderTypeSelect();
renderNewModelServices();
renderCurrentTypes();
renderCurrentServices();


// Render type select dropdown
function renderTypeSelect() {
    const select = document.getElementById('new-type');
    if (!select) return;
    
    select.innerHTML = '';
    
    for (const typeKey in computerPricingData) {
        const option = document.createElement('option');
        option.value = typeKey;
        option.textContent = computerPricingData[typeKey].name;
        select.appendChild(option);
    }
}

// Render current types list
function renderCurrentTypes() {
    const container = document.getElementById('current-types-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [key, type] of Object.entries(computerPricingData)) {
        const modelCount = Object.keys(type.models).length;
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f5f5f7;';
        
        const isCoreType = ['laptop', 'console'].includes(key);
        div.innerHTML = `
            <div>
                <strong>${type.name}</strong>
                <p style="font-size: 12px; color: #6e6e73; margin: 4px 0 0 0;">${modelCount} models</p>
            </div>
            <button onclick="deleteType('${key}')" 
                    style="color: #ff3b30; background: none; border: none; cursor: pointer; font-size: 14px; padding: 8px 16px;"
                    ${isCoreType ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                Delete
            </button>
        `;
        container.appendChild(div);
    }
}

// Add new type
function addNewType() {
    const typeId = document.getElementById('new-type-id').value.trim().toLowerCase();
    const typeName = document.getElementById('new-type-name').value.trim();
    
    if (!typeId || !typeName) {
        alert('Please fill in all fields');
        return;
    }
    
    if (computerPricingData[typeId]) {
        alert('This type ID already exists');
        return;
    }
    
    // Add new type with empty models
    computerPricingData[typeId] = {
        name: typeName,
        models: {}
    };
    
    saveComputerPricingData(computerPricingData);
    renderPricingEditor();
    renderTypeSelect();
    renderCurrentTypes();
    
    // Clear form
    document.getElementById('new-type-id').value = '';
    document.getElementById('new-type-name').value = '';
    
    const message = document.getElementById('type-message');
    message.classList.add('show');
    setTimeout(() => message.classList.remove('show'), 3000);
    
    console.log('Type added:', typeId);
}

// Delete type
function deleteType(typeKey) {
    const coreTypes = ['laptop', 'console'];
    if (coreTypes.includes(typeKey)) {
        alert('Cannot delete core types');
        return;
    }
    
    const modelCount = Object.keys(computerPricingData[typeKey].models).length;
    if (!confirm(`Are you sure you want to delete "${computerPricingData[typeKey].name}"? This will delete ${modelCount} models.`)) {
        return;
    }
    
    delete computerPricingData[typeKey];
    saveComputerPricingData(computerPricingData);
    renderPricingEditor();
    renderTypeSelect();
    renderCurrentTypes();
    
    console.log('Type deleted:', typeKey);
}


// Edit model name
function editModelName(typeKey, modelKey) {
    const currentName = computerPricingData[typeKey].models[modelKey].name;
    const newName = prompt('Enter new model name:', currentName);
    
    if (newName && newName.trim() && newName !== currentName) {
        computerPricingData[typeKey].models[modelKey].name = newName.trim();
        computerPricingData[typeKey].models[modelKey].lastUpdated = new Date().toISOString();
        saveComputerPricingData(computerPricingData);
        
        // Update display
        document.getElementById(`model-name-${typeKey}-${modelKey}`).textContent = newName.trim();
        
        console.log('Model name updated:', modelKey, 'to', newName);
    }
}
