// PWA Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    const swPath = '/sobatfarmasiadhyatma/sw.js';
    
    navigator.serviceWorker.register(swPath)
      .then(function(registration) {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch(function(error) {
        console.log('❌ Service Worker failed:', error);
        // Fallback: coba relative path
        navigator.serviceWorker.register('./sw.js')
          .then(function(registration) {
            console.log('✅ Service Worker registered with relative path');
          })
          .catch(function(error2) {
            console.log('❌ Service Worker completely failed');
          });
      });
  });
}

// App Configuration
const CONFIG = {
    internalPassword: "12345",
    adminPassword: "admin123",
    version: "1.3.3"
};

// Global State
let appState = {
    isAdmin: false,
    editMode: false,
    currentSection: 'external', // Default langsung ke external
    isInternalLoggedIn: false
};

// Global modal instances
let passwordModal, adminLoginModal, adminModal;

// Main App Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Initializing App');
    initializeApp();
});

function initializeApp() {
    console.log('🔄 Initializing app...');
    
    // Initialize Bootstrap Modals
    try {
        passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
        adminLoginModal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
        adminModal = new bootstrap.Modal(document.getElementById('adminModal'));
        console.log('✅ Modals initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing modals:', error);
        return;
    }

    // Hide splash screen setelah 2.5 detik
    setTimeout(() => {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                console.log('🎉 Splash screen hidden');
            }, 500);
        }
    }, 2500);

    // Initialize link cards
    initLinkCards();

    // Setup event listeners
    setupEventListeners();

    // Setup install prompt
    setupInstallPrompt();

    // Initialize admin controls
    updateAdminControls();
    
    // Load any custom links from localStorage
    loadCustomLinks('external');
    loadCustomLinks('internal');

    // Show external content by default (tanpa tombol)
    showSection('external');

    console.log('✅ App initialized successfully');
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Tombol Internal di header
    const internalAccessBtn = document.getElementById('internalAccessBtn');
    const adminAccessBtn = document.getElementById('adminAccessBtn');
    const adminBtn = document.getElementById('adminBtn');

    if (internalAccessBtn) {
        internalAccessBtn.addEventListener('click', () => {
            console.log('🔐 Internal access button clicked');
            showPasswordModal();
        });
    } else {
        console.error('❌ Internal access button not found');
    }

    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', () => {
            console.log('⚙️ Admin access button clicked');
            showAdminLoginModal();
        });
    }

    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            console.log('👨‍💼 Admin button clicked');
            adminModal.show();
        });
    }

    // Password submit handlers
    const passwordSubmit = document.getElementById('passwordSubmit');
    const adminPasswordSubmit = document.getElementById('adminPasswordSubmit');

    if (passwordSubmit) {
        passwordSubmit.addEventListener('click', () => checkPassword());
    }

    if (adminPasswordSubmit) {
        adminPasswordSubmit.addEventListener('click', () => checkAdminPassword());
    }

    const logoutAdminBtn = document.getElementById('logoutAdminBtn');
        if (logoutAdminBtn) {
        logoutAdminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚪 Logout admin button clicked!');
            logoutAdmin();
        });
            console.log('✅ Logout admin event listener attached');
        } else {
            console.log('⚠️ Logout admin button not found during setup');
        }

    // Enter key support
    const passwordInput = document.getElementById('passwordInput');
    const adminPasswordInput = document.getElementById('adminPasswordInput');

    if (passwordInput) {
        passwordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }

    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') checkAdminPassword();
        });
    }

    // Back buttons (untuk internal content)
    const backFromInternal = document.getElementById('backFromInternal');

    if (backFromInternal) {
        backFromInternal.addEventListener('click', () => {
            hideSection('internal');
            appState.isInternalLoggedIn = false;
            // Kembali ke external content
            showSection('external');
        });
    }

    // Admin functionality
    const addExternalLink = document.getElementById('addExternalLink');
    const addInternalLink = document.getElementById('addInternalLink');
    const saveLink = document.getElementById('saveLink');

    if (addExternalLink) {
        addExternalLink.addEventListener('click', () => {
            adminModal.show();
            document.getElementById('linkSection').value = 'external';
        });
    }

    if (addInternalLink) {
        addInternalLink.addEventListener('click', () => {
            adminModal.show();
            document.getElementById('linkSection').value = 'internal';
        });
    }

    if (saveLink) {
        saveLink.addEventListener('click', saveNewLink);
    }

    // Search functionality
    setupSearchFunctionality();

    // Header search functionality
    setupHeaderSearch();

    console.log('✅ Event listeners setup complete');
}

