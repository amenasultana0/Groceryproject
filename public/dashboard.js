//import { base } from '../models/Product.js';
import { populateCategoryDropdown } from './utils/categoryHelper.js';

const profileBtn = document.getElementById('profileBtn');
const profilePopup = document.getElementById('profilePopup');

profileBtn.addEventListener('click', () => {
  profilePopup.classList.toggle('hidden');
});

// Close when clicking outside
document.addEventListener('click', (e) => {
  if (!profileBtn.contains(e.target) && !profilePopup.contains(e.target)) {
    profilePopup.classList.add('hidden');
  }
});

// Example: Set user info dynamically if needed
document.getElementById('userName').textContent = "John Doe"; // Replace with your user variable
document.getElementById('userAvatar').src = "https://ui-avatars.com/api/?name=User"; // Replace dynamically

// --- Google Login Redirect Handler ---
(function handleGoogleRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userParam = urlParams.get('user');
  if (token && userParam) {
    try {
      const userData = JSON.parse(decodeURIComponent(userParam));
      const user = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        token
      };
      localStorage.setItem("user", JSON.stringify(user));
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (err) {
      console.error("Failed to parse user data from Google login:", err);
    }
  }
})();

// --- DOM Elements ---
const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
const addItemBtn = document.querySelector('.add-item-btn');
const modal = document.getElementById('addItemModal');
const scannerModal = document.getElementById('scannerModal');
const closeModalBtn = document.querySelector('.close-modal');
const closeScannerBtn = document.querySelector('.close-scanner');
const cancelModalBtn = document.querySelector('.cancel-modal');
const addItemForm = document.getElementById('addItemForm');
const sidebarToggleBtn = document.querySelector('.sidebar-toggle');
const mobileCloseBtn = document.querySelector('.mobile-close');
const sidebar = document.querySelector('.sidebar');
const searchInput = document.querySelector('.search-bar input');
const expiringItemsList = document.getElementById('expiringItems');
const recentItemsList = document.getElementById('recentItems');
const logoutBtn = document.querySelector('.user-actions .icon-btn[title="Logout"]');
const scannerBtn = document.getElementById('scannerBtn') || document.querySelector('.scanner-btn');
const manualEntryBtn = document.getElementById('manualEntry');
const notificationBtn = document.querySelector('.navbar-icon[title="Notifications"]');
const notificationsPanel = document.getElementById('notificationsPanel');
const notificationBadge = document.querySelector('.notification-btn .badge') || document.querySelector('.badge');
const micButton = document.getElementById('micButton');
const unitOfMeasurement = document.getElementById('unitOfMeasurement').value;
const costPrice = parseFloat(document.getElementById('costPrice').value);


// --- State ---
let currentItems = [];
let notifications = [];
let isScanning = false;
let html5QrCode = null;
let notificationPanelTimeout = null;
let notificationPanelHovered = false;
let notificationPanelShouldAutoClose = false;

// --- Socket ---
const socket = io('http://localhost:3000');

