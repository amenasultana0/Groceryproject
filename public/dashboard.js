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

window.reloadDataInBothTabs = async function() {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const token = user?.token;
  if (!token) return;

  try {
    const response = await fetch('http://localhost:3000/api/products', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    const items = await response.json();

    // Update global items variable
    window.currentItems = items;

    // Update dashboard UI (recent + expiring tabs)
    updateStats(items);
    renderItems(recentItemsList, items, 'recent');
    renderItems(expiringItemsList, items.filter(item => isExpiringSoon(item.expiryDate)), 'expiring');

    // Also update inventory tab UI if function exists
    if (window.renderInventoryItems) {
      window.renderInventoryItems(items);
    }
  } catch (err) {
    console.error('Failed to reload data:', err);
  }
};


document.addEventListener('DOMContentLoaded', async () => {
    await reloadDataInBothTabs();

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
    addItemForm.onsubmit = handleAddItem;
}

async function handleAddItem(e) {
    e.preventDefault();

    const newItem = {
        //id: Date.now(),
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
  await reloadDataInBothTabs(); // This will need to be updated to load from server, not localStorage
} catch (err) {
  console.error(err);
  showNotification('Error adding item. Please try again.', 'error');
}
}

let currentItems = [];

async function loadItems() {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const token = user?.token;

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
renderItems(expiringItemsList, items.filter(item => isExpiringSoon(item.expiryDate)), 'expiring');

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
    await reloadDataInBothTabs(); // refresh items after deletion

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
            await reloadDataInBothTabs(); // refresh item list from backend

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


/*const itemsPerPage = 5;
let currentPage = 1;
let currentItems = [];
let editingItemId = null;

// DOM elements
const inventoryTable = document.getElementById("inventoryTable");
const inventoryBody = document.getElementById("inventory-body");
const pagination = document.getElementById("pagination");
const addBtn = document.getElementById("addBtn");
const itemModal = document.getElementById("itemModal");
const closeModalBtn = document.getElementById("closeModal");
const itemForm = document.getElementById("itemForm");
const notification = document.getElementById("notification");

addBtn.addEventListener("click", openAddModal);
closeModalBtn.addEventListener("click", closeModal);
itemForm.addEventListener("submit", handleSubmit);

document.addEventListener("DOMContentLoaded", loadItems);

function openAddModal() {
  editingItemId = null;
  itemForm.reset();
  itemModal.style.display = "block";
}

function closeModal() {
  itemModal.style.display = "none";
  editingItemId = null;
}
// CHANGES CHANESSDFGHJKLWERTYUCVBNDFGHJDFGBHNXC DFGHCFVBGHN
async function reloadDataInBothTabs() {
  await loadItems();         // your existing function in dashboard.js to load dashboard items
  if (window.loadInventoryItems) {
    await window.loadInventoryItems();  // call inventory.js's load function if exposed
  }
}
async function loadItems() {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  if (!user || !user.token) {
    showNotification('User not logged in', 'error');
    return;
  }
  try {
    const response = await fetch('http://localhost:3000/api/products', {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch items');

    const items = await response.json();
    currentItems = items;
    renderTable();
    renderPagination();

  } catch (error) {
    console.error(error);
    showNotification('Error loading items', 'error');
  }
}

function renderTable() {
  inventoryBody.innerHTML = '';

  let start = (currentPage - 1) * itemsPerPage;
  let end = start + itemsPerPage;
  let pageItems = currentItems.slice(start, end);

  if (pageItems.length === 0) {
    inventoryBody.innerHTML = `<tr><td colspan="5" style="text-align:center">No items found</td></tr>`;
    return;
  }

  pageItems.forEach((item, index) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.expiryDate}</td>
      <td>
        <button class="edit-btn" data-id="${item.id}">Edit</button>
        <button class="delete-btn" data-id="${item.id}">Delete</button>
      </td>
    `;

    inventoryBody.appendChild(row);
  });

  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      startEdit(id);
    });
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteItem(id);
    });
  });
}

function renderPagination() {
  pagination.innerHTML = '';
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    if (i === currentPage) {
      pageBtn.disabled = true;
    }
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      renderTable();
    });
    pagination.appendChild(pageBtn);
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  if (!user || !user.token) {
    showNotification('User not logged in', 'error');
    return;
  }

  const formData = new FormData(itemForm);
  const product = {
    name: formData.get('name'),
    quantity: parseInt(formData.get('quantity')),
    expiryDate: formData.get('expiryDate'),
  };

  try {
    let response;
    if (editingItemId) {
      // Update product
      response = await fetch(`http://localhost:3000/api/products/${editingItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(product)
      });
    } else {
      // Add new product
      response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(product)
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save product');
    }

    showNotification(editingItemId ? 'Item updated successfully!' : 'Item added successfully!', 'success');
    closeModal();

    // Notify other tabs and reload
    notifyDataChange();
    await loadItems();

  } catch (error) {
    console.error(error);
    showNotification(error.message, 'error');
  }
}

async function startEdit(id) {
  const item = currentItems.find(item => item.id === id);
  if (!item) {
    showNotification('Item not found', 'error');
    return;
  }
  editingItemId = id;
  itemForm.name.value = item.name;
  itemForm.quantity.value = item.quantity;
  itemForm.expiryDate.value = item.expiryDate;
  itemModal.style.display = 'block';
}

async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  if (!user || !user.token) {
    showNotification('User not logged in', 'error');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete product');

    showNotification('Item deleted successfully!', 'success');

    // Notify other tabs and reload
    notifyDataChange();
    await loadItems();

  } catch (error) {
    console.error(error);
    showNotification('Failed to delete item', 'error');
  }
}

function showNotification(message, type = 'info') {
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// ======= SYNC FUNCTIONS ========

// Notify other tabs/pages that items have changed
function notifyDataChange() {
  localStorage.setItem('itemsUpdated', Date.now());
}

// Listen to localStorage changes to reload items if updated elsewhere
window.addEventListener('storage', (event) => {
  if (event.key === 'itemsUpdated') {
    loadItems();
  }
});*/
