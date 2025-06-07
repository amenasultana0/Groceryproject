import { populateCategoryDropdown } from '../utils/categoryHelper.js'; 

const BACKEND_URL = 'http://127.0.0.1:3000';
let allItems = [];
// DOM Elements
const backButton = document.getElementById('backButton');
const filterButtons = document.querySelectorAll('.filter-btn');
const viewButtons = document.querySelectorAll('.view-btn');
const searchInput = document.querySelector('.search-bar input');
const categoryFilter = document.querySelector('.category-filter');
const sortBy = document.querySelector('.sort-by');
const expiringList = document.querySelector('.expiring-list');
expiringList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (!deleteBtn) return; // clicked outside delete button, ignore

    const id = deleteBtn.dataset.id;
    if (id) {
        // Confirm before deleting (optional)
        if (confirm('Are you sure you want to delete this item?')) {
            deleteItem(id);
        }
    }
});
const emptyState = document.querySelector('.empty-state');

// Event Listeners
backButton?.addEventListener('click', () => window.history.back());
filterButtons.forEach(btn => btn.addEventListener('click', handleFilterClick));
viewButtons.forEach(btn => btn.addEventListener('click', handleViewChange));
searchInput?.addEventListener('input', debounce(loadItems, 300));
categoryFilter?.addEventListener('change', loadItems);
sortBy?.addEventListener('change', loadItems);


// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadItems();
  populateCategoryDropdown('categoryFilter')
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
        console.log("Using token:", token);
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
        console.log("Fetched items from backend:", data);
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

    allItems = allItems.filter(item => !item.used);

    allItems = filterExpiringWithinMonth(allItems);

    console.log('Filtered allItems:', allItems);

    if (allItems.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    updatePriorityCounts(allItems);
    updateStats(allItems);

    applyFilters(); 
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
    console.log('Items passed to renderItems:', items);

    expiringList.className = `expiring-list ${currentView}-view`;
    
    const visibleItems = items.filter(item => !item.used);

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
                <button class="action-btn mark-used-btn" title="Mark as Used" data-id="${item._id}">
                    <i class="fas fa-check"></i>
                </button>
                <button class="action-btn edit-btn" title="Edit Item" data-id="${item._id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete Item" data-id="${item._id}">
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


// function updateStats(items) {
//   const now = new Date();
//   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   const oneDay = new Date(today.getTime() + (24 * 60 * 60 * 1000));
//   const oneWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
//   const oneMonth = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

//   const expiringWithin24Hours = items.filter(item => {
//     const expiry = new Date(item.expiryDate);
//     return expiry >= now && expiry <= oneDay;
//   }).length;

//   const expiringThisWeek = items.filter(item => {
//     const expiry = new Date(item.expiryDate);
//     return expiry > oneDay && expiry <= oneWeek;
//   }).length;

//   const expiringThisMonth = items.filter(item => {
//     const expiry = new Date(item.expiryDate);
//     return expiry > oneWeek && expiry <= oneMonth;
//   }).length;

//   const total = expiringWithin24Hours + expiringThisWeek + expiringThisMonth;

//   document.querySelector('#critical-count').textContent = expiringWithin24Hours;
//   document.querySelector('#medium-count').textContent = expiringThisWeek;
//   document.querySelector('#low-count').textContent = expiringThisMonth;

//   document.querySelector('#critical-progress').style.width = `${(expiringWithin24Hours / (total || 1)) * 100}%`;
//   document.querySelector('#medium-progress').style.width = `${(expiringThisWeek / (total || 1)) * 100}%`;
//   document.querySelector('#low-progress').style.width = `${(expiringThisMonth / (total || 1)) * 100}%`;
// }

function updateStats(items) {
  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringWithin24Hours = items.filter(item => {
    const expiry = new Date(item.expiryDate);
    return expiry >= now && expiry <= oneDayLater;
  }).length;

  const expiringThisWeek = items.filter(item => {
    const expiry = new Date(item.expiryDate);
    return expiry > oneDayLater && expiry <= oneWeekLater;
  }).length;

  const expiringThisMonth = items.filter(item => {
    const expiry = new Date(item.expiryDate);
    return expiry > oneWeekLater && expiry <= oneMonthLater;
  }).length;

  const total = expiringWithin24Hours + expiringThisWeek + expiringThisMonth;

  document.querySelector('#critical-count').textContent = expiringWithin24Hours;
  document.querySelector('#medium-count').textContent = expiringThisWeek;
  document.querySelector('#low-count').textContent = expiringThisMonth;

  document.querySelector('#critical-progress').style.width = `${(expiringWithin24Hours / (total || 1)) * 100}%`;
  document.querySelector('#medium-progress').style.width = `${(expiringThisWeek / (total || 1)) * 100}%`;
  document.querySelector('#low-progress').style.width = `${(expiringThisMonth / (total || 1)) * 100}%`;
}



async function deleteItem(id) {
    try {
        const token = getToken();
        if (!token) throw new Error('No auth token found');
        const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
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
    
    console.log("Active Filter (raw):", activeFilter);
    console.log("Sanitized:", activeFilter.trim().toLowerCase());

    console.log("Active Filter (exact):", JSON.stringify(activeFilter));
    console.log("Items count before filter:", items.length);
    // Apply search filter
    if (searchTerm) {
        items = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply category filter
    if (category) {
      const selectedCategory = category.trim().toLowerCase();
      items = items.filter(item => (item.category || '').toLowerCase() === selectedCategory);
    }

    // Apply priority filter
    if (activeFilter.trim().toLowerCase() !== 'all items') {
        const priority = activeFilter.replace(' Priority', '').toLowerCase();
        items = items.filter(item => getPriority(item.expiryDate) === priority);
        console.log("Items count after priority filter:", items.length);
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
    console.log("Items after filters:", items.length);
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
    const diffTime = expiry - today;
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    console.log(`Expiry: ${expiryDate}, Days until expiry: ${days}`);
    return days;
}

function isExpiringWithin24Hours(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    
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

function filterExpiringWithinMonth(items) {
  return items.filter(item => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days >= 0 && days <= 30;
  });
  console.log('Items before filter:', items.length, 'Items after 30-day filter:', filtered.length);
  return filtered;
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

document.addEventListener('click', (e) => {
  if (e.target.closest('.edit-btn')) {
    const id = e.target.closest('.edit-btn').dataset.id;
    openEditForm(id);
  }
});

function openEditForm(id) {
  const item = allItems.find(item => item._id === id);
  if (!item) {
    alert('Item not found');
    return;
}
  document.getElementById('itemName').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('quantity').value = item.quantity;
  document.getElementById('expiryDate').value = item.expiryDate.split('T')[0];
  document.getElementById('location').value = item.location || '';

  // Show the edit form/modal
  document.getElementById('editForm').style.display = 'block';

  // Optionally, save the id in a hidden input for submission
  document.getElementById('editItemId').value = id;
}


async function submitEditForm(event) {
  event.preventDefault();

  const id = document.getElementById('editItemId').value;
  const updatedData = {
    name: document.getElementById('itemName').value.trim(),
    category: document.getElementById('category').value.trim(),
    quantity: Number(document.getElementById('quantity').value),
    expiryDate: document.getElementById('expiryDate').value,
    location: document.getElementById('location').value.trim()
  };

  try {
    const token = getToken(); // Your function to get auth token
    if (!token) throw new Error('No auth token found');

    const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) throw new Error('Failed to update item');

    alert('Item updated successfully!');
    await loadItems(); // reload items to reflect update
    document.getElementById('editForm').style.display = 'none'; // hide form

  } catch (error) {
    console.error(error);
    alert('Failed to update item');
  }
}

document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-id');
    if (id) {
      openEditForm(id);
    } else {
      console.error('Edit button missing data-id');
    }
  });
});