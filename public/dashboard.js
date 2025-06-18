import { populateCategoryDropdown } from './utils/categoryHelper.js'; 

// This runs only once on redirect from Google login
(function handleGoogleRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userParam = urlParams.get('user');

  if (token && userParam) {
    try {
      const userData = JSON.parse(decodeURIComponent(userParam));
      const user = {
        id: userData.id,  // optional: add `id` from backend if available
        name: userData.name,
        email: userData.email,
        token
      };

      // You can decide to store in localStorage or sessionStorage
      localStorage.setItem("user", JSON.stringify(user));

      // Remove query params from URL after storing
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (err) {
      console.error("Failed to parse user data from Google login:", err);
    }
  }
})();

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
const notificationBtn = document.querySelector('.notification-btn');
const notificationsPanel = document.getElementById('notificationsPanel');
const notificationsList = document.getElementById('notificationsList');
const notificationsIcon = document.querySelector('.notification-btn');
const notificationBadge = notificationsIcon.querySelector('.badge');

const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');
const email = urlParams.get('email');
const name = urlParams.get('name');

const socket = io('http://localhost:3000');

let currentItems = [];
let notifications = [];

// Event Listeners
addItemBtn?.addEventListener('click', openModal);
closeModalBtn?.addEventListener('click', closeModal);
cancelModalBtn?.addEventListener('click', closeModal);
addItemForm?.addEventListener('submit', handleAddItem);
mobileMenuBtn?.addEventListener('click', toggleSidebar);
mobileCloseBtn?.addEventListener('click', toggleSidebar);
searchInput?.addEventListener('input', handleSearch);
logoutBtn?.addEventListener('click', handleLogout);
notificationBtn?.addEventListener('click', toggleNotificationsPanel);



// Initial Load
window.addEventListener('DOMContentLoaded', () => {
  setUserInfo();

  // Delay loadItems slightly to ensure token is set
  setTimeout(() => {
    loadItems();
    fetchUnreadNotificationCount();
    populateCategoryDropdown('category');
  }, 100); 
});

// Notification socket
socket.on('notification', (data) => {
  notifications.push(data);
  updateUnreadCount(notifications.length);
  if (notificationsPanel.style.display === 'block') {
    renderNotifications();
  }
});

// Functions
function openModal() {
    modal.classList.add('active');
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
  const newItem = getItemFormData();
  const token = getToken();

  try {
    const response = await fetch('http://localhost:3000/api/products/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newItem)
    });

    if (!response.ok) throw new Error('Failed to add item');

    showNotification('Item added successfully!', 'success');
    closeModal();
    loadItems();
  } catch (err) {
    showNotification('Error adding item. Please try again.', 'error');
  }
}

