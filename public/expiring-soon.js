import { populateCategoryDropdown } from './utils/categoryHelper.js';

const BACKEND_URL = 'http://127.0.0.1:3000';
let allItems = [];
let showExpiredOnly = false;
// DOM Elements
const backButton = document.getElementById('backButton');
const filterButtons = document.querySelectorAll('.filter-btn');
const viewButtons = document.querySelectorAll('.view-btn');
const searchInput = document.querySelector('.search-bar input');
const categoryFilter = document.querySelector('.category-filter');
const sortBy = document.querySelector('.sort-by');
const expiringList = document.querySelector('.expiring-list');
const emptyState = document.querySelector('.empty-state');
const clearExpiredBtn = document.querySelector('.clear-expired-btn');
const sortDropdown = document.querySelector('.sort-by');

// Event Listeners
backButton?.addEventListener('click', () => window.history.back());
filterButtons.forEach(btn => btn.addEventListener('click', handleFilterClick));
viewButtons.forEach(btn => btn.addEventListener('click', handleViewChange));
searchInput?.addEventListener('input', debounce(loadItems, 300));
categoryFilter?.addEventListener('change', loadItems);
sortBy?.addEventListener('change', loadItems);
sortDropdown?.addEventListener('change', (e) => {
  showExpiredOnly = e.target.value === 'show-expired';
  loadItems();
});
clearExpiredBtn?.addEventListener('click', clearAllExpiredItems);


// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadItems();
    console.log("populateCategoryDropdown called on Expiring Soon page");
    populateCategoryDropdown('categoryFilter');
});

function getToken() {
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userData) return undefined;

  try {
    const user = JSON.parse(userData);
    return user.token || null;
  } catch (err) {
    console.error('Failed to parse user data:', err);
    return undefined;
  }
}

// Functions
async function fetchItems() {
   try {
        const token = getToken();
        if (!token) throw new Error('No auth token found');
        
        const searchText = document.querySelector('.search-bar input').value.trim();
        const category = document.querySelector('.category-filter').value;
        const sortBy = document.querySelector('.sort-by').value;

        const queryParams = new URLSearchParams();
        if (searchText) queryParams.append('searchText', searchText);
        if (category) queryParams.append('category', category);
        if (sortBy) queryParams.append('sortBy', sortBy);
        
        const url = `${BACKEND_URL}/api/products/expiring-soon?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
});


        if (!response.ok) {
            throw new Error('Failed to fetch items from backend');
        }

        const data = await response.json();
        return data.items || data; // Adjust based on your API response structure
    } catch (error) {
        console.error(error);
        return [];
    }
}

function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}


async function loadItems() {
    allItems = await fetchItems();

    if (showExpiredOnly) {
        allItems = allItems.filter(item => getDaysUntilExpiry(item.expiryDate) < 0);
        clearExpiredBtn.style.display = 'inline-block';
    } else {
        clearExpiredBtn.style.display = 'none';
    }


    if (allItems.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    updatePriorityCounts(allItems);

    // Deduplicate before rendering
    const uniqueMap = {};
    allItems.forEach(item => {
      const key = `${item.name}_${new Date(item.expiryDate).toISOString()}`;
      uniqueMap[key] = item;
    });
    allItems = Object.values(uniqueMap);
    
    renderItems(allItems);
    updateStats(allItems); // pass items so updateStats can use it
}

async function clearAllExpiredItems() {
  try {
    const token = getToken();
    if (!token) throw new Error('No auth token found');

    const expiredItems = allItems.filter(item => getDaysUntilExpiry(item.expiryDate) < 0);
    const expiredIds = expiredItems.map(item => item.id);

    const response = await fetch(`${BACKEND_URL}/api/items/expired/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: expiredIds })
    });

    if (!response.ok) throw new Error('Failed to clear expired items');

    showNotification('Expired items cleared successfully!', 'success');
    await loadItems();
  } catch (error) {
    console.error(error);
    showNotification('Failed to clear expired items', 'error');
  }
}

