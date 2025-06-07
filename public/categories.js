const BACKEND_URL = 'http://localhost:3000';

// Category colors
const CATEGORY_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];
  
  // State management
  let categories = [];
  let draggedElement = null;
  
  // Element references
  const categoriesWrapper = document.getElementById("categoriesWrapper");
  const emptyState = document.getElementById("emptyState");
  const openModalBtn = document.getElementById("openModalBtn");
  const modalOverlay = document.getElementById("modalOverlay");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveCategoryBtn = document.getElementById("saveCategoryBtn");
  const categoryNameInput = document.getElementById("categoryName");
  const categoryIconSelect = document.getElementById("categoryIcon");
  const searchInput = document.getElementById("searchInput");
  
  // Initialize app
  document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    updateDisplay();
  });
  
  // Modal handlers
  openModalBtn.onclick = () => showModal();
  closeModalBtn.onclick = cancelBtn.onclick = () => closeModal();
  
  // Click outside modal to close
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };
  
  function showModal() {
    modalOverlay.style.display = "flex";
    setTimeout(() => modalOverlay.classList.add('show'), 10);
    categoryNameInput.focus();
  }
  
  function closeModal() {
    modalOverlay.classList.remove('show');
    setTimeout(() => {
      modalOverlay.style.display = "none";
      categoryNameInput.value = "";
      categoryIconSelect.selectedIndex = 0;
    }, 300);
  }
  
  // Add new category
saveCategoryBtn.onclick = async () => {
  const name = categoryNameInput.value.trim();
  const icon = categoryIconSelect.value;

  if (!name) {
    categoryNameInput.focus();
    categoryNameInput.style.borderColor = '#ef4444';
    setTimeout(() => categoryNameInput.style.borderColor = '#e5e7eb', 2000);
    return;
  }

  const newCategory = {
    name,
    icon,
    items: [],
    color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]
  };

  // POST to backend
  try {
    const token = getToken();
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${BACKEND_URL}/api/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newCategory)
    });

    if (!response.ok) throw new Error('Failed to save category');

    const savedCategory = await response.json();
    categories.push(savedCategory);

    updateDisplay();
    closeModal();
  } catch (error) {
    alert('Error saving category, please try again.');
    console.error(error);
  }
};

  
  // Create category card
