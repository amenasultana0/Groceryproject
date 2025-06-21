document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('inventoryTableBody');
    let inventoryData = [];

    // Fetch inventory data from the API
    const fetchInventory = async () => {
        try {
            const response = await fetch('/api/products/inventory');
            if (!response.ok) {
                throw new Error('Failed to fetch inventory data');
            }
            inventoryData = await response.json();
            renderTable(inventoryData);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            tableBody.innerHTML = `<tr><td colspan="7">Error loading data.</td></tr>`;
        }
    };

    // Render the table with product data
    const renderTable = (products) => {
        tableBody.innerHTML = '';
        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7">No products found.</td></tr>`;
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');

            let stockStatusClass = '';
            if (product.quantity === 0) {
                stockStatusClass = 'out-of-stock';
            } else if (product.quantity <= product.reorderThreshold) {
                stockStatusClass = 'low-stock';
            }

            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.sku || 'N/A'}</td>
                <td>${product.category?.name || 'N/A'}</td>
                <td class="${stockStatusClass}">${product.quantity} ${product.unitOfMeasurement}</td>
                <td>${product.reorderThreshold}</td>
                <td>${product.supplier?.name || 'N/A'}</td>
                <td class="action-btns">
                    <button class="btn-icon" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    // Modal Handling
    const modal = document.getElementById('productModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const closeBtn = document.querySelector('.close-btn');
    const categorySelect = document.getElementById('productCategory');
    const supplierSelect = document.getElementById('productSupplier');
    const productForm = document.getElementById('productForm');

    // Populate dropdowns
    const populateSelect = async (selectElement, url, placeholder) => {
        try {
            const response = await fetch(url);
            const data = await response.json();
            selectElement.innerHTML = `<option value="">-- Select ${placeholder} --</option>`;
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item._id;
                option.textContent = item.name;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error(`Error populating ${placeholder}:`, error);
        }
    };

    addProductBtn.onclick = () => {
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        populateSelect(categorySelect, '/api/categories', 'Category');
        populateSelect(supplierSelect, '/api/suppliers', 'Supplier');
        modal.style.display = 'block';
    }
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    }
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Handle Form Submission
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productData = {
            name: document.getElementById('productName').value,
            sku: document.getElementById('productSku').value,
            category: document.getElementById('productCategory').value,
            quantity: document.getElementById('productQuantity').value,
            unitOfMeasurement: document.getElementById('productUom').value,
            costPrice: document.getElementById('productCostPrice').value,
            sellingPrice: document.getElementById('productSellingPrice').value,
            reorderThreshold: document.getElementById('productReorderThreshold').value,
            supplier: document.getElementById('productSupplier').value,
            expiryDate: document.getElementById('productExpiryDate').value,
        };

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                throw new Error('Failed to save product');
            }

            modal.style.display = 'none';
            fetchInventory(); // Refresh the table
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product. Please try again.');
        }
    });

    // Initial fetch
    fetchInventory();
});
