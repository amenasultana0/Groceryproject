// app.js

document.addEventListener('DOMContentLoaded', () => {
  const getStartedBtn = document.querySelector('.btn');

  getStartedBtn.addEventListener('click', () => {
    // Scroll to the expiry tracker section
    renderGroceryList();
  });

  function renderGroceryList() {
    // Create section
    const section = document.createElement('section');
    section.className = 'expiry-list-section';

    // Container
    const container = document.createElement('div');
    container.className = 'tracker-container';

    // Header
    const header = document.createElement('div');
    header.className = 'tracker-header';
    header.innerHTML = `<h2>Tracked Items</h2>`;
    container.appendChild(header);

    // List
    const ul = document.createElement('ul');
    ul.className = 'item-list';

    // Mock data (replace with fetch to backend later)
    const items = [
      { name: 'Milk', expiry: '2025-05-25' },
      { name: 'Eggs', expiry: '2025-05-30' },
      { name: 'Bread', expiry: '2025-06-01' },
    ];

    const today = new Date();

    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;

      const expiryDate = new Date(item.expiry);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      const tag = document.createElement('span');

      if (diffDays < 0) {
        tag.className = 'expired';
        tag.textContent = 'Expired';
      } else if (diffDays <= 2) {
        tag.className = 'warning';
        tag.textContent = 'Expiring Soon';
      } else {
        tag.className = 'ok';
        tag.textContent = 'Fresh';
      }

      li.appendChild(tag);
      ul.appendChild(li);
    });

    container.appendChild(ul);
    section.appendChild(container);
    document.body.appendChild(section);

    section.scrollIntoView({ behavior: 'smooth' });
  }
});
