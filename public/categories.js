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
  const cancelBtn = document.getElementById("cancelBtn");
  const saveCategoryBtn = document.getElementById("saveCategoryBtn");
  const categoryNameInput = document.getElementById("categoryName");
  const categoryIconSelect = document.getElementById("categoryIcon");
  const searchInput = document.getElementById("searchInput");
  
  // Initialize app
  document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
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
  saveCategoryBtn.onclick = () => {
    const name = categoryNameInput.value.trim();
    const icon = categoryIconSelect.value;
  
    if (!name) {
      categoryNameInput.focus();
      categoryNameInput.style.borderColor = '#ef4444';
      setTimeout(() => categoryNameInput.style.borderColor = '#e5e7eb', 2000);
      return;
    }
  
    const newCategory = {
      id: Date.now(),
      name,
      icon,
      items: [],
      color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]
    };
  
    categories.push(newCategory);
    saveCategories();
    createCategoryCard(newCategory);
    closeModal();
    updateDisplay();
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
  
    // Event listeners
    setupCardEventListeners(card, category);
    
    // Render existing items
    renderItems(card, category);
    
    categoriesWrapper.appendChild(card);
  }
  
  function setupCardEventListeners(card, category) {
    const deleteBtn = card.querySelector(".delete-icon");
    const colorBtn = card.querySelector(".color-picker-btn");
    const colorPicker = card.querySelector(".color-picker");
    const input = card.querySelector("input");
    const addBtn = card.querySelector("button[title='Add Item']");
  
    // Delete category
    deleteBtn.onclick = () => {
      if (confirm(`Delete "${category.name}" and all its items?`)) {
        categories = categories.filter(cat => cat.id !== category.id);
        saveCategories();
        card.remove();
        updateDisplay();
      }
    };
  
    // Color picker
    colorBtn.onclick = (e) => {
      e.stopPropagation();
      colorPicker.classList.toggle('show');
    };
  
    // Color selection
    colorPicker.addEventListener('click', (e) => {
      if (e.target.classList.contains('color-option')) {
        const newColor = e.target.dataset.color;
        category.color = newColor;
        saveCategories();
        
        // Update UI
        card.querySelector('.category-color').style.backgroundColor = newColor;
        colorPicker.querySelectorAll('.color-option').forEach(opt => 
          opt.classList.remove('selected'));
        e.target.classList.add('selected');
        colorPicker.classList.remove('show');
      }
    });
  
    // Close color picker when clicking outside
    document.addEventListener('click', (e) => {
      if (!colorBtn.contains(e.target) && !colorPicker.contains(e.target)) {
        colorPicker.classList.remove('show');
      }
    });
  
    // Add item
    const addItem = async () => {
      const itemText = input.value.trim();
      if (!itemText) return;
  
      // Show loading state
      const buttonText = addBtn.querySelector('.button-text');
      buttonText.innerHTML = '<div class="loading-spinner"></div>';
      addBtn.disabled = true;
  
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
  
      const newItem = {
        id: Date.now(),
        text: itemText,
        createdAt: new Date().toISOString()
      };
  
      category.items.push(newItem);
      saveCategories();
      renderItems(card, category);
      updateCategoryCount(card, category);
  
      // Reset form
      input.value = "";
      buttonText.textContent = '+';
      addBtn.disabled = false;
    };
  
    addBtn.onclick = addItem;
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addItem();
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
    // In a real app, this would save to a backend
    // For now, we'll use localStorage as a demo
    try {
      localStorage.setItem('groceryCategories', JSON.stringify(categories));
    } catch (e) {
      console.log('Storage not available');
    }
  }
  
  function loadCategories() {
    try {
      const saved = localStorage.getItem('groceryCategories');
      if (saved) {
        categories = JSON.parse(saved);
      }
    } catch (e) {
      console.log('Could not load saved categories');
      categories = [];
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