function updatePriorityCounts(items) {
  // Count how many items per priority
  const counts = { high: 0, medium: 0, low: 0 };

  items.forEach(item => {
    const priority = getPriority(item.expiryDate);
    if (counts[priority] !== undefined) {
      counts[priority]++;
    }
  });

  document.getElementById('total-count').textContent = items.length;
  document.getElementById('high-priority-count').textContent = counts.high;
  document.getElementById('med-priority-count').textContent = counts.medium;
  document.getElementById('low-priority-count').textContent = counts.low;
}

function renderItems(items) {
    const currentView = document.querySelector('.view-btn.active')?.dataset.view || 'list';
    expiringList.className = `expiring-list ${currentView}-view`;
    
    expiringList.innerHTML = items.map(item => `
        <div class="expiring-item" data-category="${item.category}" data-priority="${getPriority(item.expiryDate)}">
            <div class="priority-indicator priority-${getPriority(item.expiryDate)}"></div>
            <div class="item-info">
                <div class="item-details">
                    <span class="item-name">${item.name}</span>
                    <span class="item-category">${item.category}</span>
                </div>
                <div class="item-meta">
                    <span class="quantity"><i class="fas fa-box"></i> ${item.quantity} items</span>
                    <span class="location"><i class="fas fa-map-marker-alt"></i> ${item.location || 'Not specified'}</span>
                </div>
            </div>
            <div class="expiry-info">
                <span class="expiry-date">${formatExpiryDate(item.expiryDate)}</span>
                <div class="expiry-progress ${getPriority(item.expiryDate)}">
                    <div class="progress-bar" style="width: ${getExpiryProgress(item.expiryDate)}%"></div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="action-btn mark-used-btn" title="Mark as Used" onclick="markAsUsed(${JSON.stringify(item.id)})">
                    <i class="fas fa-check"></i>
                </button>
                <button class="action-btn edit-btn" title="Edit Item" onclick="editItem(${JSON.stringify(item.id)})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete Item" onclick="deleteItem(${JSON.stringify(item.id)})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}


function filterAndSortItems() {
  const searchText = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const sortValue = sortBy.value;

  let filteredItems = items.filter(item => {
    const matchesText =
      item.name.toLowerCase().includes(searchText) ||
      item.category.toLowerCase().includes(searchText) ||
      (item.location && item.location.toLowerCase().includes(searchText));

    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;

    return matchesText && matchesCategory;
  });

    filteredItems.sort((a, b) => {
    switch (sortValue) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'priority':
        return getPriorityValue(b.expiryDate) - getPriorityValue(a.expiryDate);
      default: // expiry
        return new Date(a.expiryDate) - new Date(b.expiryDate);
    }
  });
  renderItems(filteredItems);
}  

function updateStats(items) {
    const today = new Date();
    const oneWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    const oneMonth = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    const expiringWithin24Hours = items.filter(item => isExpiringWithin24Hours(item.expiryDate)).length;
    const expiringThisWeek = items.filter(item => isExpiringBefore(item.expiryDate, oneWeek)).length;
    const expiringThisMonth = items.filter(item => isExpiringBefore(item.expiryDate, oneMonth)).length;

    // Update stats
    document.querySelector('.stat-card.urgent .stat-number').textContent = expiringWithin24Hours;
    document.querySelector('.stat-card.warning .stat-number').textContent = expiringThisWeek;
    document.querySelector('.stat-card.info .stat-number').textContent = expiringThisMonth;

    // Update progress bars
    const total = items.length || 1; // prevent division by zero
    document.querySelector('.stat-card.urgent .progress-bar').style.width = 
    `${(expiringWithin24Hours / total) * 100}%`;
    document.querySelector('.stat-card.warning .progress-bar').style.width = 
        `${(expiringThisWeek / total) * 100}%`;
    document.querySelector('.stat-card.info .progress-bar').style.width = 
        `${(expiringThisMonth / total) * 100}%`;
}

async function deleteItem(id) {
    try {
        const token = getToken();
        if (!token) throw new Error('No auth token found');
        const response = await fetch(`${BACKEND_URL}/api/items/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete item');
        await loadItems();
        showNotification('Item deleted successfully!', 'success');
    } catch (error) {
        console.error(error);
        showNotification('Failed to delete item', 'error');
    }
}

