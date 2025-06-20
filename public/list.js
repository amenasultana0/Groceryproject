let groceryItems = [];
let editingItemId = null;

const categoryIcons = {
    fruits: '🍎',
    vegetables: '🥕',
    dairy: '🥛',
    meat: '🥩',
    bakery: '🍞',
    pantry: '🥫',
    frozen: '🧊',
    snacks: '🍿',
    beverages: '🥤',
    household: '🧽',
    other: '📦'
};

const categoryNames = {
    fruits: 'Fruits',
    vegetables: 'Vegetables',
    dairy: 'Dairy',
    meat: 'Meat',
    bakery: 'Bakery',
    pantry: 'Pantry',
    frozen: 'Frozen',
    snacks: 'Snacks',
    beverages: 'Beverages',
    household: 'Household',
    other: 'Other'
};

document.getElementById('addItemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addItem();
});

document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveEdit();
});

document.getElementById('searchBox').addEventListener('input', filterItems);
document.getElementById('categoryFilter').addEventListener('change', filterItems);
document.getElementById('statusFilter').addEventListener('change', filterItems);

function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const quantity = parseInt(document.getElementById('itemQuantity').value) || 1;
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const category = document.getElementById('itemCategory').value;
    const priority = document.getElementById('itemPriority').value;
    const notes = document.getElementById('itemNotes').value.trim();

    if (!name) return;

    const item = {
        id: Date.now(),
        name,
        quantity,
        price,
        category,
        priority,
        notes,
        purchased: false,
        dateAdded: new Date()
    };

    groceryItems.push(item);
    document.getElementById('addItemForm').reset();
    document.getElementById('itemQuantity').value = 1;
    document.getElementById('itemCategory').value = 'fruits';
    document.getElementById('itemPriority').value = 'medium';
    
    renderItems();
    updateStats();
    showNotification(`${name} added to your list!`);
}

function renderItems() {
    const container = document.getElementById('groceryList');
    const filteredItems = getFilteredItems();

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 4em; margin-bottom: 20px;">🛒</div>
                <h3>No items found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    const itemsByCategory = {};
    filteredItems.forEach(item => {
        if (!itemsByCategory[item.category]) {
            itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
    });

    let html = '';
    Object.keys(itemsByCategory).forEach(category => {
        const categoryItems = itemsByCategory[category];
        const purchasedCount = categoryItems.filter(item => item.purchased).length;
        
        html += `
            <div class="category-section">
                <div class="category-header">
                    <span class="category-icon">${categoryIcons[category]}</span>
                    <span class="category-title">${categoryNames[category]}</span>
                    <span class="category-count">${purchasedCount}/${categoryItems.length}</span>
                </div>
                <div class="category-items">
        `;

        categoryItems.forEach(item => {
            const total = (item.price * item.quantity).toFixed(2);
            html += `
                <div class="grocery-item ${item.purchased ? 'purchased' : ''} priority-${item.priority}">
                    <input type="checkbox" class="item-checkbox" 
                           ${item.purchased ? 'checked' : ''} 
                           onchange="togglePurchased(${item.id})">
                    <div class="item-details">
                        <div class="item-name">
                            ${item.name}
                            ${item.notes ? `<br><small style="color: #a0aec0;">${item.notes}</small>` : ''}
                        </div>
                        <div class="item-quantity">${item.quantity}x</div>
                        <div class="item-price">$${item.price.toFixed(2)}</div>
                        <div class="item-total">$${total}</div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn edit-btn" onclick="editItem(${item.id})">✏️</button>
                        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">🗑️</button>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function getFilteredItems() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    return groceryItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                            item.notes.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        const matchesStatus = !statusFilter || 
                            (statusFilter === 'purchased' && item.purchased) ||
                            (statusFilter === 'pending' && !item.purchased);

        return matchesSearch && matchesCategory && matchesStatus;
    });
}

function togglePurchased(id) {
    const item = groceryItems.find(item => item.id === id);
    if (item) {
        item.purchased = !item.purchased;
        renderItems();
        updateStats();
        showNotification(item.purchased ? 
            `${item.name} marked as purchased` : 
            `${item.name} marked as not purchased`);
    }
}

function editItem(id) {
    const item = groceryItems.find(item => item.id === id);
    if (item) {
        editingItemId = id;
        document.getElementById('editName').value = item.name;
        document.getElementById('editQuantity').value = item.quantity;
        document.getElementById('editPrice').value = item.price;
        document.getElementById('editCategory').value = item.category;
        document.getElementById('editModal').style.display = 'block';
    }
}

function saveEdit() {
    if (editingItemId) {
        const item = groceryItems.find(item => item.id === editingItemId);
        if (item) {
            item.name = document.getElementById('editName').value.trim();
            item.quantity = parseInt(document.getElementById('editQuantity').value) || 1;
            item.price = parseFloat(document.getElementById('editPrice').value) || 0;
            item.category = document.getElementById('editCategory').value;
            
            renderItems();
            updateStats();
            closeEditModal();
            showNotification(`${item.name} updated successfully!`);
        }
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingItemId = null;
}

function deleteItem(id) {
    const item = groceryItems.find(item => item.id === id);
    if (item && confirm(`Are you sure you want to delete "${item.name}"?`)) {
        groceryItems = groceryItems.filter(item => item.id !== id);
        renderItems();
        updateStats();
        showNotification(`${item.name} removed from list`);
    }
}

function clearPurchased() {
    const purchasedCount = groceryItems.filter(item => item.purchased).length;
    if (purchasedCount > 0 && confirm(`Remove ${purchasedCount} purchased items?`)) {
        groceryItems = groceryItems.filter(item => !item.purchased);
        renderItems();
        updateStats();
        showNotification(`${purchasedCount} purchased items cleared`);
    }
}

function exportList() {
    const text = groceryItems.map(item => {
        const status = item.purchased ? '✓' : '☐';
        const total = (item.price * item.quantity).toFixed(2);
        return `${status} ${item.name} (${item.quantity}x) - $${total} [${categoryNames[item.category]}]`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grocery-list-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Grocery list exported successfully!');
}

function filterItems() {
    renderItems();
}

function updateStats() {
    const total = groceryItems.length;
    const purchased = groceryItems.filter(item => item.purchased).length;
    const remaining = total - purchased;
    const totalCost = groceryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    document.getElementById('totalItems').textContent = total;
    document.getElementById('purchasedItems').textContent = purchased;
    document.getElementById('remainingItems').textContent = remaining;
    document.getElementById('totalCost').textContent = `$${totalCost.toFixed(2)}`;
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEditModal();
    }
});

// Initialize
updateStats();