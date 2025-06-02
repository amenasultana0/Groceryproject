document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("itemModal");
    const openBtn = document.getElementById("openModal");
    const closeBtn = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const form = document.getElementById("itemForm");
    const tbody = document.getElementById("inventory-body");
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");

    // 🔙 Back button functionality
    const backBtn = document.getElementById("goBackBtn");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            history.back();
        });
    }

    openBtn.onclick = () => (modal.style.display = "flex");
    closeBtn.onclick = () => (modal.style.display = "none");
    cancelBtn.onclick = () => (modal.style.display = "none");

    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = "none";
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("itemName").value;
        const quantity = document.getElementById("quantity").value;
        const expiry = document.getElementById("expiryDate").value;
        const category = document.getElementById("category").value;

        const status = getStatus(expiry);
        const row = document.createElement("tr");
        row.setAttribute("data-category", category);
        row.innerHTML = `
        <td></td>
        <td>${name}</td>
        <td>${quantity}</td>
        <td>${expiry}</td>
        <td><span class="status ${status.toLowerCase().replace(/ /g, '-')}">${status}</span></td>
        <td><button class="delete-btn">Delete</button></td>
      `;

        row.querySelector(".delete-btn").addEventListener("click", () => {
            row.remove();
            updateSerialNumbers();
        });

        tbody.appendChild(row);
        updateSerialNumbers();
        form.reset();
        modal.style.display = "none";
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.target.closest("tr").remove();
            updateSerialNumbers();
        });
    });

    document.querySelectorAll(".sortable").forEach((header) => {
        header.addEventListener("click", () => {
            const column = header.dataset.column;
            const rows = Array.from(document.querySelectorAll("#inventory-body tr"));
            const colIndex = { item: 1, quantity: 2, expiryDate: 3 }[column];

            rows.sort((a, b) => {
                let valA = a.cells[colIndex].textContent.toLowerCase();
                let valB = b.cells[colIndex].textContent.toLowerCase();

                if (column === "quantity") {
                    valA = parseInt(valA);
                    valB = parseInt(valB);
                } else if (column === "expiryDate") {
                    valA = new Date(valA);
                    valB = new Date(valB);
                }

                return valA > valB ? 1 : -1;
            });

            tbody.innerHTML = "";
            rows.forEach((row) => tbody.appendChild(row));
            updateSerialNumbers();
        });
    });

    searchInput.addEventListener("input", function () {
        const filter = this.value.toLowerCase();
        const rows = document.querySelectorAll("#inventory-body tr");
        rows.forEach((row) => {
            const item = row.cells[1].textContent.toLowerCase();
            row.style.display = item.includes(filter) ? "" : "none";
        });
    });

    categoryFilter.addEventListener("change", function () {
        const selected = this.value.toLowerCase();
        const rows = document.querySelectorAll("#inventory-body tr");
        rows.forEach((row) => {
            const category = row.getAttribute("data-category")?.toLowerCase() || "";
            row.style.display = !selected || category === selected ? "" : "none";
        });
    });

    function updateSerialNumbers() {
        document.querySelectorAll("#inventory-body tr").forEach((row, index) => {
            row.cells[0].textContent = index + 1;
        });
    }

    function getStatus(expiryDateStr) {
        const expiryDate = new Date(expiryDateStr);
        const today = new Date();
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return "Expired";
        if (diffDays <= 3) return "Expiring Soon";
        return "Fresh";
    }
});