// Function untuk logout admin
function logoutAdmin() {
    appState.isAdmin = false;
    
    // Sembunyikan tombol logout admin
    const logoutAdminBtn = document.getElementById('logoutAdminBtn');
    const adminStatus = document.getElementById('adminStatus');
    const adminBtn = document.getElementById('adminBtn');
    
    if (logoutAdminBtn) logoutAdminBtn.style.display = 'none';
    if (adminStatus) adminStatus.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
    
    // Update admin controls
    updateAdminControls();
    
    showNotification('👋 Berhasil keluar dari mode admin', 'success');
    console.log('✅ Logged out from admin mode');
}

function setupHeaderSearch() {
    const searchHeader = document.getElementById('searchHeader');
    if (searchHeader) {
        searchHeader.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (appState.currentSection === 'external') {
                filterLinks('external', query);
            } else if (appState.currentSection === 'internal') {
                filterLinks('internal', query);
            }
        });
    }
}

function showPasswordModal() {
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    
    if (passwordInput) passwordInput.value = '';
    if (passwordError) passwordError.style.display = 'none';
    
    if (passwordModal) {
        passwordModal.show();
        setTimeout(() => {
            if (passwordInput) passwordInput.focus();
        }, 500);
    }
}

function showAdminLoginModal() {
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const adminPasswordError = document.getElementById('adminPasswordError');
    
    if (adminPasswordInput) adminPasswordInput.value = '';
    if (adminPasswordError) adminPasswordError.style.display = 'none';
    
    if (adminLoginModal) {
        adminLoginModal.show();
        setTimeout(() => {
            if (adminPasswordInput) adminPasswordInput.focus();
        }, 500);
    }
}

function setupInstallPrompt() {
    let deferredPrompt;
    const installPrompt = document.getElementById('installPrompt');
    const installBtn = document.getElementById('installBtn');
    const cancelInstall = document.getElementById('cancelInstall');
    const installBtnFooter = document.getElementById('installBtnFooter');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        setTimeout(() => {
            if (installPrompt) installPrompt.classList.add('active');
        }, 3000);
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    if (installPrompt) installPrompt.classList.remove('active');
                }
                deferredPrompt = null;
            }
        });
    }

    if (installBtnFooter) {
        installBtnFooter.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    showNotification('🎉 Aplikasi berhasil diinstall!', 'success');
                }
                deferredPrompt = null;
            }
        });
    }

    if (cancelInstall) {
        cancelInstall.addEventListener('click', () => {
            if (installPrompt) installPrompt.classList.remove('active');
        });
    }
}

