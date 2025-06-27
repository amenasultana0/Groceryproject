class GroceryTracker {
    constructor() {
        this.items = [];
        this.currentFilter = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.updateCounts();
        this.updateRecentItems();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');
        
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchBtn.addEventListener('click', () => this.handleSearch(searchInput.value));

        // Stat cards filtering
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.showFilterResults(filter);
            });
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.dataset.page);
            });
        });

        // Out of stock button
        const outOfStockBtn = document.getElementById('outOfStockBtn');
        outOfStockBtn.addEventListener('click', () => this.toggleOutOfStockList());

        // Close filter
        const closeFilter = document.getElementById('closeFilter');
        closeFilter.addEventListener('click', () => this.hideFilterResults());

        // Modal handling
        const addItemForm = document.getElementById('addItemForm');
        const closeModal = document.getElementById('closeModal');
        
        if (addItemForm) {
            addItemForm.addEventListener('submit', (e) => this.handleAddItem(e));
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideModal());
        }

        // Camera button for adding items
        document.querySelector('.action-btn').addEventListener('click', () => {
            this.showModal();
        });
    }

    loadSampleData() {
        // Sample data for demonstration
        this.items = [
            {
                id: 1,
                name: 'Milk',
                category: 'beverages',
                expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
                quantity: 2,
                addedDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
            },
            {
                id: 2,
                name: 'Bread',
                category: 'food',
                expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
                quantity: 1,
                addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                id: 3,
                name: 'Apples',
                category: 'food',
                expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                quantity: 0, // Out of stock
                addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                id: 4,
                name: 'Yogurt',
                category: 'food',
                expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                quantity: 1,
                addedDate: new Date()
            },
            {
                id: 5,
                name: 'Shampoo',
                category: 'personal',
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                quantity: 1,
                addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            }
        ];
    }

    updateCounts() {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        const expiringSoon = this.items.filter(item => 
            item.expiryDate > now && item.expiryDate <= threeDaysFromNow && item.quantity > 0
        ).length;
        
        const expired = this.items.filter(item => 
            item.expiryDate <= now && item.quantity > 0
        ).length;
        
        const lowStock = this.items.filter(item => 
            item.quantity > 0 && item.quantity <= 2
        ).length;
        
        const outOfStock = this.items.filter(item => item.quantity === 0).length;
        
        const total = this.items.length;

        document.getElementById('expiringCount').textContent = expiringSoon;
        document.getElementById('expiredCount').textContent = expired;
        document.getElementById('lowStockCount').textContent = lowStock;
        document.getElementById('totalCount').textContent = total;
        document.getElementById('outOfStockCount').textContent = outOfStock;
    }

    updateRecentItems() {
        const recentItems = this.items
            .sort((a, b) => b.addedDate - a.addedDate)
            .slice(0, 5);
        
        const recentContainer = document.getElementById('recentItems');
        
        if (recentItems.length === 0) {
            recentContainer.innerHTML = '<p class="empty-state">No recent items</p>';
            return;
        }

        recentContainer.innerHTML = recentItems.map(item => `
            <div class="item">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>Added ${this.formatDate(item.addedDate)} • Qty: ${item.quantity}</p>
                </div>
                <div class="item-status ${this.getStatusClass(item)}">
                    ${this.getItemStatus(item)}
                </div>
            </div>
        `).join('');
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.hideFilterResults();
            return;
        }

        const filteredItems = this.items.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

        this.showSearchResults(filteredItems, query);
    }

    showSearchResults(items, query) {
        const filterResults = document.getElementById('filterResults');
        const filterTitle = document.getElementById('filterTitle');
        const filterContent = document.getElementById('filterContent');

        filterTitle.textContent = `Search Results for "${query}"`;
        
        if (items.length === 0) {
            filterContent.innerHTML = '<p class="empty-state">No items found</p>';
        } else {
            filterContent.innerHTML = `
                <div class="item-list">
                    ${items.map(item => `
                        <div class="item">
                            <div class="item-info">
                                <h4>${item.name}</h4>
                                <p>${item.category} • Expires: ${this.formatDate(item.expiryDate)} • Qty: ${item.quantity}</p>
                            </div>
                            <div class="item-status ${this.getStatusClass(item)}">
                                ${this.getItemStatus(item)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        filterResults.style.display = 'block';
    }

    showFilterResults(filter) {
        const filterResults = document.getElementById('filterResults');
        const filterTitle = document.getElementById('filterTitle');
        const filterContent = document.getElementById('filterContent');

        let filteredItems = [];
        let title = '';

        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        switch (filter) {
            case 'expiring':
                filteredItems = this.items.filter(item => 
                    item.expiryDate > now && item.expiryDate <= threeDaysFromNow && item.quantity > 0
                );
                title = 'Expiring Soon';
                break;
            case 'expired':
                filteredItems = this.items.filter(item => 
                    item.expiryDate <= now && item.quantity > 0
                );
                title = 'Expired Items';
                break;
            case 'lowstock':
                filteredItems = this.items.filter(item => 
                    item.quantity > 0 && item.quantity <= 2
                );
                title = 'Low Stock Items';
                break;
            case 'total':
                filteredItems = this.items;
                title = 'All Items';
                break;
        }

        filterTitle.textContent = title;
        
        if (filteredItems.length === 0) {
            filterContent.innerHTML = '<p class="empty-state