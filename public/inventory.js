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
            const userNameEl = document.getElementById('userName');
            const userEmailEl = document.getElementById('userEmail');
            const dropdownUsername = document.getElementById('dropdownUsername');

            if (avatar) avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D6EFD&color=fff`;
            if (userNameEl) userNameEl.textContent = name;
            if (userEmailEl) userEmailEl.textContent = data.email;
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

    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const productDisplay = document.getElementById('product-display');

    if (gridViewBtn && listViewBtn && productDisplay) {
        gridViewBtn.addEventListener('click', () => {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            productDisplay.classList.add('product-grid');
            productDisplay.classList.remove('product-list');
        });

        listViewBtn.addEventListener('click', () => {
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            productDisplay.classList.remove('product-grid');
            productDisplay.classList.add('product-list');
        });
    }

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryModal = document.getElementById('categoryModal');
    const categoryForm = document.getElementById('categoryForm');
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    const closeBtn = document.querySelector('.close-btn');

    addCategoryBtn.addEventListener('click', () => categoryModal.classList.add('show'));
    cancelCategoryBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    function closeModal() {
        categoryModal.classList.remove('show');
        categoryForm.reset();
    }

    categoryForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim() || 'fas fa-box';
        if (!name) return;

        const token = getToken();

        fetch('http://localhost:3000/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, icon })
        })
        .then(res => res.json())
        .then(data => {
            if (data) {
                const dataTarget = name.toLowerCase().replace(/\s+/g, '-') + '-grid';

                const navList = document.querySelector('.inventory-nav ul');
                if (navList) {
                    const newNavItem = document.createElement('li');
                    newNavItem.innerHTML = `
                        <div class="sidebar-category-item">
                            <a href="#" data-target="${dataTarget}" class="category-link">
                                <i class="${icon}"></i><span>${name}</span>
                            </a>
                            <button class="delete-category-btn" data-id="${data._id}" title="Delete ${name}">🗑️</button>
                        </div>
                    `;
                    navList.appendChild(newNavItem);

                    const newLink = newNavItem.querySelector('a');
                    newLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        document.querySelectorAll('.inventory-nav li').forEach(li => li.classList.remove('active'));
                        newLink.parentElement.classList.add('active');
                        const targetId = newLink.dataset.target;
                        document.querySelectorAll('.category-grid').forEach(grid => {
                            grid.classList.toggle('active', grid.id === targetId);
                        });
                    });

                    const deleteBtn = newNavItem.querySelector('.delete-category-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const confirmDelete = confirm(`Are you sure you want to delete "${name}" category?`);
                            if (!confirmDelete) return;

                            try {
                                const res = await fetch(`http://localhost:3000/api/categories/${data._id}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${getToken()}`
                                    }
                                });
                                const result = await res.json();
                                if (res.ok) {
                                    newNavItem.remove();
                                    const grid = document.getElementById(dataTarget);
                                    if (grid) grid.remove();
                                    alert(result.message || 'Category deleted.');
                                } else {
                                    alert(result.message || 'Error deleting category.');
                                }
                            } catch (err) {
                                console.error("Delete error:", err);
                                alert("Failed to delete category.");
                            }
                        });
                    }

                    newLink.click();
                }

                const productDisplay = document.getElementById('product-display');
                if (productDisplay) {
                    const newCategoryDiv = document.createElement('div');
                    newCategoryDiv.classList.add('category-grid');
                    newCategoryDiv.id = dataTarget;
                    newCategoryDiv.innerHTML = `<p>No products in <strong>${name}</strong> yet.</p>`;
                    productDisplay.appendChild(newCategoryDiv);
                }

                syncCategoryAcrossPages(name);
                closeModal();
                fetchAndRenderProducts();
                fetchAndRenderLowStock();
            } else {
                alert(data?.message || 'Error adding category');
            }
        })
        .catch(err => {
            console.error("Add Category Error:", err);
            alert("Something went wrong while adding the category.");
        });
    });

    const profileIcon = document.getElementById('userAvatar');
    const profileDropdown = document.getElementById('profileMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', () => {
            profileDropdown.classList.toggle('hidden');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            location.href = 'login.html';
        });
    }
});

