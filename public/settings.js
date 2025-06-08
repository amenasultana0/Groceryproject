// Settings Page JavaScript

const translations = {
  en: {
    settingsTitle: "Settings",
    saveBtn: "Save Settings",
    regionLabel: "Region:",
    languageLabel: "Language:",
    notificationLabel: "Notifications:",
    themeLabel: "Theme:"
  },
  es: {
    settingsTitle: "Configuraciones",
    saveBtn: "Guardar Configuración",
    regionLabel: "Región:",
    languageLabel: "Idioma:",
    notificationLabel: "Notificaciones:",
    themeLabel: "Tema:"
  },
  fr: {
    settingsTitle: "Paramètres",
    saveBtn: "Enregistrer",
    regionLabel: "Région:",
    languageLabel: "Langue:",
    notificationLabel: "Notifications:",
    themeLabel: "Thème:"
  }
  // Add more languages as needed
};

function applyLanguage(langCode) {
  const t = translations[langCode] || translations['en'];
  const $ = (id) => document.getElementById(id);

  $('settings-title').textContent = t.settingsTitle;
  $('save-settings').textContent = t.saveBtn;
  document.querySelector('label[for="region"]').textContent = t.regionLabel;
  document.querySelector('label[for="language"]').textContent = t.languageLabel;
  document.querySelector('label[for="notification"]').textContent = t.notificationLabel;
  document.querySelector('label[for="theme"]').textContent = t.themeLabel;
}


