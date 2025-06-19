import { populateCategoryDropdown } from './utils/categoryHelper.js'; 

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
  const token = user?.token;

  const modal = document.getElementById("itemModal");
  const openBtn = document.getElementById("openModal");
  const closeBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const form = document.getElementById("itemForm");
  const tbody = document.getElementById("inventory-body-main");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  
  // Back button functionality
  const backBtn = document.getElementById("goBackBtn");
  backBtn?.addEventListener("click", () => history.back());
  
  // Open/Close modal
  openBtn.onclick = () => (modal.style.display = "flex");
  closeBtn.onclick = () => (modal.style.display = "none");
  cancelBtn.onclick = () => (modal.style.display = "none");
  
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
    
    // Load existing items from backend
  loadItems();
  //populateCategoryDropdown('categoryFilter'); // For <select id="categoryFilter">
    

  // Handle form submission
  form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("itemName").value.trim();
  const quantity = document.getElementById("quantity").value;
  const expiry = document.getElementById("expiryDate").value;
  const category = document.getElementById("category").value;

  if (!name || !quantity || !expiry) return;

  try {
    const response = await fetch("http://localhost:3000/api/products/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, quantity, expiryDate: expiry, category }),
    });

    if (!response.ok) throw new Error("Failed to add item");

    await window.reloadDataInBothTabs();
    form.reset();

    modal.style.display = "none";
  } catch (err) {
    console.error("Error adding item:", err);
  }
});

// Function to load items from backend
async function loadItems() {
  try {
    const response = await fetch("http://localhost:3000/api/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch items");

    const items = await response.json();
    renderInventory(items);
  } catch (err) {
    console.error("Error loading inventory items:", err);
  }
}

// Expose globally so dashboard can call it
window.loadInventoryItems = loadItems;

// Render items
function renderInventory(items) {
  tbody.innerHTML = "";
  items.forEach((item, index) => {
    const status = getStatus(item.expiryDate);
    const row = document.createElement("tr");
    row.setAttribute("data-category", item.category);
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.expiryDate}</td>
      <td><span class="status ${status.toLowerCase().replace(/ /g, '-')}">${status}</span></td>
      <td><button class="delete-btn" data-id="${item._id}">Delete</button></td>
    `;

    row.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteItem(item._id);
    });

    tbody.appendChild(row);
  });
}

//delete item
async function deleteItem(id) {
try {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const token = user?.token;
  if (!token) throw new Error('User token missing');

  const response = await fetch(`http://localhost:3000/api/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to delete item");

  await window.reloadDataInBothTabs();
} catch (err) {
  console.error("Error deleting item:", err);
}
}

  // Sortable headers
  document.querySelectorAll(".sortable").forEach((header) => {
    header.addEventListener("click", () => {
      const column = header.dataset.column;
      const colIndex = { item: 1, quantity: 2, expiryDate: 3 }[column];
      const rows = Array.from(tbody.querySelectorAll("tr"));

      rows.sort((a, b) => {
        let valA = a.cells[colIndex].textContent;
        let valB = b.cells[colIndex].textContent;

        if (column === "quantity") {
          valA = parseInt(valA);
          valB = parseInt(valB);
        } else if (column === "expiryDate") {
          valA = new Date(valA);
          valB = new Date(valB);
        } else {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        return valA > valB ? 1 : -1;
      });

      tbody.innerHTML = "";
      rows.forEach((row) => tbody.appendChild(row));
      updateSerialNumbers();
    });
  });

  // Search functionality
  searchInput?.addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row) => {
      const item = row.cells[1].textContent.toLowerCase();
      row.style.display = item.includes(filter) ? "" : "none";
    });
  });

  // Category filter
  categoryFilter?.addEventListener("change", function () {
    const selected = this.value.toLowerCase();
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row) => {
      const category = row.getAttribute("data-category")?.toLowerCase() || "";
      row.style.display = !selected || category === selected ? "" : "none";
    });
  });

  // Serial number update
  function updateSerialNumbers() {
    tbody.querySelectorAll("tr").forEach((row, index) => {
      row.cells[0].textContent = index + 1;
    });
  }

  // Status check based on expiry
  function getStatus(expiryDateStr) {
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Expired";
    if (diffDays <= 3) return "Expiring Soon";
    return "Fresh";
  }

  // Utility functions for dashboard card rendering
function formatDate(dateStr) {
const date = new Date(dateStr);
return date.toLocaleDateString("en-IN", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
}

function isExpired(dateStr) {
const expiry = new Date(dateStr);
const today = new Date();
return expiry < today;
}
window.renderInventoryItems = function(items) {
const inventoryContainer = document.getElementById('inventoryItems');
if (!inventoryContainer) return;

if (items.length === 0) {
  inventoryContainer.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-box-open"></i>
      <p>No items to display</p>
    </div>
  `;
  return;
}

inventoryContainer.innerHTML = items.map(item => `
  <div class="item-card ${isExpired(item.expiryDate) ? 'expired' : ''}" data-id="${item._id}">
    <div class="item-header">
      <h4>${item.name}</h4>
      <span class="category-badge">${item.category}</span>
    </div>
    <div class="item-details">
      <p>Quantity: ${item.quantity}</p>
      <p>Expires: ${formatDate(item.expiryDate)}</p>
    </div>
    <div class="item-actions">
      <button class="icon-btn" onclick="editItem('${item._id}')">
        <i class="fas fa-edit"></i>
      </button>
      <button class="icon-btn delete" onclick="deleteItem('${item._id}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
`).join('');
};

window.reloadDataInBothTabs = async function () {
await loadItems();
const response = await fetch("http://localhost:3000/api/products", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const items = await response.json();
  window.renderInventoryItems(items); // for dashboard cards
};

  });