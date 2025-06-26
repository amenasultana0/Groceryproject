import { getToken } from './utils/authHelper.js';

document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    if (token) {
        fetch('http://localhost:3000/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            const name = data.name || (data.email ? data.email.split('@')[0] : 'User');
            const avatar = document.getElementById('userAvatar');
            const dropdownUsername = document.getElementById('dropdownUsername');
            if (avatar) avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D6EFD&color=fff`;
            if (dropdownUsername) dropdownUsername.textContent = name;
        });
    }

    fetchAndRenderCategories()
        .then(() => {
            fetchAndRenderProducts();
            fetchAndRenderLowStock();
        });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.product-card').forEach(card => {
                const productName = card.querySelector('h3').textContent.toLowerCase();
                card.style.display = productName.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    document.getElementById('gridViewBtn')?.addEventListener('click', () => {
        document.getElementById('gridViewBtn').classList.add('active');
        document.getElementById('listViewBtn').classList.remove('active');
        document.getElementById('product-display').classList.add('product-grid');
        document.getElementById('product-display').classList.remove('product-list');
    });

    document.getElementById('listViewBtn')?.addEventListener('click', () => {
        document.getElementById('listViewBtn').classList.add('active');
        document.getElementById('gridViewBtn').classList.remove('active');
        document.getElementById('product-display').classList.remove('product-grid');
        document.getElementById('product-display').classList.add('product-list');
    });

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryModal = document.getElementById('categoryModal');
    const categoryForm = document.getElementById('categoryForm');

    addCategoryBtn?.addEventListener('click', () => categoryModal.classList.add('show'));
    document.getElementById('cancelCategoryBtn')?.addEventListener('click', closeModal);
    document.querySelector('.close-btn')?.addEventListener('click', closeModal);

    function closeModal() {
        categoryModal.classList.remove('show');
        categoryForm.reset();
    }

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim() || 'fas fa-box';
        if (!name) return;

        const res = await fetch('http://localhost:3000/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name, icon })
        });
        const data = await res.json();
        if (res.ok) {
            const dataTarget = sanitizeCategory(name);
            const navList = document.querySelector('.inventory-nav ul');
            const newNavItem = document.createElement('li');
            newNavItem.innerHTML = `
                <div class="sidebar-category-item">
                    <a href="#" data-target="${dataTarget}" class="category-link">
                        <i class="${icon}"></i><span>${name}</span>
                    </a>
                    <button class="delete-category-btn" data-id="${data._id}" title="Delete ${name}">🗑️</button>
                </div>`;
            navList.appendChild(newNavItem);

            const productDisplay = document.getElementById('product-display');
            const newCategoryDiv = document.createElement('div');
            newCategoryDiv.classList.add('category-grid');
            newCategoryDiv.id = dataTarget;
            productDisplay.appendChild(newCategoryDiv);

            newNavItem.querySelector('a').addEventListener('click', handleCategoryNavClick);
            newNavItem.querySelector('button').addEventListener('click', handleDeleteCategory);

            syncCategoryAcrossPages(name);
            closeModal();
            fetchAndRenderProducts();
            fetchAndRenderLowStock();
        } else {
            alert(data?.message || 'Error adding category');
        }
    });

    document.getElementById('userAvatar')?.addEventListener('click', () => {
        document.getElementById('profileMenu')?.classList.toggle('hidden');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        ['token', 'user'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        location.href = 'login.html';
    });

    document.querySelectorAll('.inventory-nav a').forEach(link => {
        link.addEventListener('click', handleCategoryNavClick);
    });
});

function handleCategoryNavClick(e) {
    e.preventDefault();
    document.querySelectorAll('.inventory-nav li').forEach(li => li.classList.remove('active'));
    this.parentElement.classList.add('active');
    document.querySelectorAll('.category-grid').forEach(grid => grid.classList.remove('active'));
    document.getElementById(this.dataset.target)?.classList.add('active');
}

function sanitizeCategory(category) {
    return category?.trim().toLowerCase().replace(/\s+/g, '-') + '-grid';
}

async function fetchAndRenderCategories() {
    const res = await fetch('http://localhost:3000/api/categories', {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    const categories = await res.json();

    const navList = document.querySelector('.inventory-nav ul');
    const productDisplay = document.getElementById('product-display');

    categories.forEach(category => {
        const dataTarget = sanitizeCategory(category.name);
        const navItem = document.createElement('li');
        navItem.innerHTML = `
            <div class="sidebar-category-item">
                <a href="#" data-target="${dataTarget}" class="category-link">
                    <i class="${category.icon}"></i><span>${category.name}</span>
                </a>
                <button class="delete-category-btn" data-id="${category._id}" title="Delete ${category.name}">🗑️</button>
            </div>`;
        navList.appendChild(navItem);

        const grid = document.createElement('div');
        grid.classList.add('category-grid');
        grid.id = dataTarget;
        productDisplay.appendChild(grid);

        navItem.querySelector('a').addEventListener('click', handleCategoryNavClick);
        navItem.querySelector('button').addEventListener('click', handleDeleteCategory);
    });
}

async function handleDeleteCategory(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const name = btn.title.split('Delete ')[1];
    if (!confirm(`Are you sure you want to delete "${name}" category?`)) return;

    const res = await fetch(`http://localhost:3000/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    const result = await res.json();

    if (res.ok) {
        btn.closest('li')?.remove();
        document.getElementById(sanitizeCategory(name))?.remove();
        alert(result.message || 'Category deleted.');
    } else {
        alert(result.message || 'Error deleting category.');
    }
}

async function fetchImageURL(name) {
    try {
        const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(name)}&per_page=1&client_id=RN_RbX_F3c_GFfVOHa5FUr5XM5FnrvpNNFNgNKZmPaU`);
        const data = await res.json();
        return data.results[0]?.urls?.small || 'fallback.jpg';
    } catch {
        return 'fallback.jpg';
    }
}

async function fetchAndRenderProducts() {
    const token = getToken();
    const res = await fetch('http://localhost:3000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const products = await res.json();
    renderProducts(products);
}

async function renderProducts(products) {
    document.querySelectorAll('.category-grid').forEach(grid => grid.innerHTML = '');

    for (const product of products) {
        const { name, quantity, costPrice, category } = product;
        const categoryId = sanitizeCategory(category);
        const categoryContainer = document.getElementById(categoryId);
        const imageUrl = await fetchImageURL(name);

        if (categoryContainer) {
            const card = document.createElement('div');
            card.className = 'product-card';
            const progress = Math.min(100, (quantity / 150) * 100);
            card.innerHTML = `
                <img src="${imageUrl}" alt="${name}" />
                <div class="card-body">
                    <h3>${name}</h3>
                    <p>₹${costPrice} • ${quantity} in stock</p>
                    <div class="stock-bar-container">
                        <div class="stock-bar" style="width:${progress}%; background:${progress < 40 ? 'orange' : 'green'};"></div>
                    </div>
                </div>`;
            categoryContainer.appendChild(card);
        }
    }
}

async function fetchAndRenderLowStock() {
    const token = getToken();
    const res = await fetch('http://localhost:3000/api/products/low-stock', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const items = await res.json();
    renderLowStockAlerts(items);
}

function renderLowStockAlerts(items) {
    const watchlist = document.querySelector('.watchlist');
    watchlist.innerHTML = '';
    if (!items.length) {
        watchlist.innerHTML = '<li><span>No low stock items 🎉</span></li>';
        return;
    }
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-info">
                <i class="fas fa-exclamation-triangle" style="color: ${item.quantity < 30 ? '#e74c3c' : '#e67e22'};"></i>
                <span>${item.name}</span>
            </div>
            <span class="quantity">${item.quantity} left</span>`;
        watchlist.appendChild(li);
    });
}

function syncCategoryAcrossPages(categoryName) {
    const itemCategoryDropdown = document.getElementById('itemCategoryDropdown');
    if (itemCategoryDropdown) {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        itemCategoryDropdown.appendChild(option);
    }
    document.querySelectorAll('.shared-category-dropdown').forEach(dropdown => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        dropdown.appendChild(option);
    });
}
