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
const emptyState = document.querySelector('.empty-state');

// Event Listeners
backButton?.addEventListener('click', () => window.history.back());
filterButtons.forEach(btn => btn.addEventListener('click', handleFilterClick));
viewButtons.forEach(btn => btn.addEventListener('click', handleViewChange));
searchInput?.addEventListener('input', handleSearch);
categoryFilter?.addEventListener('change', handleFilters);
sortBy?.addEventListener('change', handleSort);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadItems();
});

// Functions
async function fetchItems() {
   try {
        const token = localStorage.getItem('token'); // or sessionStorage, depending on where you stored it
        console.log("Using token:", token);
        const response = await fetch(`${BACKEND_URL}/api/products/expiring-soon`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch items from backend');
        }

        const data = await response.json();
        return data.items || []; // Adjust based on your API response structure
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function loadItems() {
    allItems = await fetchItems();

    if (allItems.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();
    renderItems(allItems);
    updateStats(allItems); // pass items so updateStats can use it
}

function renderItems(items) {
    const currentView = document.querySelector('.view-btn.active').dataset.view;
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
                <button class="action-btn mark-used-btn" title="Mark as Used" onclick="markAsUsed(${item.id})">
                    <i class="fas fa-check"></i>
                </button>
                <button class="action-btn edit-btn" title="Edit Item" onclick="editItem(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete Item" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats(items) {
    const today = new Date();
    const oneWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    const oneMonth = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    const expiringToday = items.filter(item => isExpiringToday(item.expiryDate)).length;
    const expiringThisWeek = items.filter(item => isExpiringBefore(item.expiryDate, oneWeek)).length;
    const expiringThisMonth = items.filter(item => isExpiringBefore(item.expiryDate, oneMonth)).length;

    // Update stats
    document.querySelector('.stat-card.urgent .stat-number').textContent = expiringToday;
    document.querySelector('.stat-card.warning .stat-number').textContent = expiringThisWeek;
    document.querySelector('.stat-card.info .stat-number').textContent = expiringThisMonth;

    // Update progress bars
    const total = items.length || 1; // prevent division by zero
    document.querySelector('.stat-card.urgent .progress-bar').style.width = 
        `${(expiringToday / total) * 100}%`;
    document.querySelector('.stat-card.warning .progress-bar').style.width = 
        `${(expiringThisWeek / total) * 100}%`;
    document.querySelector('.stat-card.info .progress-bar').style.width = 
        `${(expiringThisMonth / total) * 100}%`;
}

function handleFilterClick(e) {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    applyFilters();
}

function handleViewChange(e) {
    viewButtons.forEach(btn => btn.classList.remove('active'));
    e.target.closest('.view-btn').classList.add('active');
    loadItems();
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

function applyFilters() {
    let items = [...allItems];
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const sortValue = sortBy.value;
    const activeFilter = document.querySelector('.filter-btn.active').textContent.trim();

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
    if (activeFilter !== 'All Items') {
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
        const response = await fetch(`${BACKEND_URL}/api/items/${id}/use`, { method: 'POST' }); // example endpoint
        if (!response.ok) throw new Error('Failed to mark as used');
        
        await loadItems(); // reload fresh items from backend
        showNotification('Item marked as used!', 'success');
    } catch (error) {
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
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getExpiryProgress(expiryDate) {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    if (daysUntilExpiry <= 1) return 90;
    if (daysUntilExpiry <= 7) return 60;
    return 30;
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