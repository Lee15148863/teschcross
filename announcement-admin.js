// Announcement Admin Management
const ADMIN_CREDENTIALS = {
    username: '0876676466',
    password: '0870019999'
};

const STORAGE_KEY = 'techcross_announcement';

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, checking login status...');
    const isLoggedIn = sessionStorage.getItem('announcement_admin_logged_in');
    if (isLoggedIn === 'true') {
        console.log('Already logged in');
        showManagementSection();
        loadAnnouncementData();
    }
    
    // Setup real-time preview listeners
    setupPreviewListeners();
});

// Login function
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    console.log('Login attempt:');
    console.log('  Username:', username);
    console.log('  Password:', password);
    console.log('  Expected username:', ADMIN_CREDENTIALS.username);
    console.log('  Expected password:', ADMIN_CREDENTIALS.password);
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        console.log('✅ Login successful!');
        sessionStorage.setItem('announcement_admin_logged_in', 'true');
        showManagementSection();
        loadAnnouncementData();
        showMessage('Login successful!', 'success');
    } else {
        console.log('❌ Login failed!');
        showMessage('Invalid username or password', 'error');
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem('announcement_admin_logged_in');
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('managementSection').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showMessage('Logged out successfully', 'success');
}

// Show management section
function showManagementSection() {
    console.log('Showing management section...');
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('managementSection').style.display = 'block';
}

// Load announcement data
function loadAnnouncementData() {
    console.log('Loading announcement data...');
    const data = getAnnouncementData();
    
    document.getElementById('announcementEnabled').checked = data.enabled;
    document.getElementById('announcementTextEn').value = data.textEn;
    document.getElementById('announcementTextGa').value = data.textGa;
    document.getElementById('fontSize').value = data.fontSize;
    document.getElementById('fontWeight').value = data.fontWeight;
    document.getElementById('textColor').value = data.textColor;
    document.getElementById('textColorHex').value = data.textColor;
    document.getElementById('bgColor').value = data.bgColor;
    document.getElementById('bgColorHex').value = data.bgColor;
    document.getElementById('scrollSpeed').value = data.scrollSpeed;
    document.getElementById('speedValue').textContent = data.scrollSpeed;
    
    updatePreview();
}

// Get announcement data from localStorage
function getAnnouncementData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error loading announcement data:', e);
        }
    }
    
    // Default values
    return {
        enabled: false,
        textEn: 'Welcome to Tech Cross Repair Centre! Professional repair services for all your devices.',
        textGa: 'Fáilte go Tech Cross! Seirbhísí deisiúcháin ghairmiúla do do ghléasanna go léir.',
        fontSize: 15,
        fontWeight: '500',
        textColor: '#D4E157',
        bgColor: '#000000',
        scrollSpeed: 20
    };
}

// Save announcement
function saveAnnouncement() {
    const data = {
        enabled: document.getElementById('announcementEnabled').checked,
        textEn: document.getElementById('announcementTextEn').value,
        textGa: document.getElementById('announcementTextGa').value,
        fontSize: parseInt(document.getElementById('fontSize').value),
        fontWeight: document.getElementById('fontWeight').value,
        textColor: document.getElementById('textColor').value,
        bgColor: document.getElementById('bgColor').value,
        scrollSpeed: parseInt(document.getElementById('scrollSpeed').value)
    };
    
    console.log('Saving announcement:', data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showMessage('Announcement settings saved successfully!', 'success');
    
    // Trigger update on main page if it's open
    window.dispatchEvent(new Event('announcementUpdated'));
}

// Setup preview listeners
function setupPreviewListeners() {
    // Text inputs
    const textEnInput = document.getElementById('announcementTextEn');
    const textGaInput = document.getElementById('announcementTextGa');
    if (textEnInput) textEnInput.addEventListener('input', updatePreview);
    if (textGaInput) textGaInput.addEventListener('input', updatePreview);
    
    // Font size
    const fontSizeInput = document.getElementById('fontSize');
    if (fontSizeInput) fontSizeInput.addEventListener('input', updatePreview);
    
    // Font weight
    const fontWeightSelect = document.getElementById('fontWeight');
    if (fontWeightSelect) fontWeightSelect.addEventListener('change', updatePreview);
    
    // Text color
    const textColorInput = document.getElementById('textColor');
    const textColorHexInput = document.getElementById('textColorHex');
    if (textColorInput) {
        textColorInput.addEventListener('input', (e) => {
            textColorHexInput.value = e.target.value;
            updatePreview();
        });
    }
    if (textColorHexInput) {
        textColorHexInput.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                textColorInput.value = color;
                updatePreview();
            }
        });
    }
    
    // Background color
    const bgColorInput = document.getElementById('bgColor');
    const bgColorHexInput = document.getElementById('bgColorHex');
    if (bgColorInput) {
        bgColorInput.addEventListener('input', (e) => {
            bgColorHexInput.value = e.target.value;
            updatePreview();
        });
    }
    if (bgColorHexInput) {
        bgColorHexInput.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                bgColorInput.value = color;
                updatePreview();
            }
        });
    }
    
    // Scroll speed
    const scrollSpeedInput = document.getElementById('scrollSpeed');
    const speedValueSpan = document.getElementById('speedValue');
    if (scrollSpeedInput && speedValueSpan) {
        scrollSpeedInput.addEventListener('input', (e) => {
            speedValueSpan.textContent = e.target.value;
            updatePreview();
        });
    }
}

// Update preview
function updatePreview() {
    const textEn = document.getElementById('announcementTextEn')?.value || 'Your announcement will appear here...';
    const fontSize = document.getElementById('fontSize')?.value || 15;
    const fontWeight = document.getElementById('fontWeight')?.value || '500';
    const textColor = document.getElementById('textColor')?.value || '#D4E157';
    const bgColor = document.getElementById('bgColor')?.value || '#000000';
    const scrollSpeed = document.getElementById('scrollSpeed')?.value || 20;
    
    const previewBanner = document.getElementById('previewBanner');
    const previewText = document.getElementById('previewText');
    
    if (previewBanner && previewText) {
        previewBanner.style.backgroundColor = bgColor;
        previewText.style.color = textColor;
        previewText.style.fontSize = fontSize + 'px';
        previewText.style.fontWeight = fontWeight;
        previewText.style.animationDuration = scrollSpeed + 's';
        previewText.textContent = textEn;
    }
}

// Show message
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.innerHTML = `<div class="message ${type}">${text}</div>`;
        
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }
}

// Enter key to login
document.addEventListener('keypress', (e) => {
    const loginSection = document.getElementById('loginSection');
    if (e.key === 'Enter' && loginSection && loginSection.style.display !== 'none') {
        login();
    }
});

console.log('announcement-admin.js loaded successfully');
console.log('Admin credentials:', ADMIN_CREDENTIALS);