// --- Utility Functions ---
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
  return expiryDate <= today;
}
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function showNotification(message, type = 'info') {
  let container = document.getElementById('notificationToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationToastContainer';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `notification-toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('hide'), 4000);
  setTimeout(() => toast.remove(), 4300);
}

// --- Modal Functions ---
function openModal() {
  modal.classList.add('active');
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('addItemModal').classList.add('show');
  document.getElementById('purchaseDate').value = today;
  document.getElementById('purchaseDate').max = today;
  document.getElementById('expiryDate').min = today;
}
function closeModal() {
  modal.classList.remove('active');
  addItemForm.reset();
  addItemForm.onsubmit = handleAddItem;
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
// --- Sidebar Functions ---
function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  sidebar.classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
  document.querySelector('.main-content').classList.toggle('sidebar-collapsed');
}

function openSidebar() {
  sidebar.classList.remove('collapsed');
  sidebar.classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
  sidebar.classList.add('collapsed');
  sidebar.classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
  document.querySelector('.main-content').classList.add('sidebar-collapsed');
}
let lastScanErrorTime = 0;

async function startScanner() {
  if (isScanning) return;
  isScanning = true;
  const qrRegion = document.getElementById('reader');
  qrRegion.innerHTML = '';
  html5QrCode = new Html5Qrcode("reader");
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      onScanError
    );
  } catch (err) {
    showNotification("Camera error: " + err, "error");
    isScanning = false;
  }
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      isScanning = false;
    }).catch(() => {
      isScanning = false;
    });
  }
}

// --- Updated Scan Success & Error Handlers ---
async function onScanSuccess(decodedText, decodedResult) {
  console.log("Scanned: ", decodedText);
  await stopScanner();
  console.log("Stopping scanner after successful scan");
  closeScannerModal();

  const code = decodedText.replace(/\D/g, '');
  let productName = '';
  let category = 'others';
  let unitOfMeasurement = 'pcs';
  let costPrice = '';
  let expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  if (!code) {
    showNotification("Invalid code scanned.", "error");
    // Open modal for manual entry
    console.log("Opening modal for manual entry");
    openModal();
    document.getElementById('barcode').value = decodedText;
    return;
  }

  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await res.json();
    if (data.status === 1) {
      const product = data.product;
      productName = product.product_name || '';
      // Category: use first tag, fallback to 'others'
      if (Array.isArray(product.categories_tags) && product.categories_tags.length > 0) {
        category = product.categories_tags[0].replace('en:', '');
      }
      // Unit: try to extract from quantity string, fallback to 'pcs'
      if (product.quantity) {
        // e.g. "500 g" or "1 L"
        const match = product.quantity.match(/(\d+)\s*([a-zA-Z]+)/);
        unitOfMeasurement = match ? match[2].toLowerCase() : 'pcs';
        // Map common units to your select options
        if (unitOfMeasurement === 'l') unitOfMeasurement = 'litre';
        if (unitOfMeasurement === 'ml') unitOfMeasurement = 'ml';
        if (unitOfMeasurement === 'kg') unitOfMeasurement = 'kg';
        if (unitOfMeasurement === 'g') unitOfMeasurement = 'g';
        if (unitOfMeasurement === 'pcs' || unitOfMeasurement === 'piece' || unitOfMeasurement === 'pieces') unitOfMeasurement = 'pcs';
      }
      costPrice = product.price || '';
      showNotification(`Scanned: ${productName || code}`, "success");
    } else {
      showNotification("Product not found. Please enter details manually.", "error");
    }
  } catch (err) {
    showNotification("API error. Please try again.", "error");
  }

  // Fill the form fields and open the modal (only once)
  console.log("Opening modal with scanned data");
  openModal();
  document.getElementById('barcode').value = decodedText;
  document.getElementById('itemName').value = productName;
  document.getElementById('category').value = category;
  document.getElementById('quantity').value = 1;
  document.getElementById('unitOfMeasurement').value = unitOfMeasurement;
  document.getElementById('costPrice').value = costPrice;
  document.getElementById('expiryDate').value = expiryDate.toISOString().split('T')[0];
}

function onScanError(errorMessage) {
  // Optionally show scan errors in debug
  console.warn(errorMessage);
}

// --- Scanner Modal Events ---
scannerBtn?.addEventListener('click', () => {
  openScannerModal();
  setTimeout(startScanner, 300); // Give modal time to show
});
closeScannerBtn?.addEventListener('click', () => {
  stopScanner();
  closeScannerModal();
});
cancelModalBtn?.addEventListener('click', () => {
  stopScanner();
  closeModal();
});
manualEntryBtn?.addEventListener('click', () => {
  stopScanner();
  closeScannerModal();
  openModal();
});
document.addEventListener('click', (e) => {
  if (e.target === scannerModal) {
    stopScanner();
    closeScannerModal();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    stopScanner();
    closeScannerModal();
  }
});

// --- Item Management ---
async function handleAddItem(e) {
  e.preventDefault();
  const newItem = getItemFormData();
  const token = getToken();

  // Fetch the latest items from the backend before checking for duplicates
  let items = [];
  try {
    const res = await fetch('http://localhost:3000/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      items = await res.json();
    }
  } catch (err) {
    showNotification('Could not check for duplicates. Please try again.', 'error');
    return;
  }

  // Check for duplicates
  const exists = items.some(item =>
    item.name === newItem.name &&
    item.expiryDate === newItem.expiryDate &&
    item.purchaseDate === newItem.purchaseDate
  );

  if (exists) {
    showNotification('This item already exists in your inventory.', 'warning');
    return;
  }

  // Add the new item
  try {
    const response = await fetch('http://localhost:3000/api/products/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newItem)
    });
    if (!response.ok) throw new Error('Failed to add item');
    closeModal();
    loadItems(); // or fetchAndRenderProducts(), depending on your codebase
    showNotification('Item added successfully!', 'success');
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
    let items = await response.json();
    // Deduplicate by name+expiryDate
    const uniqueItemsMap = {};
    items.forEach(item => {
      const key = `${item.name}_${item.expiryDate}_${item.quantity}`;
      uniqueItemsMap[key] = item;
    });
    items = Object.values(uniqueItemsMap);
    currentItems = items;
    updateStats(items);
    const expiringItems = items.filter(item => isExpiringSoon(item.expiryDate))
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      .slice(0, 3);
    renderItems(expiringItemsList, expiringItems);
    const sortedItems = items
      .filter(item => item.createdAt && item.quantity > 0 && !item.deleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderItems(recentItemsList, sortedItems.slice(0, 3));
    renderOutOfStockList(items);
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
        <div class="meta-info">
          <i class="fas fa-calendar"></i>
          <span>Expires: ${formatDate(item.expiryDate)}</span>
        </div>
        <div class="meta-info">
          <i class="fas fa-box"></i>
          <span>Quantity: ${item.quantity}</span>
        </div>
      </div>

      <div class="item-actions">
        <button class="icon-btn edit-btn"><i class="fas fa-edit"></i></button>
        <button class="icon-btn delete-btn"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
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
  const outOfStock = items.filter(item => item.quantity === 0).length;
  document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = expiringSoon;
  document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = items.length;
  document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = expired;
  document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = lowStock;
  document.getElementById('outOfStockCount').textContent = outOfStock;
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
    loadItems();
    showNotification('Item deleted successfully!', 'success');
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
  document.getElementById('costPrice').value = item.costDate;
  document.getElementById('unitOfMeasurement').value = item.unitOfMeasurement;
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
    purchaseDate: document.getElementById('purchaseDate').value,
    unitOfMeasurement: document.getElementById('unitOfMeasurement').value,
    costPrice: parseFloat(document.getElementById('costPrice').value),
    barcode: document.getElementById('barcode').value,
    notes: document.getElementById('notes').value,
    createdAt: new Date().toISOString()
  };
}

// --- User Info ---
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

// --- Notification Functions ---
function toggleNotificationsPanel() {
  if (!notificationsPanel) return;
  notificationsPanel.classList.toggle('active');
  if (notificationsPanel.classList.contains('active')) {
    renderNotificationsPanel();
    markAllNotificationsAsRead();
    updateUnreadCount(0);
    clearTimeout(notificationPanelTimeout);
  } else {
    clearTimeout(notificationPanelTimeout);
  }
}
async function markAllNotificationsAsRead() {
  try {
    await fetch('http://localhost:3000/api/notifications/mark-read', { method: 'PUT', headers: { 'Authorization': `Bearer ${getToken()}` } });
    notifications.forEach(n => n.read = true);
  } catch (e) {}
}
function renderNotificationsPanel() {
  if (!notificationsPanel) return;

  const backendNotifications = notifications.filter(n => n._id);
  if (!backendNotifications.length) {
    notificationsPanel.innerHTML = `<div class="notification-item">No notifications yet.</div>`;
    return;
  }

 notificationsPanel.innerHTML = `
  <div>
    <button id="clearNotificationsBtn" class="btn-secondary" style="margin-bottom: 10px;">
      Clear All
    </button>
  </div>
  ${backendNotifications.map(n => `
    <div class="notification-item${n.read ? '' : ' unread'}" data-id="${n._id}">
      <span class="icon"><i class="fas fa-bell"></i></span>
      <div class="content">
        <div>${n.message}</div>
        <div class="time">${new Date(n.createdAt).toLocaleString()}</div>
      </div>
      <button class="delete-notification-btn" title="Delete"><i class="fas fa-trash"></i></button>
    </div>
  `).join('')}
`;

  const clearBtn = document.getElementById('clearNotificationsBtn');
  if (clearBtn) {
    clearBtn.style.display = notifications.length > 0 ? 'block' : 'none';

    clearBtn.addEventListener('click', async () => {
      if (!confirm("Are you sure you want to clear all notifications?")) return;

      try {
        await fetch('http://localhost:3000/api/notifications/clear', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` }
        });

        notifications = [];
        updateUnreadCount(0);
        renderNotificationsPanel();
        showNotification("All notifications cleared!", "success");
      } catch (err) {
        showNotification("Failed to clear notifications", "error");
      }
    });
  }
  notificationsPanel.querySelectorAll('.delete-notification-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const itemDiv = btn.closest('.notification-item');
      const id = itemDiv.getAttribute('data-id');
      if (!id) {
        showNotification('Notification ID not found', 'error');
        return;
      }
      try {
        await fetch(`http://localhost:3000/api/notifications/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const idx = notifications.findIndex(n => n._id === id);
        if (idx > -1) notifications.splice(idx, 1);
        renderNotificationsPanel();
        clearTimeout(notificationPanelTimeout);
        notificationPanelTimeout = setTimeout(() => {
          if (!notificationPanelHovered) {
            notificationsPanel.classList.remove('active');
          }
        }, 5000);
      } catch (err) {
        showNotification('Failed to delete notification', 'error');
      }
    });
  });
}
function updateUnreadCount(count) {
  if (notificationBadge) {
    notificationBadge.textContent = count;
    notificationBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }
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

async function fetchAndRenderOutOfStock() {
  const res = await fetch('http://localhost:3000/api/products/out-of-stock', {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const items = await res.json();
  const list = document.querySelector('.outofstock-sidebar-list');
  const countSpan = document.getElementById('outOfStockCount');
  
  list.innerHTML = ''; // clear old list
  countSpan.textContent = items.length;

  if (items.length === 0) {
    list.innerHTML = '<li class="empty-msg">All products are in stock.</li>';
    return;
  }

  items.forEach(prod => {
    const li = document.createElement('li');
    li.className = 'outofstock-item';
    li.innerHTML = `
      <div class="item-info">
        <strong>${prod.name}</strong> (${prod.category || 'Uncategorized'})
        <p>Expired on: ${new Date(prod.expiryDate).toLocaleDateString()}</p>
      </div>
      <button class="delete-outofstock-btn" data-id="${prod._id}">🗑️</button>
    `;
    list.appendChild(li);
  });

  attachOutOfStockDeleteHandlers(); // attach delete events
}

// --- Event Listeners ---
addItemBtn?.addEventListener('click', openModal);
closeModalBtn?.addEventListener('click', closeModal);
closeScannerBtn?.addEventListener('click', closeScannerModal);
cancelModalBtn?.addEventListener('click', closeModal);
addItemForm?.addEventListener('submit', handleAddItem);
sidebarToggleBtn?.addEventListener('click', toggleSidebar);
mobileCloseBtn?.addEventListener('click', closeSidebar);
// Sidebar overlay click to close
document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
  if (window.innerWidth > 768) return; // Only on mobile
  
  if (
  sidebar && sidebarToggleBtn &&
  !sidebar.contains(e.target) &&
  !sidebarToggleBtn.contains(e.target)
) {
  closeSidebar();

  }
});

// Handle window resize
window.addEventListener('resize', function() {
  if (window.innerWidth > 768) {
    // On desktop, remove mobile-specific classes but keep collapsed state if set
    sidebar.classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  } else {
    // On mobile, start with sidebar hidden
    if (!sidebar.classList.contains('open')) {
      sidebar.classList.add('collapsed');
    }
  }
});
searchInput?.addEventListener('input', handleSearch);
logoutBtn?.addEventListener('click', handleLogout);
scannerBtn?.addEventListener('click', () => {
  openScannerModal();
  setTimeout(startScanner, 300);
});
manualEntryBtn?.addEventListener('click', () => {
  stopScanner();
  closeScannerModal();
  openModal();
});
notificationBtn?.addEventListener('click', function(e) {
  e.stopPropagation(); // Prevent document click from firing
  toggleNotificationsPanel();
});
document.addEventListener('click', (e) => {
  // Close modal if clicking outside
  if (e.target === modal) closeModal();
  if (e.target === scannerModal) {
    stopScanner();
    closeScannerModal();
  }
  // --- ADD THIS BLOCK ---
  // Close notifications panel if clicking outside
  if (
    notificationsPanel &&
    notificationsPanel.classList.contains('active') &&
    !notificationsPanel.contains(e.target) &&
    e.target !== notificationBtn
  ) {
    notificationsPanel.classList.remove('active');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    stopScanner();
    closeScannerModal();
    closeModal();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openModal();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    openScannerModal();
    setTimeout(startScanner, 300);
  }
});

micButton?.addEventListener('click', () => {
  const micPanel = document.getElementById('micPanel');
  micPanel.classList.remove('hidden');

  if (!('webkitSpeechRecognition' in window)) {
    showNotification("Speech recognition not supported", "error");
    micPanel.classList.add('hidden');
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    // Set the recognized text in the search bar and trigger search
    if (searchInput) {
      searchInput.value = transcript.replace(/\.$/, "");
      searchInput.dispatchEvent(new Event('input')); // This triggers your search/filter logic
    }
    showNotification(`You said: ${transcript}`, "info");
    micPanel.classList.add('hidden');
  };

  recognition.onerror = (event) => {
    showNotification("Mic error: " + event.error, "error");
    micPanel.classList.add('hidden');
  };

  recognition.onend = () => {
    micPanel.classList.add('hidden');
  };
});

// --- Initial Load ---
window.addEventListener('DOMContentLoaded', async () => {
  setUserInfo();

  setTimeout(async () => {
    loadItems();
    populateCategoryDropdown('category');
    try {
      const res = await fetch('http://localhost:3000/api/notifications', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      notifications = await res.json();
      renderNotificationsPanel();
    } catch {
      notifications = [];
      renderNotificationsPanel();
    }
  }, 100);
  fetchAndRenderOutOfStock();
});

// --- Notification socket ---
socket.on('newNotification', (data) => {
  notifications.unshift(data);
  updateUnreadCount(notifications.length);
  renderNotificationsPanel();
  showNotification(data.message, 'info');
});

notificationsPanel?.addEventListener('mouseenter', () => {
  notificationPanelHovered = true;
  clearTimeout(notificationPanelTimeout);
});
notificationsPanel?.addEventListener('mouseleave', () => {
  notificationPanelHovered = false;
  if (notificationPanelShouldAutoClose) {
    clearTimeout(notificationPanelTimeout);
    notificationPanelTimeout = setTimeout(() => {
      if (!notificationPanelHovered) {
        notificationsPanel.classList.remove('active');
        notificationPanelShouldAutoClose = false;
      }
    }, 5000);
  }
});

// --- Logout ---
function handleLogout() {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  location.href = 'login.html';
}

async function fetchAndRenderOutOfStockItems() {
  const token = getToken();
  try {
    const res = await fetch(`http://localhost:3000/api/products/out-of-stock`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const items = await res.json();

    const list = document.querySelector('.outofstock-sidebar-list');
    list.innerHTML = '';

    if (items.length === 0) {
      list.innerHTML = `<li style="padding: 1rem;">🎉 No out of stock items</li>`;
      return;
    }

    for (const item of items) {
      const li = document.createElement('li');
      li.setAttribute('data-id', item._id);
      li.classList.add('outofstock-item');
      li.innerHTML = `
        <span class="item-info">
          <i class="fas fa-box"></i> ${item.name} (${item.category || 'Uncategorized'})
        </span>
        <span class="quantity">${item.quantity}</span>
        <button class="delete-outofstock-btn" title="Delete permanently">🗑️</button>
      `;
      list.appendChild(li);
    }

    document.getElementById('outOfStockCount').textContent = items.length;

    attachOutOfStockDeleteHandlers(); // Make delete work after render
  } catch (err) {
    console.error('Error fetching out of stock items:', err);
  }
}

function renderOutOfStockList(items) {
  const outofstockList = document.querySelector('.outofstock-list');
  if (!outofstockList) return;

  const outOfStockItems = items.filter(item => item.quantity === 0);
  if (outOfStockItems.length === 0) {
    outofstockList.innerHTML = '<li><span class="item-info"><i class="fas fa-cart-arrow-down"></i> No out of stock items</span></li>';
    return;
  }

  outofstockList.innerHTML = outOfStockItems.map(item => `
    <li data-id="${item._id}" class="outofstock-item">
      <span class="item-info">
        <i class="fas fa-box"></i> ${item.name} (${item.category || 'Uncategorized'})
      </span>
      <span class="quantity">${item.quantity}</span>
      <button class="delete-outofstock-btn" title="Delete permanently">🗑️</button>
    </li>
  `).join('');

  // Attach delete button functionality
  attachOutOfStockDeleteHandlers();
}

function attachOutOfStockDeleteHandlers() {
  document.querySelectorAll('.delete-outofstock-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const li = button.closest('li');
      const productId = li?.dataset.id;
      if (!productId) return;

      const confirmDelete = confirm("Are you sure you want to permanently delete this product?");
      if (!confirmDelete) return;

      try {
        const res = await fetch(`http://localhost:3000/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });

        if (res.ok) {
          showNotification("Product deleted successfully.", "success");
          li.remove();
          loadItems(); // refresh stats or dashboard
        } else {
          showNotification("Failed to delete product.", "error");
        }
      } catch (err) {
        console.error('Delete error:', err);
        showNotification("Error deleting product.", "error");
      }
    });
  });
}

document.querySelectorAll('.delete-outofstock-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    const id = li.getAttribute('data-id');
    if (!id) return;

    if (confirm('Are you sure you want to permanently delete this item?')) {
      try {
        const res = await fetch(`http://localhost:3000/api/products/out-of-stock/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) {
          li.remove(); // remove from DOM
          loadItems(); // refresh stats
        } else {
          alert('Failed to delete item.');
        }
      } catch (err) {
        alert('Error deleting item.');
      }
    }
  });
});

