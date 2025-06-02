document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("itemModal");
    const openBtn = document.getElementById("openModal");
    const closeBtn = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const form = document.getElementById("itemForm");
    const tbody = document.getElementById("inventory-body");
  
    openBtn.onclick = () => modal.style.display = "flex";
    closeBtn.onclick = () => modal.style.display = "none";
    cancelBtn.onclick = () => modal.style.display = "none";
  
    window.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const name = document.getElementById("itemName").value;
      const quantity = document.getElementById("quantity").value;
      const expiry = document.getElementById("expiryDate").value;
  
      const today = new Date();
      const expDate = new Date(expiry);
      const status = expDate < today ? "Expired" : "Fresh";
  
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${name}</td>
        <td>${quantity}</td>
        <td>${expiry}</td>
        <td><span class="status ${status.toLowerCase()}">${status}</span></td>
        <td><button class="delete-btn">Delete</button></td>
      `;
  
      // Delete button functionality
      row.querySelector(".delete-btn").addEventListener("click", () => {
        row.remove();
      });
  
      tbody.appendChild(row);
      form.reset();
      modal.style.display = "none";
    });
  
    // Enable delete on existing items
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.target.closest("tr").remove();
      });
    });
  });
  