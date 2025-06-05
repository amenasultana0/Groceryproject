// DOM Elements
const addItemBtn = document.querySelector('.add-item-btn');
const modal = document.getElementById('addItemModal');
const scannerModal = document.getElementById('scannerModal');
const closeModalBtn = document.querySelector('.close-modal');
const closeScannerBtn = document.querySelector('.close-scanner');
const cancelModalBtn = document.querySelector('.cancel-modal');
const addItemForm = document.getElementById('addItemForm');
const mobileMenuBtn = document.querySelector('.mobile-menu');
const mobileCloseBtn = document.querySelector('.mobile-close');
const sidebar = document.querySelector('.sidebar');
const searchInput = document.querySelector('.search-bar input');
const expiringItemsList = document.getElementById('expiringItems');
const recentItemsList = document.getElementById('recentItems');
const logoutBtn = document.querySelector('.user-actions .icon-btn[title="Logout"]');
const scannerBtn = document.querySelector('.scanner-btn');
const captureBtn = document.getElementById('captureBtn');
const manualEntryBtn = document.getElementById('manualEntry');
const notificationBtn = document.getElementById('notificationBtn');
const notificationDropdown = document.getElementById('notificationDropdown');

// Event Listeners
addItemBtn?.addEventListener('click', openModal);
closeModalBtn?.addEventListener('click', closeModal);
closeScannerBtn?.addEventListener('click', closeScannerModal);
cancelModalBtn?.addEventListener('click', closeModal);
addItemForm?.addEventListener('submit', handleAddItem);
mobileMenuBtn?.addEventListener('click', toggleSidebar);
mobileCloseBtn?.addEventListener('click', toggleSidebar);
searchInput?.addEventListener('input', handleSearch);
logoutBtn?.addEventListener('click', handleLogout);
scannerBtn?.addEventListener('click', openScannerModal);
captureBtn?.addEventListener('click', handleCapture);
manualEntryBtn?.addEventListener('click', openModalFromScanner);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    updateStats();
    loadUserData();
    initializeNotifications();
    initializeSampleData();
});

// Storage Functions (using memory instead of localStorage for compatibility)
let itemsStorage = [];

function getItems() {
    return itemsStorage;
}

function saveItems(items) {
    itemsStorage = items;
}

// Modal Functions
function openModal() {
    modal.classList.add('active');
    // Set today as the minimum date for expiry
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseDate').value = today;
    document.getElementById('purchaseDate').max = today;
    document.getElementById('expiryDate').min = today;
}

function closeModal() {
    modal.classList.remove('active');
    addItemForm.reset();
}

function openScannerModal() {
    scannerModal.classList.add('active');
}

function closeScannerModal() {
    scannerModal.classList.remove('active');
}

function openModalFromScanner() {
    closeScannerModal();
    openModal();
}

// Scanner Functions
function handleCapture() {
    // Simulate barcode scanning
    const mockBarcodes = [
        { code: '123456789012', name: 'Milk', category: 'dairy' },
        { code: '987654321098', name: 'Bread', category: 'pantry' },
        { code: '456789123456', name: 'Apples', category: 'fruits' },
        { code: '789123456789', name: 'Chicken Breast', category: 'meat' },
        { code: '321654987321', name: 'Yogurt', category: 'dairy' },
        { code: '654987321654', name: 'Bananas', category: 'fruits' },
        { code: '147258369147', name: 'Tomatoes', category: 'vegetables' },
        { code: '258369147258', name: 'Cheese', category: 'dairy' }
    ];

    // Simulate scanning delay
    captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
    captureBtn.disabled = true;

    setTimeout(() => {
        // Randomly select a barcode
        const scannedItem = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
        
        // Close scanner modal
        closeScannerModal();
        
        // Open add item modal with pre-filled data
        openModal();
        
        // Pre-fill form with scanned data
        document.getElementById('itemName').value = scannedItem.name;
        document.getElementById('category').value = scannedItem.category;
        document.getElementById('quantity').value = '1';
        
        // Set default expiry date (7 days from now for demo)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        document.getElementById('expiryDate').value = expiryDate.toISOString().split('T')[0];
        
        showNotification(`Scanned: ${scannedItem.name}`, 'success');
        
        // Reset capture button
        captureBtn.innerHTML = 'Capture';
        captureBtn.disabled = false;
    }, 2000);
}

