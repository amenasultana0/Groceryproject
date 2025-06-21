let seasonalItems = [];

fetch('/data/seasonalItems.json')
  .then(res => res.json())
  .then(data => {
    seasonalItems = data;
    renderItems();
    updateStats();
  });

// Application state
let shoppingList = [];
let currentFilter = 'all';
let currentView = 'grid';
let currentRegion = 'All';
let currentMonth = 'June';
let currentYear = '2025';


const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function getSeason(month) {
    switch(month) {
        case "March":
        case "April":
        case "May":
            return "Spring";
        case "June":
        case "July":
        case "August":
            return "Summer";
        case "September":
        case "October":
            return "Monsoon";
        case "November":
            return "Autumn";
        case "December":
        case "January":
        case "February":
            return "Winter";
        default:
            return "";
    }
}



// Seasonal tips array
const seasonalTips = [
    "Buy seasonal produce for the best taste, nutrition, and value!",
    "Summer fruits are naturally cooling and help maintain body temperature.",
    "Local seasonal vegetables are freshest and most environmentally friendly.",
    "Preserve summer produce by freezing or making jams for year-round enjoyment.",
    "Visit farmers markets early morning for the best selection of seasonal items."
];

// DOM elements
const seasonalList = document.getElementById('seasonal-list');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const viewButtons = document.querySelectorAll('.view-btn');
const shoppingModal = document.getElementById('shopping-modal');
const detailsModal = document.getElementById('details-modal');
const shoppingListFab = document.getElementById('shopping-list-fab');
const fabBadge = document.getElementById('fab-badge');
const regionSelect = document.getElementById('region-select');
const dateSelect = document.getElementById('date-select');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    renderItems();
    setupEventListeners();
    updateStats();
    rotateTips();
    fetchTrendingItems(currentRegion);
    updateSeasonHeader();
});

// Render items based on current filter and search
function renderItems() {
    const filteredItems = getFilteredItems();
    seasonalList.innerHTML = '';
    
    if (filteredItems.length === 0) {
        seasonalList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        `;
        return;
    }

    filteredItems.forEach((item, index) => {
        const card = createItemCard(item, index);
        seasonalList.appendChild(card);
    });

    // Apply view mode
    seasonalList.className = `seasonal-grid ${currentView === 'list' ? 'list-view' : ''}`;
    
    // Update total items count
    document.getElementById('total-items').textContent = filteredItems.length;
}

async function fetchTrendingItems(region) {
  const season = getSeason(currentMonth); // You already have this function

  try {
    const res = await fetch(`/api/trending-items?region=${region}&season=${season}`);
    const trendingItems = await res.json();
    renderTrendingItems(trendingItems); // Add this display function
  } catch (err) {
    console.error('Error fetching trending items:', err);
  }
}


async function renderItems() {
    const items = await fetchSeasonalItems(currentRegion, currentMonth);
    // ...render as before...
}

// Create individual item card
function createItemCard(item, index) {
    const isInList = shoppingList.some(listItem => listItem.name === item.name);
    const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
    
    const card = document.createElement('div');
    card.className = `item-card ${isInList ? 'in-shopping-list' : ''}`;
    card.setAttribute('data-type', item.type);
    card.setAttribute('data-index', index);
    
    card.innerHTML = `
        <div class="item-header">
            <div>
                <h3>${item.emoji} ${item.name}</h3>
                <span class="item-badge">${item.season}</span>
        <div class="item-content">
            <p>${item.note}</p>
            <div class="item-actions">
                <button class="add-to-list-btn ${isInList ? 'added' : ''}" 
                        onclick="toggleShoppingList('${item.name}', event)">
                    <i class="fas ${isInList ? 'fa-check' : 'fa-plus'}"></i>
                    ${isInList ? 'Added' : 'Add to List'}
                </button>
                <div class="item-rating" title="Seasonal Rating: ${item.rating}/5">
                    ${stars}
                </div>
            </div>
        </div>
    `;
    
    // Add click event for item details (but not on button)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.add-to-list-btn')) {
            showItemDetails(item);
        }
    });
    
    return card;
}

async function fetchTrendingItems(region = 'India') {
  try {
    const res = await fetch(`/api/trending-items?region=${encodeURIComponent(region)}`);
    const data = await res.json();

    if (!data.trending || data.trending.length === 0) {
      document.getElementById('seasonal-list').innerHTML = `
        <div class="no-results">
            <i class="fas fa-seedling" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
            <h3>No trending items found</h3>
            <p>Please check again later or try a different region.</p>
        </div>
      `;
      return;
    }

    renderTrendingItems(data.trending);
  } catch (err) {
    console.error("Error fetching trending items:", err);
  }
}

function renderTrendingItems(items) {
  const container = document.getElementById('seasonal-list');
  container.innerHTML = '';

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-header">
          <h3>🍃 ${item.name}</h3>
          <span class="item-badge">Trending</span>
      </div>
      <div class="item-content">
          <p>Calories: ${item.nutritions.calories}</p>
          <p>Carbs: ${item.nutritions.carbohydrates}g</p>
          <p>Sugar: ${item.nutritions.sugar}g</p>
          <div class="item-actions">
              <button class="add-to-list-btn" onclick="toggleShoppingList('${item.name}', event)">
                  <i class="fas fa-plus"></i> Add to List
              </button>
          </div>
      </div>
    `;
    container.appendChild(card);
  });

  updateStats();
}


