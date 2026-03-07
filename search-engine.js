// Advanced Search Engine with Autocomplete and Instant Results
class SearchEngine {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.modalSearchInput = document.getElementById('modalSearchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.mobileSearchBtn = document.getElementById('mobileSearchBtn');
        this.searchModal = document.getElementById('searchModal');
        this.searchResults = document.getElementById('searchResults');
        this.searchDropdown = document.getElementById('searchDropdown');
        
        this.selectedIndex = -1;
        this.searchHistory = this.loadSearchHistory();
        this.debounceTimer = null;
        this.cache = new Map();
        
        this.init();
    }
    
    init() {
        // Event listeners
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleInput(e));
            this.searchInput.addEventListener('focus', () => this.showDropdown());
            this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
            this.searchInput.addEventListener('blur', () => {
                setTimeout(() => this.hideDropdown(), 200);
            });
        }
        
        if (this.modalSearchInput) {
            this.modalSearchInput.addEventListener('input', (e) => this.handleModalInput(e));
            this.modalSearchInput.addEventListener('keydown', (e) => this.handleModalKeydown(e));
        }
        
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.openModal());
        }
        
        if (this.mobileSearchBtn) {
            this.mobileSearchBtn.addEventListener('click', () => this.openModal());
        }
        
        // Click outside to close
        if (this.searchModal) {
            this.searchModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('search-modal-overlay') || e.target === this.searchModal) {
                    this.closeModal();
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openModal();
            }
            
            // ESC to close
            if (e.key === 'Escape' && this.searchModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }
    
    // Normalize text for better matching
    normalize(text) {
        return text.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^\w\u4e00-\u9fa5]/g, '');
    }
    
    // Highlight matching text
    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query.split('').join('.*?')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    // Fuzzy search algorithm
    fuzzyMatch(text, query) {
        const normalizedText = this.normalize(text);
        const normalizedQuery = this.normalize(query);
        
        // Direct match
        if (normalizedText.includes(normalizedQuery)) {
            return { match: true, score: 100 };
        }
        
        // Word-by-word match
        const textWords = text.toLowerCase().split(/\s+/);
        const queryWords = query.toLowerCase().split(/\s+/);
        
        let matchCount = 0;
        for (const qWord of queryWords) {
            for (const tWord of textWords) {
                if (tWord.includes(qWord) || qWord.includes(tWord)) {
                    matchCount++;
                    break;
                }
            }
        }
        
        if (matchCount > 0) {
            return { match: true, score: (matchCount / queryWords.length) * 80 };
        }
        
        // Number matching (for iPhone 11, etc.)
        const queryNum = query.match(/\d+/);
        const textNum = text.match(/\d+/);
        if (queryNum && textNum && queryNum[0] === textNum[0]) {
            return { match: true, score: 60 };
        }
        
        return { match: false, score: 0 };
    }
    
    // Search all data
    search(query) {
        if (!query || query.length < 2) {
            return [];
        }
        
        // Check cache
        const cacheKey = query.toLowerCase();
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const results = [];
        
        try {
            // Get all search data
            const allData = typeof getAllSearchData === 'function' ? getAllSearchData() : [];
            
            allData.forEach(item => {
                const nameMatch = this.fuzzyMatch(item.name, query);
                const categoryMatch = item.category ? this.fuzzyMatch(item.category, query) : { match: false, score: 0 };
                const brandMatch = item.brand ? this.fuzzyMatch(item.brand, query) : { match: false, score: 0 };
                const typeMatch = item.type ? this.fuzzyMatch(item.type, query) : { match: false, score: 0 };
                
                if (nameMatch.match || categoryMatch.match || brandMatch.match || typeMatch.match) {
                    results.push({
                        name: item.name,
                        brand: item.brand || item.category,
                        type: item.type || item.category,
                        icon: item.icon,
                        price: item.price,
                        services: item.services,
                        link: item.link,
                        category: item.category.toLowerCase().includes('phone') ? 'phone' : 'other',
                        score: Math.max(nameMatch.score, categoryMatch.score, brandMatch.score, typeMatch.score)
                    });
                }
            });
        } catch (error) {
            console.error('Search error:', error);
        }
        
        // Sort by score
        results.sort((a, b) => b.score - a.score);
        
        // Limit results
        const limitedResults = results.slice(0, 10);
        
        // Cache results
        this.cache.set(cacheKey, limitedResults);
        
        return limitedResults;
    }
    
    // Handle input with debounce
    handleInput(e) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                this.showAutocomplete(query);
            } else {
                this.hideDropdown();
            }
        }, 150);
    }
    
    // Show autocomplete dropdown
    showAutocomplete(query) {
        const results = this.search(query);
        
        if (results.length === 0) {
            this.searchDropdown.innerHTML = `
                <div class="search-dropdown-empty">
                    <p>No results found</p>
                    <small>Try "iPhone", "MacBook", "Samsung", "PS5"</small>
                </div>
            `;
            this.searchDropdown.classList.add('active');
            return;
        }
        
        let html = '<div class="search-dropdown-section">';
        html += '<div class="search-dropdown-title">Devices</div>';
        
        results.slice(0, 5).forEach((result, index) => {
            const highlightedName = this.highlightMatch(result.name, query);
            html += `
                <div class="search-dropdown-item" data-index="${index}" data-link="${result.link}">
                    <div class="search-dropdown-icon">${result.icon}</div>
                    <div class="search-dropdown-info">
                        <div class="search-dropdown-name">${highlightedName}</div>
                        <div class="search-dropdown-meta">${result.type}</div>
                    </div>
                    <div class="search-dropdown-badge">View</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        this.searchDropdown.innerHTML = html;
        this.searchDropdown.classList.add('active');
        this.selectedIndex = -1;
        
        // Add click handlers
        this.searchDropdown.querySelectorAll('.search-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const link = item.getAttribute('data-link');
                window.location.href = link;
            });
        });
    }
    
    // Handle modal input
    handleModalInput(e) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            this.showModalResults(query);
        }, 200);
    }
    
    // Show modal results
    showModalResults(query) {
        if (!query || query.length < 2) {
            this.searchResults.innerHTML = `
                <div class="search-no-results">
                    <p>Start typing to search</p>
                    <small>Try searching for "iPhone 11", "MacBook", "PS5", "Xbox", "Switch"</small>
                </div>
            `;
            return;
        }
        
        const results = this.search(query);
        
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-no-results">
                    <p>No results found for "${query}"</p>
                    <small>Try different keywords like device model or brand name</small>
                </div>
            `;
            return;
        }
        
        // Save to history
        this.addToHistory(query);
        
        let html = `<div style="margin-bottom: 16px; padding: 0 12px; color: #86868b; font-size: 13px;">Found ${results.length} result${results.length > 1 ? 's' : ''}</div>`;
        
        results.forEach((result, index) => {
            const highlightedName = this.highlightMatch(result.name, query);
            
            // For phone/tablet with services
            if (result.services && Object.keys(result.services).length > 0) {
                const services = result.services;
                const serviceKeys = Object.keys(services);
                
                const servicesList = serviceKeys.map(serviceKey => {
                    let serviceName = '';
                    let price = services[serviceKey];
                    
                    serviceName = (typeof serviceTypes !== 'undefined' && serviceTypes[serviceKey]) 
                        ? serviceTypes[serviceKey].name 
                        : serviceKey.charAt(0).toUpperCase() + serviceKey.slice(1);
                    
                    if (serviceKey === 'water') {
                        price = 'Contact Us';
                    } else if (price === 0) {
                        price = 'Free';
                    } else {
                        price = `€${price}`;
                    }
                    
                    return `
                        <div class="search-result-service">
                            <span class="service-name">${serviceName}</span>
                            <span class="service-price">${price}</span>
                        </div>
                    `;
                }).join('');
                
                html += `
                    <div class="search-result-item" data-index="${index}" data-link="${result.link}">
                        <h3>
                            <span class="device-type">${result.icon} ${result.type}</span>
                            <span>${highlightedName}</span>
                        </h3>
                        <div class="search-result-services">
                            ${servicesList}
                        </div>
                        <a href="${result.link}" class="search-result-link">View pricing page →</a>
                    </div>
                `;
            } else {
                // For computer/console services with direct price
                html += `
                    <div class="search-result-item" data-index="${index}" data-link="${result.link}">
                        <h3>
                            <span class="device-type">${result.icon} ${result.type}</span>
                            <span>${highlightedName}</span>
                        </h3>
                        <div class="search-result-services">
                            <div class="search-result-service">
                                <span class="service-name">${result.brand || result.type}</span>
                                <span class="service-price">${result.price || 'See pricing'}</span>
                            </div>
                        </div>
                        <a href="${result.link}" class="search-result-link">View pricing page →</a>
                    </div>
                `;
            }
        });
        
        this.searchResults.innerHTML = html;
        this.selectedIndex = -1;
        
        // Add click handlers
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('search-result-link')) {
                    const link = item.getAttribute('data-link');
                    window.location.href = link;
                }
            });
        });
    }
    
    // Keyboard navigation
    handleKeydown(e) {
        const items = this.searchDropdown.querySelectorAll('.search-dropdown-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
            this.updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
            this.updateSelection(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                items[this.selectedIndex].click();
            } else {
                this.openModal();
            }
        } else if (e.key === 'Escape') {
            this.hideDropdown();
            this.searchInput.blur();
        }
    }
    
    handleModalKeydown(e) {
        const items = this.searchResults.querySelectorAll('.search-result-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
            this.updateModalSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
            this.updateModalSelection(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                const link = items[this.selectedIndex].getAttribute('data-link');
                window.location.href = link;
            }
        }
    }
    
    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    updateModalSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    showDropdown() {
        if (this.searchInput.value.trim().length >= 2) {
            this.searchDropdown.classList.add('active');
        }
    }
    
    hideDropdown() {
        this.searchDropdown.classList.remove('active');
    }
    
    openModal() {
        this.searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            this.modalSearchInput.focus();
            if (this.searchInput.value) {
                this.modalSearchInput.value = this.searchInput.value;
                this.showModalResults(this.searchInput.value);
            }
        }, 100);
    }
    
    closeModal() {
        this.searchModal.classList.remove('active');
        document.body.style.overflow = '';
        this.modalSearchInput.value = '';
        this.searchResults.innerHTML = '';
        this.selectedIndex = -1;
    }
    
    // Search history
    loadSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('search_history') || '[]');
        } catch {
            return [];
        }
    }
    
    addToHistory(query) {
        if (!query) return;
        
        this.searchHistory = this.searchHistory.filter(q => q !== query);
        this.searchHistory.unshift(query);
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
    }
}

// Initialize search engine when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.searchEngine = new SearchEngine();
    });
} else {
    window.searchEngine = new SearchEngine();
}