async function fetchAndRenderCategories() {
    try {
        const res = await fetch('http://localhost:3000/api/categories', {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });
        const categories = await res.json();

        const navList = document.querySelector('.inventory-nav ul');
        const productDisplay = document.getElementById('product-display');

        categories.forEach(category => {
            const dataTarget = category.name.toLowerCase().replace(/\s+/g, '-') + '-grid';
            const navItem = document.createElement('li');
            navItem.innerHTML = `
                <div class="sidebar-category-item">
                    <a href="#" data-target="${dataTarget}" class="category-link">
                        <i class="${category.icon}"></i><span>${category.name}</span>
                    </a>
                    <button class="delete-category-btn" data-id="${category._id}" title="Delete ${category.name}">🗑️</button>
                </div>
            `;
            navList.appendChild(navItem);

            const grid = document.createElement('div');
            grid.classList.add('category-grid');
            grid.id = dataTarget;
            grid.innerHTML = `<p>No products in <strong>${category.name}</strong> yet.</p>`;
            productDisplay.appendChild(grid);

            const link = navItem.querySelector('a');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.inventory-nav li').forEach(li => li.classList.remove('active'));
                link.parentElement.classList.add('active');
                document.querySelectorAll('.category-grid').forEach(grid => {
                    grid.classList.toggle('active', grid.id === link.dataset.target);
                });
            });

            const deleteBtn = navItem.querySelector('.delete-category-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const confirmDelete = confirm(`Are you sure you want to delete "${category.name}" category?`);
                    if (!confirmDelete) return;

                    try {
                        const res = await fetch(`http://localhost:3000/api/categories/${category._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${getToken()}`
                            }
                        });
                        const result = await res.json();
                        if (res.ok) {
                            navItem.remove();
                            const catGrid = document.getElementById(dataTarget);
                            if (catGrid) catGrid.remove();
                            alert(result.message || 'Category deleted.');
                        } else {
                            alert(result.message || 'Error deleting category.');
                        }
                    } catch (err) {
                        console.error("Delete error:", err);
                        alert("Failed to delete category.");
                    }
                });
            }
        });
    } catch (err) {
        console.error('Error fetching categories:', err);
    }
}

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
    const userAvatarEl = document.getElementById('userAvatar');
    const userNameEl = document.getElementById('userName');
    if (userAvatarEl) userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D6EFD&color=fff`;
    if (userNameEl) userNameEl.textContent = name;

    const profile = document.getElementById('profileDropdown');
    const dropdown = document.getElementById('profileMenu');
    if (profile && dropdown) {
        profile.addEventListener('click', (e) => {
            dropdown.classList.toggle('hidden');
            e.stopPropagation();
        });
        document.addEventListener('click', () => dropdown.classList.add('hidden'));
    }
}



async function fetchImageURL(productName) {
    try {
        const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(productName)}&per_page=1&client_id=RN_RbX_F3c_GFfVOHa5FUr5XM5FnrvpNNFNgNKZmPaU`);
        const data = await res.json();
        return data.results[0]?.urls?.small || 'fallback.jpg';
    } catch {
        return 'fallback.jpg';
    }
}

async function renderProducts(products) {
    document.querySelectorAll('.category-grid').forEach(grid => grid.innerHTML = '');
    for (const product of products) {
        const { name, quantity, costPrice, category } = product;
        const categoryId = `${category.toLowerCase().replace(/\s+/g, '-')}-grid`;
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
    if (!token) return;
    try {
        const res = await fetch('http://localhost:3000/api/products/low-stock', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch low stock products');
        const items = await res.json();
        renderLowStockAlerts(items);
    } catch (err) {
        console.error('Low stock fetch error:', err);
    }
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
    // Add to "Add Item" dropdown on Dashboard
    const itemCategoryDropdown = document.getElementById('itemCategoryDropdown');
    if (itemCategoryDropdown) {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;

        // Insert after default options
        const defaultCount = getDefaultOptionCount(itemCategoryDropdown);
        itemCategoryDropdown.insertBefore(option, itemCategoryDropdown.options[defaultCount] || null);
    }

    // Add to all shared dropdowns on other pages
    const sharedDropdowns = document.querySelectorAll('.shared-category-dropdown');
    sharedDropdowns.forEach(dropdown => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;

        const defaultCount = getDefaultOptionCount(dropdown);
        dropdown.insertBefore(option, dropdown.options[defaultCount] || null);
    });
}

function getDefaultOptionCount(dropdown) {
    let count = 0;
    for (let i = 0; i < dropdown.options.length; i++) {
        const val = dropdown.options[i].value;
        // Count only hardcoded/default options
        if (val && !val.startsWith('custom-')) count++;
        else break;
    }
    return count;
}

async function fetchAndRenderProducts() {
    const token = getToken();
    if (!token) {
        alert("You're not logged in!");
        window.location.href = 'login.html';
        return;
    }
    try {
        const res = await fetch('http://localhost:3000/api/products', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch products");
        const products = await res.json();
        renderProducts(products);
    } catch (err) {
        console.error("Error loading inventory:", err);
    }
}