function updateSeasonHeader() {
  const season = getSeason(currentMonth); // you already have getSeason()
  document.querySelector('.season-indicator span').textContent = `${season} Picks`;
}


// Filter items based on current criteria
function getFilteredItems() {
    let filtered = [...seasonalItems];

    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => item.type === currentFilter);
    }

    if (currentRegion !== 'All') {
        filtered = filtered.filter(item =>
            item.regionTags && item.regionTags.includes(currentRegion)
        );
    }

    if (currentMonth) {
        filtered = filtered.filter(item =>
            item.monthAvailable && item.monthAvailable.includes(currentMonth)
        );
    }

    return filtered;
}

// Toggle item in shopping list
function toggleShoppingList(itemName, event) {
    event.stopPropagation();
    const item = seasonalItems.find(i => i.name === itemName);
    const existingIndex = shoppingList.findIndex(i => i.name === itemName);
    
    if (existingIndex > -1) {
        shoppingList.splice(existingIndex, 1);
        showNotification(`${itemName} removed from shopping list`, 'removed');
    } else {
        shoppingList.push({
            ...item,
            addedAt: new Date().toISOString()
        });
        showNotification(`${itemName} added to shopping list`, 'added');
        
        // Add bounce animation to FAB
        shoppingListFab.classList.add('bounce');
        setTimeout(() => shoppingListFab.classList.remove('bounce'), 600);
    }
    
    updateShoppingListDisplay();
    renderItems();
}

// Show item details in modal
function showItemDetails(item) {
    const modal = document.getElementById('details-modal');
    const title = document.getElementById('item-title');
    const details = document.getElementById('item-details');
    
    title.innerHTML = `${item.emoji} ${item.name}`;
    
    details.innerHTML = `
        <div class="item-detail-content">
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> About</h4>
                <p>${item.note}</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-heart"></i> Health Benefits</h4>
                <ul>
                    ${item.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>
            
            <div class="detail-grid">
                <div class="detail-item">
                    <i class="fas fa-star"></i>
                    <strong>Rating</strong>
                    <span>${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-tag"></i>
                    <strong>Price</strong>
                    <span>${item.price}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <strong>Season</strong>
                    <span>${item.season}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <strong>Availability</strong>
                    <span>${item.availability}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-lightbulb"></i> Selection Tips</h4>
                <p>${item.tips}</p>
            </div>
            
            <div class="detail-actions">
                <button class="btn btn-primary" onclick="toggleShoppingList('${item.name}', event)">
                    <i class="fas ${shoppingList.some(i => i.name === item.name) ? 'fa-check' : 'fa-plus'}"></i>
                    ${shoppingList.some(i => i.name === item.name) ? 'Remove from List' : 'Add to Shopping List'}
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

// Update shopping list display
function updateShoppingListDisplay() {
    const count = shoppingList.length;
    document.getElementById('shopping-list-count').textContent = count;
    fabBadge.textContent = count;
    fabBadge.style.display = count > 0 ? 'flex' : 'none';
    
    const shoppingListItems = document.getElementById('shopping-list-items');
    
    if (count === 0) {
        shoppingListItems.innerHTML = '<p class="empty-list">Your shopping list is empty. Add some seasonal items!</p>';
        return;
    }
    
    shoppingListItems.innerHTML = shoppingList.map(item => `
        <div class="shopping-list-item">
            <div>
                <strong>${item.emoji} ${item.name}</strong>
                <div style="font-size: 0.9rem; color: #666;">${item.price} • ${item.availability}</div>
            </div>
            <button class="remove-item" onclick="toggleShoppingList('${item.name}', event)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', debounce(renderItems, 300));
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderItems();
        });
    });
    
    // View toggle buttons
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderItems();
        });
    });
    
    // Shopping list FAB
    shoppingListFab.addEventListener('click', () => {
        shoppingModal.classList.add('show');
    });
    
    // Modal close buttons
    document.getElementById('close-modal').addEventListener('click', () => {
        shoppingModal.classList.remove('show');
    });
    
    document.getElementById('close-details').addEventListener('click', () => {
        detailsModal.classList.remove('show');
    });
    
    // Clear shopping list
    document.getElementById('clear-list').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your entire shopping list?')) {
            shoppingList = [];
            updateShoppingListDisplay();
            renderItems();
            showNotification('Shopping list cleared', 'removed');
        }
    });
    
    // Export shopping list
    document.getElementById('export-list').addEventListener('click', exportShoppingList);
    
    // Close modals when clicking outside
    [shoppingModal, detailsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            shoppingModal.classList.remove('show');
            detailsModal.classList.remove('show');
        }
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// Export shopping list functionality
function exportShoppingList() {
    if (shoppingList.length === 0) {
        showNotification('Shopping list is empty', 'error');
        return;
    }
    
    const exportData = {
        title: 'My Seasonal Shopping List',
        date: new Date().toLocaleDateString(),
        items: shoppingList.map(item => ({
            name: item.name,
            price: item.price,
            note: item.note,
            benefits: item.benefits,
            tips: item.tips
        }))
    };
    
    // Create downloadable text file
    const textContent = `
${exportData.title}
Generated on: ${exportData.date}

Shopping Items:
${exportData.items.map((item, index) => `
${index + 1}. ${item.name} - ${item.price}
   ${item.note}
   Health Benefits: ${item.benefits.join(', ')}
   Tip: ${item.tips}
`).join('')}

Total Items: ${exportData.items.length}
    `.trim();
    
    downloadFile('seasonal-shopping-list.txt', textContent);
    showNotification('Shopping list exported successfully!', 'success');
}

