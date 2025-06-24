const BACKEND_URL = 'http://localhost:3000';

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


export async function populateCategoryDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.error('❌ Select element not found:', selectId);
    return;
  }
  select.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Categories';
  select.appendChild(allOption);

  const defaultCategories = [
    "fruits", "vegetables", "dairy", "meat", "bakery",
    "beverages", "snacks", "frozen", "grains", "condiments"
  ];

  defaultCategories.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    select.appendChild(option);
  });

  try {
    const res = await fetch('http://localhost:3000/api/categories', {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const categories = await res.json();

    const defaultSet = new Set(defaultCategories.map(c => c.toLowerCase()));

    categories.forEach(cat => {
      const name = cat.name.trim();
      if (!defaultSet.has(name.toLowerCase())) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      }
    });

  } catch (err) {
    console.error('🚨 Error populating categories:', err);
  }
}