class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.initializeEventListeners();
        this.populateSettings();
        applyLanguage(this.settings.language);
    }

    // Load settings from localStorage (or use defaults)
    loadSettings() {
        const defaultSettings = {
            language: 'en',
            region: 'us',
            expiryReminder: 3,
            lowStockThreshold: 5,
            autoDeleteExpired: false,
            expiryAlerts: true,
            expiryAlertDays: 3,
            lowStockAlerts: true,
            weeklyReports: false,
            fullName: '',
            email: '',
            twoFactorAuth: false,
            syncMethod: 'cloud',
            categories: ['Fruits & Vegetables', 'Dairy & Eggs', 'Meat & Seafood']
        };

        try {
            const saved = localStorage.getItem('groceryTrackSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.warn('Could not load settings from localStorage:', error);
            return defaultSettings;
        }
    }

    // Save settings to localStorage
    saveSettings() {
        try {
            localStorage.setItem('groceryTrackSettings', JSON.stringify(this.settings));
            this.showSaveNotification();
        } catch (error) {
            console.error('Could not save settings to localStorage:', error);
            this.showErrorNotification();
        }
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Back button
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.history.back();
            });
        }

        // Form inputs
        this.addInputListener('language', 'language');
        document.getElementById('language').addEventListener('change', (e) => {
            const newLang = e.target.value;
            this.settings.language = newLang;      // update settings object
            applyLanguage(newLang);                // apply new language
            this.saveSettings();
        });

        this.addInputListener('region');
        this.addInputListener('expiry-reminder', 'expiryReminder');
        this.addInputListener('low-stock', 'lowStockThreshold');
        this.addInputListener('expiry-days', 'expiryAlertDays');
        this.addInputListener('full-name', 'fullName');
        this.addInputListener('email');

        // Toggle switches
        this.addToggleListener('auto-delete', 'autoDeleteExpired');
        this.addToggleListener('expiry-alerts', 'expiryAlerts');
        this.addToggleListener('low-stock-alerts', 'lowStockAlerts');
        this.addToggleListener('weekly-reports', 'weeklyReports');
        this.addToggleListener('two-factor', 'twoFactorAuth');

        // Radio buttons for sync method
        document.querySelectorAll('input[name="sync"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.settings.syncMethod = e.target.value;
                }
            });
        });

        // Category management
        this.initializeCategoryManagement();

        // Clickable settings items
        this.initializeClickableItems();

        // Save button
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.collectAllSettings();
                this.saveSettings();
            });
        }

        // Sub-setting visibility
        this.initializeSubSettings();
    }

    // Add input listener helper
    addInputListener(elementId, settingKey = null) {
        const element = document.getElementById(elementId);
        if (element) {
            const key = settingKey || elementId.replace('-', '');
            
            if (element.type === 'number') {
                element.addEventListener('change', (e) => {
                    this.settings[key] = parseInt(e.target.value) || 0;
                });
            } else {
                element.addEventListener('change', (e) => {
                    this.settings[key] = e.target.value;
                });
            }
        }
    }

    // Add toggle listener helper
    addToggleListener(elementId, settingKey) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', (e) => {
                this.settings[settingKey] = e.target.checked;
                
                // Handle sub-settings visibility
                if (elementId === 'expiry-alerts') {
                    this.toggleSubSetting('expiry-days', e.target.checked);
                }
            });
        }
    }

    // Initialize category management
    initializeCategoryManagement() {
        const addCategoryBtn = document.getElementById('add-category');
        const categoriesList = document.getElementById('categories-list');

        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.addNewCategory();
            });
        }

        if (categoriesList) {
            categoriesList.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn')) {
                    this.deleteCategory(e.target);
                }
            });
        }
    }

    // Add new category
    addNewCategory() {
        const categoryName = prompt('Enter category name:');
        if (categoryName && categoryName.trim()) {
            const trimmedName = categoryName.trim();
            if (!this.settings.categories.includes(trimmedName)) {
                this.settings.categories.push(trimmedName);
                this.renderCategories();
            } else {
                alert('Category already exists!');
            }
        }
    }

    // Delete category
    deleteCategory(deleteBtn) {
        const categoryItem = deleteBtn.closest('.category-item');
        const categoryName = categoryItem.querySelector('span').textContent;
        
        if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
            this.settings.categories = this.settings.categories.filter(cat => cat !== categoryName);
            categoryItem.remove();
        }
    }

    // Render categories list
    renderCategories() {
        const categoriesList = document.getElementById('categories-list');
        if (categoriesList) {
            categoriesList.innerHTML = this.settings.categories.map(category => `
                <div class="category-item">
                    <span>${category}</span>
                    <button class="delete-btn">×</button>
                </div>
            `).join('');
        }
    }

    // Initialize clickable items
    initializeClickableItems() {
        const clickableItems = document.querySelectorAll('.setting-item.clickable');
        
        clickableItems.forEach(item => {
            item.addEventListener('click', () => {
                const label = item.querySelector('label').textContent;
                this.handleClickableAction(label);
            });
        });
    }

    // Handle clickable actions
    handleClickableAction(action) {
        switch (action) {
            case 'Privacy Policy':
                window.open('/privacy-policy', '_blank');
                break;
            case 'Terms of Service':
                window.open('/terms-of-service', '_blank');
                break;
            case 'Contact Support':
                window.open('mailto:support@grocerytrack.com', '_blank');
                break;
            case 'Give Feedback':
                window.open('/feedback', '_blank');
                break;
            default:
                console.log(`Action not implemented: ${action}`);
        }
    }

    // Initialize sub-settings visibility
    initializeSubSettings() {
        const expiryAlertsToggle = document.getElementById('expiry-alerts');
        if (expiryAlertsToggle) {
            this.toggleSubSetting('expiry-days', expiryAlertsToggle.checked);
        }
    }

    // Toggle sub-setting visibility
    toggleSubSetting(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            const subSetting = element.closest('.sub-setting');
            if (subSetting) {
                subSetting.style.display = show ? 'flex' : 'none';
            }
        }
    }

    // Populate settings from stored values
    populateSettings() {
        // Populate form inputs
        this.setElementValue('language', this.settings.language);
        this.setElementValue('region', this.settings.region);
        this.setElementValue('expiry-reminder', this.settings.expiryReminder);
        this.setElementValue('low-stock', this.settings.lowStockThreshold);
        this.setElementValue('expiry-days', this.settings.expiryAlertDays);
        this.setElementValue('full-name', this.settings.fullName);
        this.setElementValue('email', this.settings.email);

        // Populate toggles
        this.setToggleValue('auto-delete', this.settings.autoDeleteExpired);
        this.setToggleValue('expiry-alerts', this.settings.expiryAlerts);
        this.setToggleValue('low-stock-alerts', this.settings.lowStockAlerts);
        this.setToggleValue('weekly-reports', this.settings.weeklyReports);
        this.setToggleValue('two-factor', this.settings.twoFactorAuth);

        // Populate radio buttons
        const syncRadio = document.querySelector(`input[name="sync"][value="${this.settings.syncMethod}"]`);
        if (syncRadio) {
            syncRadio.checked = true;
        }

        // Render categories
        this.renderCategories();
    }

    // Helper to set element value
    setElementValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    // Helper to set toggle value
    setToggleValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.checked = value;
        }
    }

    // Collect all current settings from the form
    collectAllSettings() {
        // Get all input values
        const inputs = {
            language: document.getElementById('language')?.value || 'en',
            region: document.getElementById('region')?.value || 'us',
            expiryReminder: parseInt(document.getElementById('expiry-reminder')?.value) || 3,
            lowStockThreshold: parseInt(document.getElementById('low-stock')?.value) || 5,
            expiryAlertDays: parseInt(document.getElementById('expiry-days')?.value) || 3,
            fullName: document.getElementById('full-name')?.value || '',
            email: document.getElementById('email')?.value || ''
        };

        // Get all toggle values
        const toggles = {
            autoDeleteExpired: document.getElementById('auto-delete')?.checked || false,
            expiryAlerts: document.getElementById('expiry-alerts')?.checked || false,
            lowStockAlerts: document.getElementById('low-stock-alerts')?.checked || false,
            weeklyReports: document.getElementById('weekly-reports')?.checked || false,
            twoFactorAuth: document.getElementById('two-factor')?.checked || false
        };

        // Get sync method
        const syncMethod = document.querySelector('input[name="sync"]:checked')?.value || 'cloud';

        // Update settings object
        this.settings = {
            ...this.settings,
            ...inputs,
            ...toggles,
            syncMethod
        };
    }

    // Show save notification
    showSaveNotification() {
        this.showNotification('Settings saved successfully!', 'success');
    }

    // Show error notification
    showErrorNotification() {
        this.showNotification('Error saving settings. Please try again.', 'error');
    }

    // Generic notification system
    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
            backgroundColor: type === 'success' ? '#10b981' : '#ef4444'
        });

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Export settings (for backup)
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `grocerytrack-settings-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Import settings (for restore)
    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSettings = JSON.parse(e.target.result);
                this.settings = { ...this.settings, ...importedSettings };
                this.populateSettings();
                this.saveSettings();
                this.showNotification('Settings imported successfully!', 'success');
            } catch (error) {
                console.error('Error importing settings:', error);
                this.showNotification('Error importing settings. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Reset settings to defaults
    resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
            this.settings = this.loadSettings();
            // Clear localStorage
            try {
                localStorage.removeItem('groceryTrackSettings');
            } catch (error) {
                console.warn('Could not clear settings from localStorage:', error);
            }
            this.populateSettings();
            applyLanguage(this.settings.language);
            this.showNotification('Settings reset to defaults!', 'success');
        }
    }
}

// Additional utility functions
class SettingsUtils {
    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate required fields
    static validateSettings(settings) {
        const errors = [];

        if (settings.email && !this.isValidEmail(settings.email)) {
            errors.push('Please enter a valid email address');
        }

        if (settings.expiryReminder < 1 || settings.expiryReminder > 30) {
            errors.push('Expiry reminder must be between 1 and 30 days');
        }

        if (settings.lowStockThreshold < 1 || settings.lowStockThreshold > 100) {
            errors.push('Low stock threshold must be between 1 and 100');
        }

        if (settings.expiryAlertDays < 1 || settings.expiryAlertDays > 14) {
            errors.push('Expiry alert days must be between 1 and 14');
        }

        return errors;
    }

    // Format settings for display
    static formatSettingsForDisplay(settings) {
        return {
            ...settings,
            fullName: settings.fullName || 'Not set',
            email: settings.email || 'Not set',
            lastSaved: new Date().toLocaleString()
        };
    }
}

// Initialize the settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
    
    // Add additional button handlers that might not be in the main class
    const passwordButton = document.querySelector('.setting-button');
    if (passwordButton && passwordButton.textContent.includes('Update Password')) {
        passwordButton.addEventListener('click', () => {
            // In a real app, this would open a password change modal
            alert('Password change functionality would be implemented here.');
        });
    }

    // Handle backup/restore buttons
    const backupButton = document.querySelector('.button-group .setting-button:first-child');
    const restoreButton = document.querySelector('.button-group .setting-button:last-child');
    
    if (backupButton && backupButton.textContent.includes('Backup')) {
        backupButton.addEventListener('click', () => {
            window.settingsManager.exportSettings();
        });
    }

    if (restoreButton && restoreButton.textContent.includes('Restore')) {
        restoreButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.addEventListener('change', (e) => {
                window.settingsManager.importSettings(e);
            });
            input.click();
        });
    }

    // Handle manage connections button
    const connectionsButton = document.querySelector('.setting-button[onclick*="Manage"]');
    if (connectionsButton) {
        connectionsButton.addEventListener('click', () => {
            // In a real app, this would open a connections management modal
            alert('Account connections management would be implemented here.');
        });
    }
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsManager, SettingsUtils };
}