const outOfStockCard = document.getElementById('outOfStockCard');
const outOfStockSidebar = document.getElementById('outOfStockSidebar');
const closeOutOfStockSidebar = document.getElementById('closeOutOfStockSidebar');

if (outOfStockCard && outOfStockSidebar && closeOutOfStockSidebar) {
  outOfStockCard.addEventListener('click', () => {
    outOfStockSidebar.classList.add('open');
    outOfStockSidebar.classList.remove('hidden');
    fetchAndRenderOutOfStockItems(); // 👈 call fetch here
  });
  closeOutOfStockSidebar.addEventListener('click', () => {
    outOfStockSidebar.classList.remove('open');
    outOfStockSidebar.classList.add('hidden');
  });
}

document.getElementById('clearAllOutOfStock').addEventListener('click', async () => {
  const confirmClear = confirm('Are you sure you want to permanently delete all out of stock items?');
  if (!confirmClear) return;

  try {
    const res = await fetch('http://localhost:3000/api/products/clear-out-of-stock', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const result = await res.json();
    if (res.ok) {
      showNotification(`Deleted ${result.deletedCount} out-of-stock items.`, 'success');
      fetchAndRenderOutOfStockItems();
      loadItems(); // refresh stats
    } else {
      showNotification(result.error || 'Failed to clear out-of-stock items', 'error');
    }
  } catch (err) {
    console.error(err);
    showNotification('Server error while deleting.', 'error');
  }
});