function createCategoryCard(category) {
  const card = document.createElement("div");
  card.className = "category-card";
  card.dataset.categoryId = category.id;

  card.innerHTML = `
    <div class="category-color" style="background-color: ${category.color}"></div>
    <div class="category-header">
      <div class="category-info">
        <span class="category-icon">${category.icon}</span>
        <h3 class="category-name">${category.name}</h3>
      </div>
      <span class="category-count">${category.items.length} items</span>
      <button class="color-picker-btn" title="Change Color">🎨</button>
      <button class="delete-icon" title="Delete Category">×</button>
      <div class="color-picker">
        <div class="color-options">
          ${CATEGORY_COLORS.map(color => 
            `<div class="color-option ${color === category.color ? 'selected' : ''}" 
                 style="background-color: ${color}" 
                 data-color="${color}"></div>`
          ).join('')}
        </div>
      </div>
    </div>
    <div class="inline-form">
      <input type="text" placeholder="Add new item..." />
      <button title="Add Item"><span class="button-text">+</span></button>
    </div>
    <div class="item-list"></div>
  `;

  // ✅ Add delete button handler here
  const deleteBtn = card.querySelector(".delete-icon");
  deleteBtn.onclick = async () => {
    if (confirm(`Delete "${category.name}" and all its items?`)) {
      try {
        const token = getToken();
        if (!token) throw new Error('No auth token');

        const response = await fetch(`${BACKEND_URL}/api/categories/${category.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete category');

        categories = categories.filter(cat => cat.id !== category.id);
        updateDisplay();
      } catch (error) {
        alert('Error deleting category, please try again.');
        console.error(error);
      }
    }
  };

  setupCardEventListeners(card, category);
  renderItems(card, category);
  categoriesWrapper.appendChild(card);
}

function setupCardEventListeners(card, category) {
  // Add new item handler
  const input = card.querySelector('.inline-form input');
  const addBtn = card.querySelector('.inline-form button');

  addBtn.onclick = () => {
    const text = input.value.trim();
    if (!text) return;

    category.items.push({ text });
    input.value = '';
    saveCategories();
    renderItems(card, category);
    updateCategoryCount(card, category);
  };

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  // Color picker toggle
  const colorPickerBtn = card.querySelector('.color-picker-btn');
  const colorPicker = card.querySelector('.color-picker');

  colorPickerBtn.onclick = () => {
    colorPicker.classList.toggle('show');
  };

  // Color option selection
  const colorOptions = card.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.onclick = () => {
      const selectedColor = option.dataset.color;
      category.color = selectedColor;
      saveCategories();
      updateDisplay();
    };
  });
}

  
function renderItems(card, category) {
  const itemList = card.querySelector('.item-list');
  itemList.innerHTML = '';
  
  category.items.forEach((item, index) => {
    const itemElement = document.createElement("div");
    itemElement.className = "item";
    itemElement.draggable = true;
    itemElement.dataset.itemIndex = index;
      
    itemElement.innerHTML = `
      <span class="item-text">${item.text}</span>
      <span class="delete-item" title="Remove Item">×</span>
    `;
  
    // Delete item handler
    itemElement.querySelector(".delete-item").onclick = () => {
      category.items.splice(index, 1);
      saveCategories();
      renderItems(card, category);
      updateCategoryCount(card, category);
    };
  
      // Drag and drop for items
    itemElement.addEventListener('dragstart', (e) => {
      draggedElement = { type: 'item', categoryId: category.id, itemIndex: index };
      itemElement.classList.add('dragging');
    });
  
    itemElement.addEventListener('dragend', () => {
      itemElement.classList.remove('dragging');
      draggedElement = null;
    });
  
    itemElement.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  
    itemElement.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedElement && draggedElement.type === 'item' && 
        draggedElement.categoryId === category.id) {
        const fromIndex = draggedElement.itemIndex;
        const toIndex = index;
          
        if (fromIndex !== toIndex) {
          const [movedItem] = category.items.splice(fromIndex, 1);
          category.items.splice(toIndex, 0, movedItem);
          saveCategories();
          renderItems(card, category);
        }
      }
    });
  
    itemList.appendChild(itemElement);
  });
}
  
function updateCategoryCount(card, category) {
  const countElement = card.querySelector('.category-count');
  countElement.textContent = `${category.items.length} items`;
}

// Search functionality
searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const cards = categoriesWrapper.querySelectorAll('.category-card');

  cards.forEach(card => {
    const categoryName = card.querySelector('.category-name').textContent.toLowerCase();
    const items = Array.from(card.querySelectorAll('.item-text')).map(el => 
      el.textContent.toLowerCase());

    const matches = categoryName.includes(searchTerm) || 
                   items.some(item => item.includes(searchTerm));

    card.style.display = matches ? 'block' : 'none';
  });
});

// Data persistence
function saveCategories() {
  try {
    localStorage.setItem('groceryCategories', JSON.stringify(categories));
  } catch (e) {
    console.log('Storage not available');
  }
}

function getToken() {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.token || null;
  } catch {
    return null;
  }
}

async function loadCategories() {
  const token = getToken();
  console.log('Token being sent:', token);
  if (!token) {
    console.log("No token found");
    return;
  }
  try {
    const response = await fetch(`${BACKEND_URL}/api/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    categories = data.map(category => ({
      ...category,
      color: category.color || CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
      items: category.items || []
    }));

    updateDisplay();
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

function updateDisplay() {
  // Clear existing cards
  categoriesWrapper.innerHTML = '';

  if (categories.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    categories.forEach(category => createCategoryCard(category));
  }
}
