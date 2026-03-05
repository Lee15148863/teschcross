// Admin page functionality
const ADMIN_USERNAME_KEY = 'techcross_admin_username';
const ADMIN_PASSWORD_KEY = 'techcross_admin_password';
const ADMIN_SESSION_KEY = 'techcross_admin_session';

// Default credentials (can be changed)
const DEFAULT_USERNAME = '0876676466';
const DEFAULT_PASSWORD = '0876676466';

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
    
    for (const [brandKey, brand] of Object.entries(pricingData)) {
        const brandSection = document.createElement('div');
        brandSection.className = 'brand-section';
        
        const brandHeader = document.createElement('div');
        brandHeader.className = 'brand-header';
        brandHeader.innerHTML = `
            <h3>${brand.name}</h3>
            <span>▼</span>
        `;
        brandHeader.onclick = function() {
            brandContent.classList.toggle('show');
        };
        
        const brandContent = document.createElement('div');
        brandContent.className = 'brand-content show';
        
        const table = document.createElement('div');
        table.className = 'pricing-table';
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Screen</th>
                        <th>Battery</th>
                        <th>Water/Board</th>
                        <th>Diagnostic</th>
                        <th>Charging</th>
                        <th>Camera</th>
                        <th>Action</th>
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
            row.innerHTML = `
                <td><strong>${model.name}</strong></td>
                <td><input type="number" value="${model.services.screen}" data-brand="${brandKey}" data-model="${modelKey}" data-service="screen"></td>
                <td><input type="number" value="${model.services.battery}" data-brand="${brandKey}" data-model="${modelKey}" data-service="battery"></td>
                <td><input type="number" value="${model.services.water}" data-brand="${brandKey}" data-model="${modelKey}" data-service="water" disabled style="background: #f5f5f7; cursor: not-allowed;"></td>
                <td><input type="number" value="${model.services.diagnostic}" data-brand="${brandKey}" data-model="${modelKey}" data-service="diagnostic"></td>
                <td><input type="number" value="${model.services.charging}" data-brand="${brandKey}" data-model="${modelKey}" data-service="charging"></td>
                <td><input type="number" value="${model.services.camera}" data-brand="${brandKey}" data-model="${modelKey}" data-service="camera"></td>
                <td><button onclick="deleteModel('${brandKey}', '${modelKey}')" style="color: #ff3b30; background: none; border: none; cursor: pointer; font-size: 14px;">Delete</button></td>
            `;
            tbody.appendChild(row);
        }
    }
}

// Save pricing changes
function savePricing() {
    const inputs = document.querySelectorAll('#pricing-editor input[type="number"]');
    
    inputs.forEach(input => {
        const brand = input.dataset.brand;
        const model = input.dataset.model;
        const service = input.dataset.service;
        const value = parseInt(input.value) || 0;
        
        if (pricingData[brand]?.models[model]?.services) {
            pricingData[brand].models[model].services[service] = value;
            // Update timestamp when price changes
            pricingData[brand].models[model].lastUpdated = new Date().toISOString();
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
    
    const services = {
        screen: parseInt(document.getElementById('new-screen').value) || 0,
        battery: parseInt(document.getElementById('new-battery').value) || 0,
        water: parseInt(document.getElementById('new-water').value) || 0,
        diagnostic: parseInt(document.getElementById('new-diagnostic').value) || 0,
        charging: parseInt(document.getElementById('new-charging').value) || 0,
        camera: parseInt(document.getElementById('new-camera').value) || 0
    };
    
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
console.log('Admin page loaded');
