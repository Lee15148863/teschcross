// Language toggle functionality
let currentLang = 'en';
const langBtn = document.getElementById('langBtn');

langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ga' : 'en';
    updateLanguage();
    
    // Add animation
    langBtn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        langBtn.style.transform = 'scale(1)';
    }, 150);
});

function updateLanguage() {
    const elements = document.querySelectorAll('[data-en]');
    
    elements.forEach(element => {
        const text = element.getAttribute(`data-${currentLang}`);
        
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = element.getAttribute(`data-placeholder-${currentLang}`);
        } else {
            element.innerHTML = text;
        }
    });
    
    // Update lang button text
    const langText = langBtn.querySelector('span');
    langText.textContent = currentLang === 'en' ? 'GA' : 'EN';
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
    
    // Save preference
    localStorage.setItem('preferredLang', currentLang);
}

// Load saved language preference
window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLang');
    if (savedLang && savedLang !== currentLang) {
        currentLang = savedLang;
        updateLanguage();
    }
});

// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const navList = document.querySelector('.nav-list');

navToggle.addEventListener('click', () => {
    navList.classList.toggle('active');
    
    // Hamburger menu animation
    const spans = navToggle.querySelectorAll('span');
    if (navList.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
        spans[1].style.opacity = '0';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
    }
});

// Click navigation links to close menu
document.querySelectorAll('.nav-list a').forEach(link => {
    link.addEventListener('click', () => {
        navList.classList.remove('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
    });
});

// Carousel functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.dot');
const totalSlides = slides.length;
let autoplayInterval;

function showSlide(index) {
    // Remove active class from all slides and dots
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Add active class to current slide and dot
    slides[index].classList.add('active');
    dots[index].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

function stopAutoplay() {
    clearInterval(autoplayInterval);
}

// Dot click handlers
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
        stopAutoplay();
        startAutoplay(); // Restart autoplay after manual change
    });
});

// Start autoplay on page load
startAutoplay();

// Pause autoplay when user hovers over carousel
const carousel = document.querySelector('.carousel');
carousel.addEventListener('mouseenter', stopAutoplay);
carousel.addEventListener('mouseleave', startAutoplay);

// Form submission handling
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('form-message');

console.log('=== Tech Cross Website ===');
console.log('Version: 1.0.0');
console.log('Build Date:', new Date().toISOString());
console.log('Form initialized');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('Form submission started');
    
    const button = contactForm.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    const sendingText = currentLang === 'en' ? 'Sending...' : 'Ag seoladh...';
    const successText = currentLang === 'en' ? 'Message sent successfully!' : 'Teachtaireacht seolta go rathúil!';
    const errorText = currentLang === 'en' ? 'Failed to send. Please try again.' : 'Theip ar sheoladh. Bain triail eile as.';
    
    button.textContent = sendingText;
    button.disabled = true;
    formMessage.style.display = 'none';
    
    try {
        const formData = new FormData(contactForm);
        
        // Log form data
        console.log('Form data:');
        for (let [key, value] of formData.entries()) {
            if (key !== 'access_key') {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        console.log('Sending request to Web3Forms API...');
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            console.log('Form submitted successfully!');
            formMessage.textContent = successText;
            formMessage.style.background = '#d4edda';
            formMessage.style.color = '#155724';
            formMessage.style.border = '1px solid #c3e6cb';
            formMessage.style.display = 'block';
            contactForm.reset();
        } else {
            console.error('Form submission failed:', data.message || 'Unknown error');
            throw new Error('Form submission failed');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        formMessage.textContent = errorText;
        formMessage.style.background = '#f8d7da';
        formMessage.style.color = '#721c24';
        formMessage.style.border = '1px solid #f5c6cb';
        formMessage.style.display = 'block';
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
});

// Announcement Banner Management
function loadAnnouncement() {
    const STORAGE_KEY = 'techcross_announcement';
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) return;
    
    try {
        const data = JSON.parse(stored);
        
        if (!data.enabled) {
            document.getElementById('announcementBanner').style.display = 'none';
            return;
        }
        
        const banner = document.getElementById('announcementBanner');
        const textElement = document.getElementById('announcementText');
        
        // Get text based on current language
        const text = currentLang === 'en' ? data.textEn : data.textGa;
        
        // Apply styles
        banner.style.backgroundColor = data.bgColor || '#000000';
        banner.style.display = 'block';
        
        textElement.textContent = text;
        textElement.style.color = data.textColor || '#D4E157';
        textElement.style.fontSize = (data.fontSize || 15) + 'px';
        textElement.style.fontWeight = data.fontWeight || '500';
        textElement.style.animationDuration = (data.scrollSpeed || 20) + 's';
        
    } catch (e) {
        console.error('Error loading announcement:', e);
    }
}

// Update announcement when language changes
const originalUpdateLanguage = updateLanguage;
updateLanguage = function() {
    originalUpdateLanguage();
    loadAnnouncement();
};

// Listen for announcement updates
window.addEventListener('announcementUpdated', loadAnnouncement);
window.addEventListener('storage', (e) => {
    if (e.key === 'techcross_announcement') {
        loadAnnouncement();
    }
});

// Load announcement on page load
loadAnnouncement();

// Hidden admin entrance (double-click logo)
function openAnnouncementAdmin() {
    window.location.href = 'announcement-admin.html';
}
