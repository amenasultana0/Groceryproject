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

document.addEventListener('DOMContentLoaded', () => {
    loadItems();

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

async function handleAddItem(e) {
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

    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
const token = user?.token;

try {
  const response = await fetch('http://localhost:3000/api/products/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(newItem)
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Failed to add item');
  }

  showNotification('Item added successfully!', 'success');
  closeModal();
  loadItems(); // This will need to be updated to load from server, not localStorage
} catch (err) {
  console.error(err);
  showNotification('Error adding item. Please try again.', 'error');
}
}

let currentItems = [];

async function loadItems() {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const token = user?.token;

  console.log('Sending token:', token); 

  try {
    const response = await fetch('http://localhost:3000/api/products', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch items');

    const items = await response.json();
    currentItems = items;

    updateStats(items);
    renderItems(recentItemsList, items, 'recent');

  } catch (err) {
    console.error('Error loading items:', err);
    showNotification('Failed to load items from server', 'error');
  }
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
        <div class="item-card ${isExpired(item.expiryDate) ? 'expired' : ''}" data-id="${item._id}">
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
                <button class="icon-btn" onclick="editItem('${item._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete" onclick="deleteItem('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats(items) {
    const expiringSoon = items.filter(item => isExpiringSoon(item.expiryDate)).length;
    const expired = items.filter(item => isExpired(item.expiryDate)).length;
    const lowStock = items.filter(item => item.quantity <= 2).length;

    document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = expiringSoon;
    document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = items.length;
    document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = expired;
    document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = lowStock;
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();

  if (!currentItems || currentItems.length === 0) {
    renderItems(recentItemsList, [], 'search');
    return;
  }

  const filteredItems = currentItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm) ||
    item.category.toLowerCase().includes(searchTerm)
  );

  renderItems(recentItemsList, filteredItems, 'search');
}

async function deleteItem(id) {
  if (!id) {
    showNotification('Invalid item ID.', 'error');
    console.error('deleteItem called with invalid id:', id);
    return;
  }
  if (!confirm('Are you sure you want to delete this item?')) return;

  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const token = user?.token;

  try {
    const response = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete item');
    }

    showNotification('Item deleted successfully!', 'success');
    await loadItems(); // refresh items after deletion

  } catch (err) {
    console.error(err);
    showNotification('Error deleting item. Please try again.', 'error');
  }
}

function editItem(id) {
    const item = currentItems.find(item => item._id === id);
    if (!item) return;

    // Populate form
    document.getElementById('itemName').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('purchaseDate').value = item.purchaseDate;
    document.getElementById('expiryDate').value = item.expiryDate;
    document.getElementById('notes').value = item.notes;

    openModal();

    // Update form submission handler
    addItemForm.onsubmit = async function (e) {
        e.preventDefault();
        
        const updatedItem = {
            _id: item._id,
            name: document.getElementById('itemName').value,
            category: document.getElementById('category').value,
            quantity: document.getElementById('quantity').value,
            purchaseDate: document.getElementById('purchaseDate').value,
            expiryDate: document.getElementById('expiryDate').value,
            notes: document.getElementById('notes').value
        };

        try {
            const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
            const token = user?.token;

            const response = await fetch(`http://localhost:3000/api/products/${updatedItem._id}`, {
                method: 'PUT', // or PATCH depending on your backend
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updatedItem)
            });

            if (!response.ok) throw new Error('Failed to update item');

            showNotification('Item updated successfully!', 'success');
            closeModal();
            await loadItems(); // refresh item list from backend

            } catch (error) {
                console.error(error);
                showNotification('Error updating item. Please try again.', 'error');
            }

    // Reset form submit handler back to adding new items, if needed
    addItemForm.onsubmit = handleAddItem;
  };
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