// Password checking functions
function checkPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    
    if (!passwordInput || !passwordError) return;
    
    const password = passwordInput.value.trim();
    
    if (!password) {
        passwordError.textContent = 'Password tidak boleh kosong!';
        passwordError.style.display = 'block';
        passwordInput.focus();
        return;
    }

    if (password === CONFIG.internalPassword) {
        passwordModal.hide();
        passwordInput.value = '';
        passwordError.style.display = 'none';
        showSection('internal');
        
        // Show login notice
        const loginNotice = document.getElementById('loginNotice');
        if (loginNotice) {
            loginNotice.style.display = 'flex';
            setTimeout(() => {
                loginNotice.style.display = 'none';
            }, 5000);
        }
        
        showNotification('✅ Berhasil login sebagai Staff Internal', 'success');
    } else {
        passwordError.textContent = 'Password salah! Coba lagi.';
        passwordError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function checkAdminPassword() {
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const adminPasswordError = document.getElementById('adminPasswordError');
    
    if (!adminPasswordInput || !adminPasswordError) return;
    
    const password = adminPasswordInput.value.trim();
    
    if (!password) {
        adminPasswordError.textContent = 'Password admin tidak boleh kosong!';
        adminPasswordError.style.display = 'block';
        adminPasswordInput.focus();
        return;
    }

    if (password === CONFIG.adminPassword) {
        adminLoginModal.hide();
        adminPasswordInput.value = '';
        adminPasswordError.style.display = 'none';
        appState.isAdmin = true;

        const logoutAdminBtn = document.getElementById('logoutAdminBtn');
        if (logoutAdminBtn) logoutAdminBtn.style.display = 'flex';
        updateAdminControls();
        showNotification('⚙️ Admin mode diaktifkan', 'success');
    } else {
        adminPasswordError.textContent = 'Password admin salah!';
        adminPasswordError.style.display = 'block';
        adminPasswordInput.value = '';
        adminPasswordInput.focus();
    }
}

// Section management
function showSection(section) {
    const externalContent = document.getElementById('externalContent');
    const internalContent = document.getElementById('internalContent');
    const userStatus = document.getElementById('userStatus');
    
    // Hide all sections first
    if (externalContent) externalContent.classList.remove('active');
    if (internalContent) internalContent.classList.remove('active');
    
    if (section === 'external' && externalContent) {
        externalContent.classList.add('active');
        appState.currentSection = 'external';
        console.log('📤 External section shown');
    } else if (section === 'internal' && internalContent) {
        internalContent.classList.add('active');
        if (userStatus) userStatus.style.display = 'block';
        appState.currentSection = 'internal';
        appState.isInternalLoggedIn = true;
        console.log('🔐 Internal section shown');
    }
    
    updateAdminControls();
    
    // Clear header search when switching sections
    const searchHeader = document.getElementById('searchHeader');
    if (searchHeader) {
        searchHeader.value = '';
    }
}

function hideSection(section) {
    const externalContent = document.getElementById('externalContent');
    const internalContent = document.getElementById('internalContent');
    const userStatus = document.getElementById('userStatus');
    const loginNotice = document.getElementById('loginNotice');
    
    if (section === 'external' && externalContent) {
        externalContent.classList.remove('active');
    } else if (section === 'internal' && internalContent) {
        internalContent.classList.remove('active');
        if (userStatus) userStatus.style.display = 'none';
        if (loginNotice) loginNotice.style.display = 'none';
    }
    
    appState.currentSection = null;
    updateAdminControls();
    
    console.log('🔙 Section hidden:', section);
}

// Admin functionality
function updateAdminControls() {
    const adminBtn = document.getElementById('adminBtn');
    const adminStatus = document.getElementById('adminStatus');
    const addExternalLink = document.getElementById('addExternalLink');
    const addInternalLink = document.getElementById('addInternalLink');
    
    if (appState.isAdmin) {
        if (adminBtn) adminBtn.style.display = 'flex';
        if (adminStatus) adminStatus.style.display = 'block';
        
        if (appState.currentSection === 'external' && addExternalLink) {
            addExternalLink.style.display = 'block';
        } else if (appState.currentSection === 'internal' && addInternalLink) {
            addInternalLink.style.display = 'block';
        }
        
        document.querySelectorAll('.link-card').forEach(card => {
            card.classList.add('admin-mode');
        });
    } else {
        if (adminBtn) adminBtn.style.display = 'none';
        if (adminStatus) adminStatus.style.display = 'none';
        if (addExternalLink) addExternalLink.style.display = 'none';
        if (addInternalLink) addInternalLink.style.display = 'none';
        
        document.querySelectorAll('.link-card').forEach(card => {
            card.classList.remove('admin-mode');
        });
    }
}

function saveNewLink() {
    const title = document.getElementById('linkTitle');
    const description = document.getElementById('linkDescription');
    const url = document.getElementById('linkUrl');
    const type = document.getElementById('linkType');
    const section = document.getElementById('linkSection');

    if (!title || !url) return;

    const titleValue = title.value.trim();
    const descriptionValue = description ? description.value.trim() : '';
    const urlValue = url.value.trim();
    const typeValue = type ? type.value : 'document';
    const sectionValue = section ? section.value : 'external';

    if (!titleValue) {
        showNotification('❌ Judul harus diisi', 'error');
        title.focus();
        return;
    }

    if (!urlValue) {
        showNotification('❌ URL harus diisi', 'error');
        url.focus();
        return;
    }

    // Validasi URL format
    try {
        new URL(urlValue);
    } catch (e) {
        showNotification('❌ Format URL tidak valid', 'error');
        url.focus();
        return;
    }

    const newLink = {
        id: Date.now().toString(),
        title: titleValue,
        description: descriptionValue || 'Tidak ada deskripsi',
        url: urlValue,
        type: typeValue,
        section: sectionValue,
        timestamp: new Date().toISOString()
    };

    saveLinkToStorage(newLink);
    
    // Hide modal
    if (adminModal) {
        adminModal.hide();
    }
    
    clearAdminForm();
    showNotification('✅ Link berhasil ditambahkan', 'success');
    
    // Refresh the current section to show new link
    if (appState.currentSection === sectionValue) {
        loadCustomLinks(sectionValue);
    }
}

function clearAdminForm() {
    const title = document.getElementById('linkTitle');
    const description = document.getElementById('linkDescription');
    const url = document.getElementById('linkUrl');
    const type = document.getElementById('linkType');
    const section = document.getElementById('linkSection');

    if (title) title.value = '';
    if (description) description.value = '';
    if (url) url.value = '';
    if (type) type.value = 'youtube';
    if (section) section.value = 'external';
}

// Search functionality
function setupSearchFunctionality() {
    const searchToggleExternal = document.getElementById('searchToggleExternal');
    const searchToggleInternal = document.getElementById('searchToggleInternal');
    const searchContainerExternal = document.getElementById('searchContainerExternal');
    const searchContainerInternal = document.getElementById('searchContainerInternal');
    const searchExternal = document.getElementById('searchExternal');
    const searchInternal = document.getElementById('searchInternal');
    const clearSearchExternal = document.getElementById('clearSearchExternal');
    const clearSearchInternal = document.getElementById('clearSearchInternal');

    if (searchToggleExternal && searchContainerExternal) {
        searchToggleExternal.addEventListener('click', () => {
            toggleSearch('external');
        });
    }

    if (searchToggleInternal && searchContainerInternal) {
        searchToggleInternal.addEventListener('click', () => {
            toggleSearch('internal');
        });
    }

    if (searchExternal) {
        searchExternal.addEventListener('input', (e) => {
            filterLinks('external', e.target.value);
        });
    }

    if (searchInternal) {
        searchInternal.addEventListener('input', (e) => {
            filterLinks('internal', e.target.value);
        });
    }

    if (clearSearchExternal && searchExternal) {
        clearSearchExternal.addEventListener('click', () => {
            searchExternal.value = '';
            filterLinks('external', '');
        });
    }

    if (clearSearchInternal && searchInternal) {
        clearSearchInternal.addEventListener('click', () => {
            searchInternal.value = '';
            filterLinks('internal', '');
        });
    }
}

function toggleSearch(section) {
    const searchContainer = section === 'external' ? document.getElementById('searchContainerExternal') : document.getElementById('searchContainerInternal');
    const searchInput = section === 'external' ? document.getElementById('searchExternal') : document.getElementById('searchInternal');
    
    if (!searchContainer || !searchInput) return;
    
    if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'block';
        setTimeout(() => {
            searchInput.focus();
        }, 100);
    } else {
        searchContainer.style.display = 'none';
        searchInput.value = '';
        filterLinks(section, '');
    }
}

