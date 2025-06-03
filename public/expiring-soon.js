// Back button functionality
const backButton = document.getElementById('backButton');
backButton.addEventListener('click', () => {
    // Check if there's a previous page in browser history
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Fallback to home page if no history
        window.location.href = './index.html';
    }
});

// Add interactivity for filters
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filterType = button.textContent.toLowerCase();
        filterItems(filterType);
    });
});

// Add search functionality
const searchInput = document.querySelector('.search-bar input');
const expiringItems = document.querySelectorAll('.expiring-item');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterBySearch(searchTerm);
});

// Filter items by priority
function filterItems(filterType) {
    expiringItems.forEach(item => {
        if (filterType === 'all items') {
            item.style.display = 'grid';
            return;
        }

        const priority = getPriorityFromItem(item);
        item.style.display = priority === filterType ? 'grid' : 'none';
    });
}

// Filter items by search term
function filterBySearch(searchTerm) {
    expiringItems.forEach(item => {
        const itemName = item.querySelector('.item-name').textContent.toLowerCase();
        const itemCategory = item.querySelector('.item-category').textContent.toLowerCase();
        if (itemName.includes(searchTerm) || itemCategory.includes(searchTerm)) {
            item.style.display = 'grid';
        } else {
            item.style.display = 'none';
        }
    });
}

// Helper function to get priority from item
function getPriorityFromItem(item) {
    const priorityIndicator = item.querySelector('.priority-indicator');
    if (priorityIndicator.classList.contains('priority-high')) return 'high priority';
    if (priorityIndicator.classList.contains('priority-medium')) return 'medium priority';
    if (priorityIndicator.classList.contains('priority-low')) return 'low priority';
    return '';
}

// Initialize action buttons
document.querySelectorAll('.action-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const action = this.classList.contains('edit-btn') ? 'edit' : 'delete';
        const item = this.closest('.expiring-item');
        const itemName = item.querySelector('.item-name').textContent;
        
        if (action === 'edit') {
            // TODO: Implement edit functionality
            console.log(`Editing item: ${itemName}`);

        } else {
            // TODO: Implement delete functionality
            console.log(`Deleting item: ${itemName}`);

            item.remove();
        }
    });
});