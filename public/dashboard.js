// DOM Elements
const addItemBtn = document.querySelector('.add-item-btn');
const modal = document.getElementById('addItemModal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelModalBtn = document.querySelector('.cancel-modal');
const addItemForm = document.getElementById('addItemForm');
const mobileMenuBtn = document.querySelector('.mobile-menu');
const mobileCloseBtn = document.querySelector('.mobile-close');
const sidebar = document.querySelector('.sidebar');
const searchInput = document.querySelector('.search-bar input');
const expiringItemsList = document.getElementById('expiringItems');
const recentItemsList = document.getElementById('recentItems');
const logoutBtn = document.querySelector('.user-actions .icon-btn[title="Logout"]');

// Event Listeners
addItemBtn?.addEventListener('click', openModal);
closeModalBtn?.addEventListener('click', closeModal);
cancelModalBtn?.addEventListener('click', closeModal);
addItemForm?.addEventListener('submit', handleAddItem);
mobileMenuBtn?.addEventListener('click', toggleSidebar);
mobileCloseBtn?.addEventListener('click', toggleSidebar);
searchInput?.addEventListener('input', handleSearch);
logoutBtn?.addEventListener('click', handleLogout);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    updateStats();
});

// Functions
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

function handleAddItem(e) {
    e.preventDefault();

    const newItem = {
        id: Date.now(),
        name: document.getElementById('itemName').value,
        category: document.getElementById('category').value,
        quantity: document.getElementById('quantity').value,
        purchaseDate: document.getElementById('purchaseDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        notes: document.getElementById('notes').value,
        createdAt: new Date().toISOString()
    };

    // Get existing items or initialize empty array
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    items.push(newItem);
    localStorage.setItem('items', JSON.stringify(items));

    // Update UI
    loadItems();
    updateStats();
    closeModal();

    // Show notification
    showNotification('Item added successfully!', 'success');
}

function loadItems() {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    
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
            </div>
            <div class="item-actions">
                <button class="icon-btn" onclick="editItem(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    
    // Calculate stats
    const expiringSoon = items.filter(item => isExpiringSoon(item.expiryDate)).length;
    const expired = items.filter(item => isExpired(item.expiryDate)).length;
    const lowStock = items.filter(item => item.quantity <= 2).length;

    // Update stats in DOM
    document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = expiringSoon;
    document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = items.length;
    document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = expired;
    document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = lowStock;
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const items = JSON.parse(localStorage.getItem('items') || '[]');

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );

    renderItems(recentItemsList, filteredItems, 'search');
}

function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const updatedItems = items.filter(item => item.id !== id);
    localStorage.setItem('items', JSON.stringify(updatedItems));

    loadItems();
    updateStats();
    showNotification('Item deleted successfully!', 'success');
}

function editItem(id) {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const item = items.find(item => item.id === id);
    if (!item) return;

    // Populate form
    document.getElementById('itemName').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('purchaseDate').value = item.purchaseDate;
    document.getElementById('expiryDate').value = item.expiryDate;
    document.getElementById('notes').value = item.notes;

    // Update form submission handler
    addItemForm.onsubmit = (e) => {
        e.preventDefault();
        
        const updatedItem = {
            ...item,
            name: document.getElementById('itemName').value,
            category: document.getElementById('category').value,
            quantity: document.getElementById('quantity').value,
            purchaseDate: document.getElementById('purchaseDate').value,
            expiryDate: document.getElementById('expiryDate').value,
            notes: document.getElementById('notes').value
        };

        const items = JSON.parse(localStorage.getItem('items') || '[]');
        const updatedItems = items.map(i => i.id === id ? updatedItem : i);
        localStorage.setItem('items', JSON.stringify(updatedItems));

        loadItems();
        updateStats();
        closeModal();
        showNotification('Item updated successfully!', 'success');

        // Reset form submission handler
        addItemForm.onsubmit = handleAddItem;
    };

    openModal();
}

function toggleSidebar() {
    sidebar.classList.toggle('active');
}

function handleLogout() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
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
    return new Date(date) < new Date();
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <p>${message}</p>
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userData) return;

  const user = JSON.parse(userData);

  if (user && user.email) {
    const userName = user.name || user.email.split('@')[0];

    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = userName;

    const userAvatarEl = document.getElementById('userAvatar');
    if (userAvatarEl) {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D6EFD&color=fff`;
      userAvatarEl.src = avatarUrl;
    }
  }
});

// Notification functionality
document.addEventListener('DOMContentLoaded', function() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const markAllReadBtn = document.querySelector('.mark-all-read');
    const notificationItems = document.querySelectorAll('.notification-item');
    let unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.querySelector('.badge');

    // Update badge count
    function updateBadgeCount() {
        badge.textContent = unreadCount;
        if (unreadCount === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'block';
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
    markAllReadBtn.addEventListener('click', function() {
        notificationItems.forEach(item => {
            item.classList.remove('unread');
        });
        unreadCount = 0;
        updateBadgeCount();
    });

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
});