function filterLinks(section, query) {
    const grid = section === 'external' ? document.getElementById('externalLinksGrid') : document.getElementById('internalLinksGrid');
    if (!grid) return;
    
    const cards = grid.getElementsByClassName('link-card');
    
    Array.from(cards).forEach(card => {
        const titleElement = card.querySelector('h3');
        const descriptionElement = card.querySelector('p');
        
        if (titleElement && descriptionElement) {
            const title = titleElement.textContent.toLowerCase();
            const description = descriptionElement.textContent.toLowerCase();
            const searchTerm = query.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Link cards functionality
function initLinkCards() {
    const linkCards = document.querySelectorAll('.link-card');
    
    linkCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Jangan buka link jika mengklik admin controls
            if (e.target.closest('.admin-controls')) {
                return;
            }
            
            const link = this.getAttribute('data-link');
            
            if (link && link !== '#' && link !== '') {
                // Untuk konten internal, cek login status
                if (this.closest('#internalLinksGrid') && !appState.isInternalLoggedIn && !appState.isAdmin) {
                    showNotification('🔐 Silakan login terlebih dahulu untuk mengakses konten internal', 'error');
                    showPasswordModal();
                    return;
                }
                
                window.open(link, '_blank');
                trackLinkClick(this.querySelector('h3').textContent, link);
            } else if (!link || link === '#' || link === '') {
                showNotification('ℹ️ Link belum tersedia', 'info');
            }
        });
    });
}