function handleFilterClick(e) {
    // Find the closest button with the filter-btn class, even if an icon or span inside is clicked
    const clickedBtn = e.target.closest('.filter-btn');
    if (!clickedBtn) return;  // click happened outside buttons, ignore

    // Remove 'active' class from all buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));

    // Add 'active' class to clicked button
    clickedBtn.classList.add('active');

    // Then apply your filtering logic
    applyFilters();
}

function handleViewChange(e) {
    viewButtons.forEach(btn => btn.classList.remove('active'));
    e.target.closest('.view-btn').classList.add('active');
    applyFilters();
}

function handleSearch() {
    applyFilters();
}

function handleFilters() {
    applyFilters();
}

function handleSort() {
    applyFilters();
}

function getFilterName(button) {
  for (const node of button.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text.length > 0) return text;
    }
  }
  return '';
}

function applyFilters() {
    let items = [...allItems];
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const sortValue = sortBy.value;
    
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? getFilterName(activeFilterBtn) : 'All Items';
    // Apply search filter
    if (searchTerm) {
        items = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply category filter
    if (category) {
        items = items.filter(item => item.category === category);
    }

    // Apply priority filter
    if (activeFilter.trim().toLowerCase() !== 'all items') {
        const priority = activeFilter.replace(' Priority', '').toLowerCase();
        items = items.filter(item => getPriority(item.expiryDate) === priority);
    }
    
    // Apply sorting
    items.sort((a, b) => {
        switch (sortValue) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'category':
                return a.category.localeCompare(b.category);
            case 'priority':
                return getPriorityValue(b.expiryDate) - getPriorityValue(a.expiryDate);
            default: // 'expiry'
                return new Date(a.expiryDate) - new Date(b.expiryDate);
        }
    });
    renderItems(items);
}

async function markAsUsed(id) {
    try {
        const token = getToken();
        if (!token) throw new Error('No auth token found');
        const response = await fetch(`${BACKEND_URL}/api/items/${id}/use`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to mark as used');
        
        await loadItems();
        showNotification('Item marked as used!', 'success');
    }catch (error) {
        console.error(error);
        showNotification('Failed to mark item as used', 'error');
    }
}

    
// Utility Functions
function getPriority(expiryDate) {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    if (daysUntilExpiry <= 1) return 'high';
    if (daysUntilExpiry <= 7) return 'medium';
    return 'low';
}

function getPriorityValue(expiryDate) {
    const priority = getPriority(expiryDate);
    switch (priority) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
    }
}

function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);

    // Reset both to midnight (local time) to avoid hour-based errors
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24)); // round avoids fractional issues
}


function isExpiringWithin24Hours(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return expiry.setHours(23, 59, 59, 999) >= now;
}

function getExpiryProgress(expiryDate) {
    const totalDays = 30; // define a max threshold for progress
    const daysLeft = getDaysUntilExpiry(expiryDate);
    if (daysLeft < 0) return 0;
    if (daysLeft > totalDays) return 100;
    return (daysLeft / totalDays) * 100;
}

function formatExpiryDate(date) {
    const daysUntilExpiry = getDaysUntilExpiry(date);
    if (daysUntilExpiry === 0) return 'Expires Today';
    if (daysUntilExpiry === 1) return 'Expires Tomorrow';
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 7) return `Expires in ${daysUntilExpiry} days`;
    return `Expires on ${new Date(date).toLocaleDateString()}`;
}

function isExpiringToday(date) {
    return getDaysUntilExpiry(date) === 0;
}

function isExpiringBefore(date, beforeDate) {
    return new Date(date) <= beforeDate;
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

    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return expiryDate < today;
}


function showEmptyState() {
    expiringList.style.display = 'none';
    emptyState.style.display = 'block';
}

function hideEmptyState() {
    expiringList.style.display = 'flex';
    emptyState.style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <p>${message}</p>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export functionality
document.querySelector('.export-btn')?.addEventListener('click', () => {
    if (allItems.length === 0) {
        showNotification('No items to export', 'error');
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
        + "Name,Category,Quantity,Expiry Date,Location\n"
        + allItems.map(item => 
            `${item.name},${item.category},${item.quantity},${item.expiryDate},${item.location || 'Not specified'}`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expiring-items.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Print functionality
document.querySelector('.print-btn')?.addEventListener('click', () => {
    window.print();
}); 