// Item Management Functions
function handleAddItem(e) {
    e.preventDefault();

    const newItem = {
        id: Date.now(),
        name: document.getElementById('itemName').value,
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value),
        purchaseDate: document.getElementById('purchaseDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        notes: document.getElementById('notes').value,
        createdAt: new Date().toISOString()
    };

    // Get existing items and add new item
    const items = getItems();
    items.push(newItem);
    saveItems(items);

    // Update UI
    loadItems();
    updateStats();
    closeModal();

    // Show notification
    showNotification('Item added successfully!', 'success');
}

function loadItems() {
    const items = getItems();
    
    // Sort items by expiry date for expiring soon
    const expiringItems = items
        .filter(item => isExpiringSoon(item.expiryDate))
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    // Sort items by creation date for recent items
    const recentItems = [...items]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    // Render items
    renderItems(expiringItemsList, expiringItems, 'expiring');
    renderItems(recentItemsList, recentItems, 'recent');
}

function renderItems(container, items, type) {
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No items to display</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="item-card ${isExpired(item.expiryDate) ? 'expired' : ''}" data-id="${item.id}">
            <div class="item-header">
                <h3>${item.name}</h3>
                <span class="category-badge">${item.category}</span>
            </div>
            <div class="item-details">
                <div class="detail">
                    <i class="fas fa-calendar"></i>
                    <span>Expires: ${formatDate(item.expiryDate)}</span>
                </div>
                <div class="detail">
                    <i class="fas fa-box"></i>
                    <span>Quantity: ${item.quantity}</span>
                </div>
                ${item.notes ? `
                <div class="detail">
                    <i class="fas fa-sticky-note"></i>
                    <span>${item.notes}</span>
                </div>
                ` : ''}
            </div>
            <div class="item-actions">
                <button class="icon-btn" onclick="editItem(${item.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete" onclick="deleteItem(${item.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const items = getItems();
    
    // Calculate stats (removed low stock calculation)
    const expiringSoon = items.filter(item => isExpiringSoon(item.expiryDate)).length;
    const expired = items.filter(item => isExpired(item.expiryDate)).length;
    const totalItems = items.length;

    // Update stats in DOM (only 3 stat cards now)
    const statCards = document.querySelectorAll('.stat-number');
    if (statCards.length >= 3) {
        statCards[0].textContent = expiringSoon;
        statCards[1].textContent = totalItems;
        statCards[2].textContent = expired;
    }

    // Update notification badge
    const notificationBadge = document.querySelector('.badge');
    if (notificationBadge) {
        const totalNotifications = expiringSoon + expired;
        notificationBadge.textContent = totalNotifications;
        notificationBadge.style.display = totalNotifications > 0 ? 'block' : 'none';
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const items = getItems();

    if (searchTerm.trim() === '') {
        loadItems();
        return;
    }

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm))
    );

    renderItems(recentItemsList, filteredItems, 'search');
    
    // Update expiring items section header
    const expiringHeader = document.querySelector('.expiring-items .section-header h2');
    if (expiringHeader) {
        expiringHeader.textContent = searchTerm ? 'Search Results' : 'Expiring Soon';
    }
    
    if (searchTerm) {
        renderItems(expiringItemsList, filteredItems.filter(item => isExpiringSoon(item.expiryDate)), 'search');
    }
}

function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const items = getItems();
    const updatedItems = items.filter(item => item.id !== id);
    saveItems(updatedItems);

    loadItems();
    updateStats();
    showNotification('Item deleted successfully!', 'success');
}