function saveLinkToStorage(link) {
    const storedLinks = JSON.parse(localStorage.getItem('customLinks') || '[]');
    storedLinks.push(link);
    localStorage.setItem('customLinks', JSON.stringify(storedLinks));
}

function loadCustomLinks(section) {
    const storedLinks = JSON.parse(localStorage.getItem('customLinks') || '[]');
    const sectionLinks = storedLinks.filter(link => link.section === section);
    
    if (sectionLinks.length > 0) {
        const grid = section === 'external' ? document.getElementById('externalLinksGrid') : document.getElementById('internalLinksGrid');
        if (!grid) return;
        
        // Hapus custom links yang sudah ada (untuk menghindari duplikat)
        const existingCustomCards = grid.querySelectorAll('.link-card[data-id]');
        existingCustomCards.forEach(card => card.remove());
        
        sectionLinks.forEach(link => {
            const card = createCustomLinkCard(link);
            grid.appendChild(card);
        });
        
        // Re-init event listeners for new cards
        initLinkCards();
        updateAdminControls();
    }
}

function createCustomLinkCard(link) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.setAttribute('data-link', link.url);
    card.setAttribute('data-id', link.id);

    const iconConfig = getIconConfig(link.type, link.title);
    const badgeClass = getBadgeClass(link.type);
    const badgeText = getBadgeText(link.type);
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-icon" style="background: ${iconConfig.background}">
                <i class="${iconConfig.icon}"></i>
            </div>
            <div class="card-content">
                <h3>${link.title}</h3>
                <p>${link.description}</p>
                <span class="document-badge ${badgeClass}">${badgeText}</span>
            </div>
        </div>
        <div class="admin-controls">
            <button class="btn-edit" onclick="editLink('${link.id}', '${link.section}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" onclick="deleteLink('${link.id}', '${link.section}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return card;
}

function getIconConfig(type, title = '') {
    const titleLower = title.toLowerCase();
    
    // Custom icons based on title for specific items
    if (titleLower.includes('boba') || titleLower.includes('whatsapp')) {
        return { 
            icon: 'fab fa-whatsapp', 
            background: 'linear-gradient(135deg, #25D366, #128C7E)'
        };
    }
    if (titleLower.includes('jantung') || titleLower.includes('heart')) {
        return { 
            icon: 'fas fa-heartbeat', 
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)'
        };
    }
    if (titleLower.includes('kemoterapi') || titleLower.includes('chemotherapy')) {
        return { 
            icon: 'fas fa-prescription-bottle', 
            background: 'linear-gradient(135deg, #1abc9c, #16a085)'
        };
    }
    if (titleLower.includes('sitostatika')) {
        return { 
            icon: 'fas fa-tablets', 
            background: 'linear-gradient(135deg, #34495e, #2c3e50)'
        };
    }
    if (titleLower.includes('insulin')) {
        return { 
            icon: 'fas fa-syringe', 
            background: 'linear-gradient(135deg, #f39c12, #e67e22)'
        };
    }
    if (titleLower.includes('puasa') || titleLower.includes('fasting')) {
        return { 
            icon: 'fas fa-moon', 
            background: 'linear-gradient(135deg, #27ae60, #229954)'
        };
    }
    if (titleLower.includes('anak') || titleLower.includes('child')) {
        return { 
            icon: 'fas fa-child', 
            background: 'linear-gradient(135deg, #e84393, #fd79a8)'
        };
    }
    if (titleLower.includes('ngeker')) {
        return { 
            icon: 'fab fa-youtube', 
            background: 'linear-gradient(135deg, #FF0000, #CC0000)'
        };
    }
    
    // Default icons based on type
    const configs = {
        youtube: { 
            icon: 'fab fa-youtube', 
            background: 'linear-gradient(135deg, #FF0000, #CC0000)'
        },
        drive: { 
            icon: 'fas fa-cloud', 
            background: 'linear-gradient(135deg, #4285F4, #3367D6)'
        },
        sheets: { 
            icon: 'fas fa-table', 
            background: 'linear-gradient(135deg, #0F9D58, #0B8043)'
        },
        form: { 
            icon: 'fas fa-file-alt', 
            background: 'linear-gradient(135deg, #673AB7, #512DA8)'
        },
        document: { 
            icon: 'fas fa-file-medical', 
            background: 'linear-gradient(135deg, #F39C12, #E67E22)'
        },
        link: { 
            icon: 'fas fa-link', 
            background: 'linear-gradient(135deg, #7F8C8D, #95A5A6)'
        }
    };
    return configs[type] || configs.document;
}

