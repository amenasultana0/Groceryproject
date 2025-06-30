import { getToken } from './utils/authHelper.js';

async function logSale(quantity) {
  try {
    await fetch('http://localhost:3000/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ quantity })
    });
  } catch (err) {
    console.error('Error logging sale:', err);
  }
}

async function logOrder() {
  try {
    await fetch('http://localhost:3000/api/sales/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      }
    });
  } catch (err) {
    console.error('Error logging order:', err);
  }
}

let scannedOnce = false;
let scannedBarcodes = [];
let html5QrCode = null;
const barcodeModal = document.getElementById('inventoryScannerModal');
const scanBtn = document.getElementById('startScanBtn');
const closeInventoryScanner = document.getElementById('closeInventoryScanner');

document.getElementById("deleteAllBtn").addEventListener("click", async function() {
  if (scannedBarcodes.length === 0) {
    alert("No barcodes to delete.");
    return;
  }
  const res = await fetch('http://localhost:3000/api/products/deduct-by-barcode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ barcodes: scannedBarcodes })
  });
  const data = await res.json();
  alert(`${data.updated} item(s) deducted, ${data.deleted} product(s) deleted.`);
  if (data.deletedCount > 0) {
  await Promise.all([
    logSale(data.totalQuantityDeducted),
    logOrder()
  ]);
}


  scannedBarcodes = [];
  document.querySelector("#scannedBarcodesTable tbody").innerHTML = "";
  // Optionally refresh inventory display here\
  fetchAndRenderProducts();
  closeInventoryScannerModal();
});
function addBarcodeToTable(barcode) {
  if (scannedBarcodes.includes(barcode)) return; // Avoid duplicates
  scannedBarcodes.push(barcode);

  const tbody = document.querySelector("#scannedBarcodesTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${barcode}</td>
    <td><button class="remove-barcode-btn" data-barcode="${barcode}">Remove</button></td>
  `;
  tbody.appendChild(row);
}

// Remove barcode from table and array
document.querySelector("#scannedBarcodesTable tbody").addEventListener("click", function(e) {
  if (e.target.classList.contains("remove-barcode-btn")) {
    const barcode = e.target.getAttribute("data-barcode");
    scannedBarcodes = scannedBarcodes.filter(b => b !== barcode);
    e.target.closest("tr").remove();
  }
});

async function onInventoryScanSuccess(decodedText, decodedResult) {
  if (scannedBarcodes.includes(decodedText)) return; // prevent duplicate

  addBarcodeToTable(decodedText);

  // 🔻 Reduce product quantity by 1
  try {
    const res = await fetch(`http://localhost:3000/api/products/decrease-by-barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ barcode: decodedText, amount: 1 })
    });

    if (res.ok) {
      // ✅ Log 1 sale for this scan
      await logSale(1);
      fetchAndRenderProducts(); // refresh inventory view if needed
    } else {
      const err = await res.json();
      alert(err.message || "Failed to decrease product quantity.");
    }
  } catch (error) {
    console.error("Error scanning product:", error);
  }
}

function openInventoryScannerModal() {
  scannedBarcodes = [];
  document.querySelector("#scannedBarcodesTable tbody").innerHTML = "";
  document.getElementById('inventoryScannerModal').classList.add('show');
  setTimeout(startInventoryScanner, 300);
}

function closeInventoryScannerModal() {
  document.getElementById('inventoryScannerModal').classList.remove('show');
  if (html5QrCode) {
    html5QrCode.stop().then(() => html5QrCode.clear());
  }
}

async function startInventoryScanner() {
  const qrRegion = document.getElementById('inventory-reader');
  qrRegion.innerHTML = '';
  html5QrCode = new Html5Qrcode("inventory-reader");
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onInventoryScanSuccess,
      onInventoryScanError
    );
  } catch (err) {
    alert("Camera error: " + err);
  }
}

// async function onInventoryScanSuccess(decodedText, decodedResult) {
//   // Example: Add barcode to input or list for deletion
//   document.getElementById('barcode').value = decodedText;
//   closeInventoryScannerModal();
//   // Optionally, trigger your add/delete logic here
// }

function onInventoryScanError(errorMessage) {
  // Optionally handle scan errors
  // console.warn(errorMessage);
}