function editItem(id) {
    const items = getItems();
    const item = items.find(item => item.id === id);
    if (!item) return;

    // Populate form
    document.getElementById('itemName').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('purchaseDate').value = item.purchaseDate;
    document.getElementById('expiryDate').value = item.expiryDate;
    document.getElementById('notes').value = item.notes || '';

    // Store original handler
    const originalHandler = addItemForm.onsubmit;
    
    // Update form submission handler
    addItemForm.onsubmit = (e) => {
        e.preventDefault();
        
        const updatedItem = {
            ...item,
            name: document.getElementById('itemName').value,
            category: document.getElementById('category').value,
            quantity: parseInt(document.getElementById('quantity').value),
            purchaseDate: document.getElementById('purchaseDate').value,
            expiryDate: document.getElementById('expiryDate').value,
            notes: document.getElementById('notes').value
        };

        const items = getItems();
        const updatedItems = items.map(i => i.id === id ? updatedItem : i);
        saveItems(updatedItems);

        loadItems();
        updateStats();
        closeModal();
        showNotification('Item updated successfully!', 'success');

        // Reset form submission handler
        addItemForm.onsubmit = originalHandler;
    };

    openModal();
}

// UI Functions
function toggleSidebar() {
    sidebar.classList.toggle('active');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all stored data
        itemsStorage = [];
        
        showNotification('Logged out successfully!', 'success');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

function loadUserData() {
    // Simulate user data - in a real app, this would come from authentication
    const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        plan: 'Pro Plan'
    };

    const userName = userData.name || userData.email.split('@')[0];

    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = userName;

    const userAvatarEl = document.getElementById('userAvatar');
    if (userAvatarEl) {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D6EFD&color=fff`;
        userAvatarEl.src = avatarUrl;
    }
}

// Notification Functions
function initializeNotifications() {
    if (!notificationBtn || !notificationDropdown) return;

    const markAllReadBtn = document.querySelector('.mark-all-read');
    const notificationItems = document.querySelectorAll('.notification-item');
    let unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.querySelector('.badge');

    // Update badge count
    function updateBadgeCount() {
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount === 0 ? 'none' : 'block';
        }
    }

    // Toggle notification dropdown
    notificationBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
            notificationDropdown.classList.remove('active');
        }
    });

    // Mark all notifications as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            notificationItems.forEach(item => {
                item.classList.remove('unread');
            });
            unreadCount = 0;
            updateBadgeCount();
        });
    }

    // Mark individual notification as read
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains('unread')) {
                this.classList.remove('unread');
                unreadCount--;
                updateBadgeCount();
            }
        });
    });

    // Initialize badge count
    updateBadgeCount();
}

// Utility Functions
function isExpiringSoon(date) {
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
}

function isExpired(date) {
    const expiryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate < today;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    // Add animation styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function initializeSampleData() {
    // Add sample data if no items exist
    if (getItems().length === 0) {
        const sampleItems = [
            {
                id: 1,
                name: 'Milk',
                category: 'dairy',
                quantity: 2,
                purchaseDate: '2025-06-03',
                expiryDate: '2025-06-08',
                notes: 'Organic whole milk',
                createdAt: '2025-06-03T10:00:00.000Z'
            },
            {
                id: 2,
                name: 'Bread',
                category: 'pantry',
                quantity: 1,
                purchaseDate: '2025-06-04',
                expiryDate: '2025-06-10',
                notes: 'Whole wheat bread',
                createdAt: '2025-06-04T09:00:00.000Z'
            },
            {
                id: 3,
                name: 'Apples',
                category: 'fruits',
                quantity: 5,
                purchaseDate: '2025-06-02',
                expiryDate: '2025-06-12',
                notes: 'Red delicious apples',
                createdAt: '2025-06-02T14:00:00.000Z'
            },
            {
                id: 4,
                name: 'Yogurt',
                category: 'dairy',
                quantity: 3,
                purchaseDate: '2025-06-01',
                expiryDate: '2025-06-06',
                notes: 'Greek yogurt',
                createdAt: '2025-06-01T11:00:00.000Z'
            }
        ];
        
        saveItems(sampleItems);
    }
}

// Event Handlers for Modal and Keyboard Shortcuts
document.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
    if (e.target === scannerModal) {
        closeScannerModal();
    }
});

document.addEventListener('keydown', (e) => {
    // Escape key to close modals
    if (e.key === 'Escape') {
        closeModal();
        closeScannerModal();
    }
    
    // Ctrl/Cmd + N to add new item
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openModal();
    }
    
    // Ctrl/Cmd + S to open scanner
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        openScannerModal();
    }
});