function getBadgeClass(type) {
    const classes = {
        youtube: 'youtube-badge',
        drive: 'drive-badge',
        sheets: 'sheets-badge',
        form: 'form-badge',
        document: 'document-badge',
        link: 'link-badge'
    };
    return classes[type] || 'document-badge';
}

function getBadgeText(type) {
    const texts = {
        youtube: 'YouTube',
        drive: 'Google Drive',
        sheets: 'Google Sheets',
        form: 'Google Form',
        document: 'Document',
        link: 'Link'
    };
    return texts[type] || 'Link';
}

function trackLinkClick(title, url) {
    const analytics = JSON.parse(localStorage.getItem('linkAnalytics') || '[]');
    analytics.push({
        title,
        url,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    });
    localStorage.setItem('linkAnalytics', JSON.stringify(analytics));
}

function showNotification(message, type = 'info') {
    const alertClass = type === 'error' ? 'alert-danger' : 
                      type === 'success' ? 'alert-success' : 'alert-info';
    
    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 1060; min-width: 300px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Global functions for admin controls
window.editLink = function(id, section) {
    showNotification('🛠️ Fitur edit akan segera hadir', 'info');
};

window.deleteLink = function(id, section) {
    if (confirm('Apakah Anda yakin ingin menghapus link ini?')) {
        // For custom links stored in localStorage
        if (id.length > 3) {
            const storedLinks = JSON.parse(localStorage.getItem('customLinks') || '[]');
            const updatedLinks = storedLinks.filter(link => link.id !== id);
            localStorage.setItem('customLinks', JSON.stringify(updatedLinks));
            
            // Remove from DOM
            const card = document.querySelector(`.link-card[data-id="${id}"]`);
            if (card) {
                card.remove();
                showNotification('✅ Link berhasil dihapus', 'success');
            }
        } else {
            showNotification('❌ Tidak dapat menghapus link default', 'error');
        }
    }
};

// Online/Offline Detection
window.addEventListener('online', function() {
    const offlineNotification = document.querySelector('.offline-notification');
    if (offlineNotification) offlineNotification.classList.remove('active');
    showNotification('🌐 Koneksi internet kembali', 'success');
});

window.addEventListener('offline', function() {
    const offlineNotification = document.querySelector('.offline-notification') || createOfflineNotification();
    offlineNotification.classList.add('active');
});

function createOfflineNotification() {
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.innerHTML = '<i class="fas fa-wifi"></i> Anda sedang offline';
    document.body.appendChild(notification);
    return notification;
}

// Utility function untuk reset modal
window.resetPasswordModal = function() {
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    if (passwordInput) passwordInput.value = '';
    if (passwordError) passwordError.style.display = 'none';
};

window.resetAdminModal = function() {
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const adminPasswordError = document.getElementById('adminPasswordError');
    if (adminPasswordInput) adminPasswordInput.value = '';
    if (adminPasswordError) adminPasswordError.style.display = 'none';
};

// Export for global access
window.lighthousePWACheck = function() {
    const checks = {
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasIcons: false,
        hasSW: false,
        hasStartUrl: false,
        hasThemeColor: !!document.querySelector('meta[name="theme-color"]'),
        hasViewport: !!document.querySelector('meta[name="viewport"]'),
        isHTTPS: window.location.protocol === 'https:',
        isLocalhost: window.location.hostname === 'localhost'
    };
    console.log('PWA Status:', checks);
    return checks;
};