// Example: Open scanner when button is clicked
document.getElementById('startScanBtn').addEventListener('click', openInventoryScannerModal);
document.getElementById('closeInventoryScanner').addEventListener('click', closeInventoryScannerModal);
document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();

    if (token) {
        fetch(`http://localhost:3000/api/auth/profile`, {
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

    fetchAndRenderCategories().then(() => {
        fetchAndRenderProducts();
        fetchAndRenderLowStock();
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const allGrids = document.querySelectorAll('.category-grid');
            allGrids.forEach(grid => grid.classList.add('active'));

            let foundMatch = false;
            allGrids.forEach(grid => {
                let hasVisibleProduct = false;
                const cards = grid.querySelectorAll('.product-card');
                cards.forEach(card => {
                    const productName = card.querySelector('h3').textContent.toLowerCase();
                    const match = productName.includes(searchTerm);
                    card.style.display = match ? '' : 'none';
                    if (match) hasVisibleProduct = true;
                });
                grid.style.display = hasVisibleProduct || searchTerm === '' ? '' : 'none';
                if (hasVisibleProduct) foundMatch = true;
            });

            if (!foundMatch && searchTerm !== '') {
                document.getElementById('product-display').innerHTML = `<p style="margin: 2rem; font-size: 1.2rem;">No products found for "<strong>${searchTerm}</strong>" 😕</p>`;
            } else if (searchTerm === '') {
                document.querySelectorAll('.category-grid').forEach(grid => grid.style.display = '');
            }
        });
    }

    // Grid/List View
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

    // Category modal
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryModal = document.getElementById('categoryModal');
    const categoryForm = document.getElementById('categoryForm');

    addCategoryBtn?.addEventListener('click', () => categoryModal.classList.add('show'));
    document.getElementById('cancelCategoryBtn')?.addEventListener('click', closeModal);
    document.querySelector('#categoryModal .close-btn')?.addEventListener('click', closeModal);

    function closeModal() {
        categoryModal.classList.remove('show');
        categoryForm.reset();
    }

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim() || 'fas fa-box';
        if (!name) return;

        const res = await fetch(`http://localhost:3000/api/categories`, {
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

    document.getElementById('cancelRestock')?.addEventListener('click', () => {
        document.getElementById('restockModal').classList.remove('show');
    });
    document.getElementById('closeRestockModal')?.addEventListener('click', () => {
        document.getElementById('restockModal').classList.remove('show');
    });
    document.getElementById('restockForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('restockName').value;
        const quantity = +document.getElementById('restockQuantity').value;
        const costPrice = +document.getElementById('restockPrice').value;
        const expiryDate = document.getElementById('restockExpiry').value;
        const category = document.getElementById('restockModal').dataset.category;

        const res = await fetch(`http://localhost:3000/api/products/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name, quantity, costPrice, expiryDate, category, isRestock: true})
        });

        if (res.ok) {
            alert('Product restocked as new batch!');
            document.getElementById('restockModal').classList.remove('show');
            fetchAndRenderProducts();
            fetchAndRenderLowStock();
        } else {
            alert('Failed to restock');
        }
    });

    scanBtn?.addEventListener('click', openInventoryScannerModal);

    closeInventoryScanner?.addEventListener('click', async () => {
    barcodeModal.classList.remove('show');
    if (html5QrCode) {
        await html5QrCode.stop();
        html5QrCode.clear();
    }
});
});

// document.getElementById('addItemForm').addEventListener('submit', async function(e) {
//   e.preventDefault();
//   const name = document.getElementById('itemName').value;
//   const category = document.getElementById('category').value;
//   const quantity = document.getElementById('quantity').value;
//   const expiryDate = document.getElementById('expiryDate').value;
//   const costPrice = document.getElementById('costPrice').value;
//   //const sellingPrice = document.getElementById('sellingPrice').value;
//   const barcode = document.getElementById('barcode').value; // <-- Get barcode

//   await fetch('http://localhost:3000/api/products/add', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${getToken()}`
//     },
//     body: JSON.stringify({ name, category, quantity, expiryDate, costPrice, sellingPrice, barcode })
//   });
//   // ...refresh UI, close modal, etc.
// });


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
    const res = await fetch(`http://localhost:3000/api/categories`, {
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
    const res = await fetch(`http://localhost:3000/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const products = await res.json(); // corrected name
    const validProducts = products.filter(item => !isExpired(item.expiryDate));
    renderProducts(validProducts);
}

async function renderProducts(products) {
    document.querySelectorAll('.category-grid').forEach(grid => grid.innerHTML = '');

    for (const product of products) {
        const { name, quantity, costPrice, category, expiryDate } = product;

        // Double-check in case something slipped through
        if (isExpired(expiryDate)) continue;

        const categoryId = sanitizeCategory(category);
        const categoryContainer = document.getElementById(categoryId);
        const allCategoriesGrid = document.getElementById('categories-grid');
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
                    <small class="added-date">Added on: ${new Date(product.createdAt).toLocaleDateString()}</small>
                    <button class="restock-btn" data-product='${JSON.stringify(product)}'>Restock</button>
                    <button class="delete-btn" data-id="${product._id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div class="stock-bar-container">
                        <div class="stock-bar" style="width:${progress}%; background:${progress < 40 ? 'orange' : 'green'};"></div>
                    </div>
                </div>`;
            categoryContainer.appendChild(card);
            card.querySelector('.restock-btn').addEventListener('click', (e) => {
            const productData = JSON.parse(e.target.dataset.product);
            openRestockModal(productData);
        });

        }
        if (allCategoriesGrid) {
    const cardAll = document.createElement('div');
    cardAll.className = 'product-card';
    cardAll.innerHTML = `
        <img src="${imageUrl}" alt="${name}" />
        <div class="card-body">
            <h3>${name}</h3>
            <p>₹${costPrice} • ${quantity} in stock</p>
            <small class="added-date">Added on: ${new Date(product.createdAt).toLocaleDateString()}</small>
            <button class="restock-btn" data-product='${JSON.stringify(product)}'>Restock</button>
            <button class="delete-btn" data-id="${product._id}" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
            <div class="stock-bar-container">
                <div class="stock-bar" style="width:${Math.min(100, (quantity / 150) * 100)}%; background:${quantity < 40 ? 'orange' : 'green'};"></div>
            </div>
        </div>`;
    allCategoriesGrid.appendChild(cardAll);
    cardAll.querySelector('.restock-btn').addEventListener('click', (e) => {
        const productData = JSON.parse(e.target.dataset.product);
        openRestockModal(productData);
    });
    }
  }

}
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    const confirmDelete = confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      const token = getToken();
      const res = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 204) {
        const card = e.target.closest('.product-card');
        if (card) card.remove();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting product.');
    }
  }
});

async function fetchAndRenderLowStock() {
    const token = getToken();
    const res = await fetch(`http://localhost:3000/api/products/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const products = await res.json(); // corrected name
    renderLowStockAlerts(products);
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

function openRestockModal(product) {
    const modal = document.getElementById('restockModal');
    document.getElementById('restockName').value = product.name;
    modal.dataset.category = product.category; // store category
    modal.classList.add('show');
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

function isExpired(date) {
  const today = new Date();
  const expiry = new Date(date);
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return expiry <= today;
}