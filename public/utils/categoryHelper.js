const BACKEND_URL = 'http://localhost:3000'; // Use your actual backend URL

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

export async function populateCategoryDropdown(dropdownId) {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch categories');

    const data = await res.json();
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    // Keep the first static option (like "Select Category" or "All Categories")
    dropdown.length = 1;

    data.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name.toLowerCase();
      option.textContent = cat.name;
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error('Error populating category dropdown:', err);
  }
}