// Download file helper
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: getNotificationColor(type),
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: '3000',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch(type) {
        case 'success': case 'added': return 'fa-check-circle';
        case 'error': case 'removed': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Get notification color based on type
function getNotificationColor(type) {
    switch(type) {
        case 'success': case 'added': return '#28a745';
        case 'error': case 'removed': return '#dc3545';
        case 'warning': return '#ffc107';
        default: return '#17a2b8';
    }
}

function getFilteredItems() {
    let filtered = [...seasonalItems];

    // Filter by type
    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => item.type === currentFilter);
    }

    // Filter by region
    if (currentRegion !== 'All') {
        filtered = filtered.filter(item => item.regionTags && item.regionTags.includes(currentRegion));
    }

    // Filter by month
    if (currentMonth) {
        filtered = filtered.filter(item => item.monthAvailable && item.monthAvailable.includes(currentMonth));
    }

    // Search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.note.toLowerCase().includes(searchTerm) ||
            item.benefits.some(benefit => benefit.toLowerCase().includes(searchTerm))
        );
    }

    return filtered;
}

// Listen for region and date changes
regionSelect.addEventListener('change', () => {
    currentRegion = regionSelect.value;
    fetchTrendingItems(currentRegion);
    updateStats();
});
dateSelect.addEventListener('change', () => {
    const [year, monthNum] = dateSelect.value.split('-');
    currentYear = year;
    currentMonth = monthNames[parseInt(monthNum, 10) - 1];
    updateSeasonHeader();
    // Update month display
    document.querySelector('.month-display').textContent = `${currentMonth} ${currentYear}`;
    renderItems();
    updateStats();
});

// Update statistics
function updateStats() {
    const filtered = getFilteredItems();
    document.getElementById('total-items').textContent = filtered.length;
    document.getElementById('shopping-list-count').textContent = shoppingList.length;
    // Locally available percentage
    const locallyAvailable = filtered.filter(item => item.availability === 'Locally Available').length;
    const localPercentage = filtered.length > 0 ? Math.round((locallyAvailable / filtered.length) * 100) : 0;
    document.querySelector('.stat-item:last-child .stat-number').textContent = `${localPercentage}%`;
}

// Rotate seasonal tips
function rotateTips() {
    const tipElement = document.getElementById('seasonal-tip');
    let currentTipIndex = 0;
    
    setInterval(() => {
        tipElement.style.opacity = '0';
        setTimeout(() => {
            currentTipIndex = (currentTipIndex + 1) % seasonalTips.length;
            tipElement.textContent = seasonalTips[currentTipIndex];
            tipElement.style.opacity = '1';
        }, 300);
    }, 5000);
    
    tipElement.style.transition = 'opacity 0.3s ease';
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add some fun interactions
function addFunInteractions() {
    // Add ripple effect to buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('button') || e.target.closest('button')) {
            const button = e.target.matches('button') ? e.target : e.target.closest('button');
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        }
    });
    
    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 1.5rem 0;
        }
        .detail-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .detail-item i {
            color: #4CAF50;
            margin-bottom: 0.5rem;
        }
        .detail-section {
            margin-bottom: 1.5rem;
        }
        .detail-section h4 {
            color: #2c3e50;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .detail-section ul {
            list-style: none;
            padding: 0;
        }
        .detail-section li {
            padding: 0.25rem 0;
            position: relative;
            padding-left: 1.5rem;
        }
        .detail-section li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #4CAF50;
            font-weight: bold;
        }
        .detail-actions {
            text-align: center;
            margin-top: 2rem;
        }
        .no-results {
            grid-column: 1 / -1;
            text-align: center;
            padding: 3rem;
            color: #6c757d;
        }
    `;
    document.head.appendChild(style);
}

// Initialize fun interactions
addFunInteractions();