async function loadItems() {
  const token = getToken();
  try {
    const response = await fetch('http://localhost:3000/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    const items = await response.json();
    currentItems = items;
    updateStats(items);

    const sortedItems = items
      .filter(item => item.createdAt) // Only include items with a createdAt
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderItems(recentItemsList, sortedItems.slice(0, 3)); // pick latest 3

  } catch (err) {
    showNotification('Failed to load items from server', 'error');
  }
}

function renderItems(container, items) {
  if (!container) return;
  container.innerHTML = items.length === 0 ? `
    <div class="empty-state">
      <i class="fas fa-box-open"></i>
      <p>No items to display</p>
    </div>` : items.map(item => `
    <div class="item-card ${isExpired(item.expiryDate) ? 'expired' : ''}" data-id="${item._id}">
      <div class="item-header">
        <h3>${item.name}</h3>
        <span class="category-badge">${item.category}</span>
      </div>
      <div class="item-details">
        <div class="detail"><i class="fas fa-calendar"></i><span>Expires: ${formatDate(item.expiryDate)}</span></div>
        <div class="detail"><i class="fas fa-box"></i><span>Quantity: ${item.quantity}</span></div>
      </div>
      <div class="item-actions">
        <button class="icon-btn edit-btn"><i class="fas fa-edit"></i></button>
        <button class="icon-btn delete-btn"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');

  // Attach listeners after rendering
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.closest('.item-card').dataset.id;
      deleteItem(itemId);
    });
  });

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.closest('.item-card').dataset.id;
      editItem(itemId);
    });
  });
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
  const term = e.target.value.toLowerCase();
  const filtered = currentItems.filter(item => item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term));
  renderItems(recentItemsList, filtered);
}

async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  const token = getToken();
  try {
    const response = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error();
    showNotification('Item deleted successfully!', 'success');
    loadItems();
  } catch {
    showNotification('Error deleting item.', 'error');
  }
}

function editItem(id) {
  const item = currentItems.find(i => i._id === id);
  if (!item) return;

  document.getElementById('itemName').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('quantity').value = item.quantity;
  document.getElementById('purchaseDate').value = item.purchaseDate;
  document.getElementById('expiryDate').value = item.expiryDate;
  document.getElementById('notes').value = item.notes;

  openModal();

  addItemForm.onsubmit = async (e) => {
    e.preventDefault();
    const updatedItem = getItemFormData();
    updatedItem._id = item._id;

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/products/${updatedItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedItem)
      });
      if (!response.ok) throw new Error();
      showNotification('Item updated successfully!', 'success');
      closeModal();
      loadItems();
    } catch {
      showNotification('Error updating item.', 'error');
    }
  };
}
        
function getItemFormData() {
  return {
    name: document.getElementById('itemName').value,
    category: document.getElementById('category').value,
    quantity: document.getElementById('quantity').value,
    purchaseDate: document.getElementById('purchaseDate').value,
    expiryDate: document.getElementById('expiryDate').value,
    notes: document.getElementById('notes').value,
    createdAt: new Date().toISOString()
  };
}

function toggleSidebar() {
    sidebar.classList.toggle('active');
}

function handleLogout() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    location.href = 'login.html';
}

function isExpired(date) {
    return new Date(date) < new Date();
}

function isExpiringSoon(date) {
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getToken() {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.token || null;
  } catch {
    return null;
  }
}

// function setUserInfo() {
//   const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  
//   if (!userStr) return;
//   const user = JSON.parse(userStr);
//   console.log('Parsed user object:', user);
//   const name = user?.user?.name || (user?.user?.email ? user.user.email.split('@')[0] : 'User');

//   const userNameEl = document.getElementById('userName');
//   if (userNameEl) userNameEl.textContent = name;

//   const userAvatarEl = document.getElementById('userAvatar');
//   if (userAvatarEl) userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D6EFD&color=fff`;
// }

function setUserInfo() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userStr) return;

  let user;
  try {
    user = JSON.parse(userStr);
  } catch (err) {
    console.error('Invalid user data:', userStr);
    return;
  }

  const name = user?.name || (user?.email ? user.email.split('@')[0] : 'User');

  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = name;

  const userAvatarEl = document.getElementById('userAvatar');
  if (userAvatarEl) {
    userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D6EFD&color=fff`;
  }
}




function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `notification-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('hide'), 3000);
  setTimeout(() => toast.remove(), 3500);
}

function toggleNotificationsPanel() {
  notificationsPanel.style.display = notificationsPanel.style.display === 'block' ? 'none' : 'block';
  if (notificationsPanel.style.display === 'block') {
    renderNotifications();
    markNotificationsAsRead();
  }
}

function renderNotifications() {
  notificationsList.innerHTML = '';
  notifications.forEach((notif, index) => {
    const li = document.createElement('li');
    li.textContent = notif.message || `Notification ${index + 1}`;
    notificationsList.appendChild(li);
  });
}

function updateUnreadCount(count) {
  notificationBadge.textContent = count;
  notificationBadge.style.display = count > 0 ? 'inline-block' : 'none';
}

async function fetchUnreadNotificationCount() {
  const token = getToken();
  try {
    const response = await fetch('http://localhost:3000/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return;
    const data = await response.json();
    updateUnreadCount(data.count || 0);
  } catch (err) {
    console.error('Error fetching notification count:', err);
  }
}

async function markNotificationsAsRead() {
  const token = getToken();
  try {
    const response = await fetch('http://localhost:3000/api/notifications/mark-read', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error();
    updateUnreadCount(0);
  } catch (err) {
    console.error('Error marking notifications as read:', err);
  }
}


