// Computer Admin page functionality - uses same credentials as phone admin
const ADMIN_USERNAME_KEY = 'techcross_admin_username';
const ADMIN_PASSWORD_KEY = 'techcross_admin_password';
const ADMIN_SESSION_KEY = 'techcross_admin_session';

// Default credentials (same as phone admin)
const DEFAULT_USERNAME = '0876676466';
const DEFAULT_PASSWORD = '0876676466';

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
                <td><strong>${model.name}</strong></td>
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
