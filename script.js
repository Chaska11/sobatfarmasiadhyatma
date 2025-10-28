// PWA Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// App Configuration
const CONFIG = {
    internalPassword: "12345",
    adminPassword: "admin123",
    version: "1.3.0"
};

// Global State
let appState = {
    isAdmin: false,
    editMode: false,
    currentSection: null,
    isInternalLoggedIn: false
};

// Install Prompt
let deferredPrompt;
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');
const cancelInstall = document.getElementById('cancelInstall');
const installBtnFooter = document.getElementById('installBtnFooter');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install prompt
    setTimeout(() => {
        installPrompt.classList.add('active');
    }, 3000);
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installPrompt.classList.remove('active');
        }
        deferredPrompt = null;
    }
});

installBtnFooter.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('PWA installed successfully');
            showNotification('Aplikasi berhasil diinstall!', 'success');
        }
        deferredPrompt = null;
    }
});

cancelInstall.addEventListener('click', () => {
    installPrompt.classList.remove('active');
});

// Online/Offline Detection
window.addEventListener('online', function() {
    document.querySelector('.offline-notification')?.classList.remove('active');
    showNotification('Koneksi internet kembali', 'success');
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

// Main App Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Elemen DOM
    const elements = {
        splashScreen: document.getElementById('splashScreen'),
        internalBtn: document.getElementById('internalBtn'),
        externalBtn: document.getElementById('externalBtn'),
        externalContent: document.getElementById('externalContent'),
        internalContent: document.getElementById('internalContent'),
        passwordModal: new bootstrap.Modal(document.getElementById('passwordModal')),
        adminLoginModal: new bootstrap.Modal(document.getElementById('adminLoginModal')),
        adminModal: new bootstrap.Modal(document.getElementById('adminModal')),
        passwordInput: document.getElementById('passwordInput'),
        adminPasswordInput: document.getElementById('adminPasswordInput'),
        passwordSubmit: document.getElementById('passwordSubmit'),
        adminPasswordSubmit: document.getElementById('adminPasswordSubmit'),
        passwordError: document.getElementById('passwordError'),
        adminPasswordError: document.getElementById('adminPasswordError'),
        backFromExternal: document.getElementById('backFromExternal'),
        backFromInternal: document.getElementById('backFromInternal'),
        userStatus: document.getElementById('userStatus'),
        adminStatus: document.getElementById('adminStatus'),
        loginNotice: document.getElementById('loginNotice'),
        accessOptions: document.querySelector('.access-options'),
        adminBtn: document.getElementById('adminBtn'),
        adminAccessBtn: document.getElementById('adminAccessBtn'),
        addExternalLink: document.getElementById('addExternalLink'),
        addInternalLink: document.getElementById('addInternalLink'),
        searchToggleExternal: document.getElementById('searchToggleExternal'),
        searchToggleInternal: document.getElementById('searchToggleInternal'),
        searchContainerExternal: document.getElementById('searchContainerExternal'),
        searchContainerInternal: document.getElementById('searchContainerInternal'),
        searchExternal: document.getElementById('searchExternal'),
        searchInternal: document.getElementById('searchInternal'),
        clearSearchExternal: document.getElementById('clearSearchExternal'),
        clearSearchInternal: document.getElementById('clearSearchInternal'),
        saveLink: document.getElementById('saveLink')
    };

    // Hilangkan splash screen setelah 2.5 detik
    setTimeout(() => {
        elements.splashScreen.style.opacity = '0';
        setTimeout(() => {
            elements.splashScreen.style.display = 'none';
        }, 500);
    }, 2500);

    // Initialize link cards
    initLinkCards();

    // Event Listeners
    elements.externalBtn.addEventListener('click', () => {
        showSection('external');
    });
    
    elements.internalBtn.addEventListener('click', () => {
        // Reset password input dan error message
        elements.passwordInput.value = '';
        elements.passwordError.style.display = 'none';
        elements.passwordModal.show();
        // Focus ke input password
        setTimeout(() => {
            elements.passwordInput.focus();
        }, 500);
    });
    
    elements.adminBtn.addEventListener('click', () => {
        elements.adminModal.show();
    });
    
    elements.adminAccessBtn.addEventListener('click', () => {
        // Reset admin password input dan error message
        elements.adminPasswordInput.value = '';
        elements.adminPasswordError.style.display = 'none';
        elements.adminLoginModal.show();
        // Focus ke input password
        setTimeout(() => {
            elements.adminPasswordInput.focus();
        }, 500);
    });

    elements.passwordSubmit.addEventListener('click', checkPassword);
    elements.adminPasswordSubmit.addEventListener('click', checkAdminPassword);

    elements.passwordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') checkPassword();
    });

    elements.adminPasswordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') checkAdminPassword();
    });

    elements.backFromExternal.addEventListener('click', () => {
        hideSection('external');
    });
    
    elements.backFromInternal.addEventListener('click', () => {
        hideSection('internal');
        appState.isInternalLoggedIn = false;
    });

    elements.addExternalLink.addEventListener('click', () => {
        elements.adminModal.show();
        document.getElementById('linkSection').value = 'external';
    });

    elements.addInternalLink.addEventListener('click', () => {
        elements.adminModal.show();
        document.getElementById('linkSection').value = 'internal';
    });

    elements.saveLink.addEventListener('click', saveNewLink);

    // Search functionality
    elements.searchToggleExternal.addEventListener('click', () => {
        toggleSearch('external');
    });

    elements.searchToggleInternal.addEventListener('click', () => {
        toggleSearch('internal');
    });

    elements.searchExternal.addEventListener('input', (e) => {
        filterLinks('external', e.target.value);
    });

    elements.searchInternal.addEventListener('input', (e) => {
        filterLinks('internal', e.target.value);
    });

    elements.clearSearchExternal.addEventListener('click', () => {
        elements.searchExternal.value = '';
        filterLinks('external', '');
    });

    elements.clearSearchInternal.addEventListener('click', () => {
        elements.searchInternal.value = '';
        filterLinks('internal', '');
    });

    // Event listeners untuk modal hidden
    document.getElementById('passwordModal').addEventListener('hidden.bs.modal', function() {
        elements.passwordInput.value = '';
        elements.passwordError.style.display = 'none';
    });

    document.getElementById('adminLoginModal').addEventListener('hidden.bs.modal', function() {
        elements.adminPasswordInput.value = '';
        elements.adminPasswordError.style.display = 'none';
    });

    // Fungsi untuk menampilkan section
    function showSection(section) {
        elements.accessOptions.style.display = 'none';
        if (section === 'external') {
            elements.externalContent.classList.add('active');
            appState.currentSection = 'external';
        } else {
            elements.internalContent.classList.add('active');
            elements.userStatus.style.display = 'block';
            appState.currentSection = 'internal';
            appState.isInternalLoggedIn = true;
        }
        updateAdminControls();
    }

    function hideSection(section) {
        if (section === 'external') {
            elements.externalContent.classList.remove('active');
        } else {
            elements.internalContent.classList.remove('active');
            elements.userStatus.style.display = 'none';
            elements.loginNotice.style.display = 'none';
        }
        elements.accessOptions.style.display = 'flex';
        appState.currentSection = null;
        updateAdminControls();
    }

    // Fungsi untuk memeriksa password - DIPERBAIKI
    function checkPassword() {
        const password = elements.passwordInput.value.trim();
        
        if (!password) {
            elements.passwordError.textContent = 'Password tidak boleh kosong!';
            elements.passwordError.style.display = 'block';
            elements.passwordInput.focus();
            return;
        }

        if (password === CONFIG.internalPassword) {
            elements.passwordModal.hide();
            elements.passwordInput.value = '';
            elements.passwordError.style.display = 'none';
            showSection('internal');
            
            // Show login notice
            elements.loginNotice.style.display = 'flex';
            setTimeout(() => {
                elements.loginNotice.style.display = 'none';
            }, 5000);
            
            showNotification('Berhasil login sebagai Staff Internal', 'success');
        } else {
            elements.passwordError.textContent = 'Password salah! Coba lagi.';
            elements.passwordError.style.display = 'block';
            elements.passwordInput.value = '';
            elements.passwordInput.focus();
        }
    }

    function checkAdminPassword() {
        const password = elements.adminPasswordInput.value.trim();
        
        if (!password) {
            elements.adminPasswordError.textContent = 'Password admin tidak boleh kosong!';
            elements.adminPasswordError.style.display = 'block';
            elements.adminPasswordInput.focus();
            return;
        }

        if (password === CONFIG.adminPassword) {
            elements.adminLoginModal.hide();
            elements.adminPasswordInput.value = '';
            elements.adminPasswordError.style.display = 'none';
            appState.isAdmin = true;
            updateAdminControls();
            showNotification('Admin mode diaktifkan', 'success');
        } else {
            elements.adminPasswordError.textContent = 'Password admin salah!';
            elements.adminPasswordError.style.display = 'block';
            elements.adminPasswordInput.value = '';
            elements.adminPasswordInput.focus();
        }
    }

    // Admin functionality
    function updateAdminControls() {
        if (appState.isAdmin) {
            elements.adminBtn.style.display = 'flex';
            elements.adminStatus.style.display = 'block';
            
            if (appState.currentSection === 'external') {
                elements.addExternalLink.style.display = 'block';
            } else if (appState.currentSection === 'internal') {
                elements.addInternalLink.style.display = 'block';
            }
            
            // Add admin controls to all link cards
            document.querySelectorAll('.link-card').forEach(card => {
                card.classList.add('admin-mode');
            });
        } else {
            elements.adminBtn.style.display = 'none';
            elements.adminStatus.style.display = 'none';
            elements.addExternalLink.style.display = 'none';
            elements.addInternalLink.style.display = 'none';
            
            document.querySelectorAll('.link-card').forEach(card => {
                card.classList.remove('admin-mode');
            });
        }
    }

    function saveNewLink() {
        const title = document.getElementById('linkTitle').value.trim();
        const description = document.getElementById('linkDescription').value.trim();
        const url = document.getElementById('linkUrl').value.trim();
        const type = document.getElementById('linkType').value;
        const section = document.getElementById('linkSection').value;

        if (!title) {
            showNotification('Judul harus diisi', 'error');
            document.getElementById('linkTitle').focus();
            return;
        }

        if (!url) {
            showNotification('URL harus diisi', 'error');
            document.getElementById('linkUrl').focus();
            return;
        }

        // Validasi URL format
        try {
            new URL(url);
        } catch (e) {
            showNotification('Format URL tidak valid', 'error');
            document.getElementById('linkUrl').focus();
            return;
        }

        const newLink = {
            id: Date.now().toString(),
            title,
            description: description || 'Tidak ada deskripsi',
            url,
            type,
            section,
            timestamp: new Date().toISOString()
        };

        saveLinkToStorage(newLink);
        elements.adminModal.hide();
        clearAdminForm();
        showNotification('Link berhasil ditambahkan', 'success');
        
        // Refresh the current section to show new link
        if (appState.currentSection === section) {
            loadCustomLinks(section);
        }
    }

    function clearAdminForm() {
        document.getElementById('linkTitle').value = '';
        document.getElementById('linkDescription').value = '';
        document.getElementById('linkUrl').value = '';
        document.getElementById('linkType').value = 'youtube';
        document.getElementById('linkSection').value = 'external';
    }

    // Search functionality
    function toggleSearch(section) {
        const searchContainer = section === 'external' ? elements.searchContainerExternal : elements.searchContainerInternal;
        const searchInput = section === 'external' ? elements.searchExternal : elements.searchInternal;
        
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
        const cards = grid.getElementsByClassName('link-card');
        
        Array.from(cards).forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const searchTerm = query.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
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
                        showNotification('Silakan login terlebih dahulu untuk mengakses konten internal', 'error');
                        elements.internalBtn.click(); // Buka modal login
                        return;
                    }
                    
                    window.open(link, '_blank');
                    trackLinkClick(this.querySelector('h3').textContent, link);
                } else if (!link || link === '#' || link === '') {
                    showNotification('Link belum tersedia', 'info');
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
        // Simple notification implementation
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

    // Initialize admin controls
    updateAdminControls();
    
    // Load any custom links from localStorage
    loadCustomLinks('external');
    loadCustomLinks('internal');
}

// Global functions for admin controls
window.editLink = function(id, section) {
    showNotification('Fitur edit akan segera hadir', 'info');
};

window.deleteLink = function(id, section) {
    if (confirm('Apakah Anda yakin ingin menghapus link ini?')) {
        // For custom links stored in localStorage
        if (id.length > 3) { // Custom links have timestamp IDs
            const storedLinks = JSON.parse(localStorage.getItem('customLinks') || '[]');
            const updatedLinks = storedLinks.filter(link => link.id !== id);
            localStorage.setItem('customLinks', JSON.stringify(updatedLinks));
            
            // Remove from DOM
            const card = document.querySelector(`.link-card[data-id="${id}"]`);
            if (card) {
                card.remove();
                showNotification('Link berhasil dihapus', 'success');
            }
        } else {
            showNotification('Tidak dapat menghapus link default', 'error');
        }
    }
};

// Lighthouse PWA Check
function lighthousePWACheck() {
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
}

// Export for global access
window.lighthousePWACheck = lighthousePWACheck;

// Utility function untuk reset modal
window.resetPasswordModal = function() {
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').style.display = 'none';
};

window.resetAdminModal = function() {
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordError').style.display = 'none';
};