document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const productCards = document.querySelectorAll('.product-card');

            productCards.forEach(card => {
                const productName = card.querySelector('h3').textContent.toLowerCase();
                if (productName.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const productDisplay = document.getElementById('product-display');

    if (gridViewBtn && listViewBtn && productDisplay) {
        gridViewBtn.addEventListener('click', () => {
            if (!gridViewBtn.classList.contains('active')) {
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
                productDisplay.classList.add('product-grid');
                productDisplay.classList.remove('product-list');
            }
        });

        listViewBtn.addEventListener('click', () => {
            if (!listViewBtn.classList.contains('active')) {
                listViewBtn.classList.add('active');
                gridViewBtn.classList.remove('active');
                productDisplay.classList.remove('product-grid');
                productDisplay.classList.add('product-list');
            }
        });
    }

    const navLinks = document.querySelectorAll('.inventory-nav a');
    const categoryGrids = document.querySelectorAll('.category-grid');

    if(navLinks && categoryGrids) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                link.parentElement.classList.add('active');

                const targetId = link.dataset.target;
                
                categoryGrids.forEach(grid => {
                    if (grid.id === targetId) {
                        grid.classList.add('active');
                    } else {
                        grid.classList.remove('active');
                    }
                });
            });
        });
    }

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryModal = document.getElementById('categoryModal');
    const categoryModalCloseBtn = categoryModal.querySelector('.close-btn');
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    const categoryForm = document.getElementById('categoryForm');

    if (addCategoryBtn && categoryModal && categoryModalCloseBtn && cancelCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            categoryModal.classList.add('show');
        });

        const closeModal = () => {
            categoryModal.classList.remove('show');
        }

        categoryModalCloseBtn.addEventListener('click', closeModal);
        cancelCategoryBtn.addEventListener('click', closeModal);

        window.addEventListener('click', (e) => {
            if (e.target == categoryModal) {
                closeModal();
            }
        });

        categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle form submission logic here
            const categoryName = document.getElementById('categoryName').value;
            const categoryIcon = document.getElementById('categoryIcon').value;
            console.log('New Category:', categoryName, categoryIcon);
            // After saving, you might want to add the new category to the sidebar
            // and close the modal
            closeModal();
        });
    }
});