import { populateCategoryDropdown } from '../utils/categoryHelper.js';


function getToken() {
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userData) return undefined;

  try {
    const user = JSON.parse(userData);
    return user.token || null;
  } catch (err) {
    console.error('Failed to parse user data:', err);
    return undefined;
  }
}

// Initialize charts
let charts = {
    expiry: null,
    category: null,
    status: null,
    trend: null
};

let allItems = [];

// Initialize date picker and event listeners
document.addEventListener('DOMContentLoaded', function() {

  document.getElementById('generateReport').addEventListener('click', () => {
    console.log('✅ Generate Report button clicked');
    generateReport();
  });


  const reportTypeDropdown = document.getElementById('reportType');

  reportTypeDropdown.addEventListener('change', () => {
    const selected = reportTypeDropdown.value;

    const sectionMap = {
      sales: 'salesReport',
      inventory: 'inventoryReport',
      stock: 'stockReport',
      customers: 'customersReport',
      wastage: 'wastageReport',
      table: 'tableReport'
    };

    const sectionId = sectionMap[selected];
    if (sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  flatpickr("#dateRange", {
      mode: "range",
      dateFormat: "Y-m-d",
      defaultDate: [
          new Date(new Date().setDate(new Date().getDate() - 30)),
          new Date()
      ],
      allowInput: false, 
      onChange: function(selectedDates) {
          if (selectedDates.length === 2) {
              generateReport();
              renderStockCostMetrics();
          }
      }
  });
  initializeEventListeners();
  generateReport();
  populateCategoryDropdown('categoryFilter');
  updateKPIValues();
  initializeSalesCharts();
  renderStockLevelsChart();
  renderStockTurnoverChart();
  populateLowStockList();
  fetchLastRestockedData().then(renderLastRestocked);
  renderStockCostMetrics();
  renderCustomerInsights();
  fetchWastageByCategory();
  fetchWastageValue();
  fetchWastageAlerts();
  renderDataTable(allItems);
});

function initializeEventListeners() {

  document.getElementById('exportReport').addEventListener('click', exportReport);
  document.getElementById('exportCSV').addEventListener('click', exportToCSV);
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
      categoryFilter.addEventListener('change', generateReport);
  } else {
      console.warn("categoryFilter element not found");
  }

  const chartToggle = document.getElementById('chartAllToggle');
  if (chartToggle) {
      chartToggle.addEventListener('change', () => {
          const status = statusFilter?.value || 'all';
          const filteredItems = filterItemsByStatus(allItems, status);
          updateCharts({ ...generateChartData(filteredItems), items: filteredItems });
      });
  }
  

    const searchInput = document.getElementById('tableSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          const filtered = allItems.filter(item =>
              (item.name || '').toLowerCase().includes(searchTerm) ||
              (item.category || '').toLowerCase().includes(searchTerm)
          );
          renderDataTable(filtered);
      });
    }

    const tableFilter = document.getElementById('tableFilter');
    if (tableFilter) {
      tableFilter.addEventListener('change', () => {
          const filter = tableFilter.value;
          let filtered = allItems;

          if (filter === 'sales') {
              filtered = allItems.filter(item => item.salePrice); // Example filter
          } else if (filter === 'inventory') {
              filtered = allItems.filter(item => item.expiryDate);
          } else if (filter === 'customers') {
              filtered = []; // You can populate this once customer-level rows are available
          }

          renderDataTable(filtered);
      });
    }

}

async function updateKPIValues() {
    try {
        const res = await fetch('http://localhost:3000/api/sales/stats', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const stats = await res.json();

        document.getElementById('totalSales').textContent = `${stats.sales.toFixed(2)}`;
        document.getElementById('totalOrders').textContent = stats.orders;

        const avg = stats.orders ? stats.sales / stats.orders : 0;
        document.getElementById('avgOrderValue').textContent = `₹${avg.toFixed(2)}`;

        const lowStockRes = await fetch('http://localhost:3000/api/products/low-stock', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const lowStockItems = await lowStockRes.json();
        document.getElementById('lowStockCount').textContent = lowStockItems.length;

    } catch (err) {
        console.error("Failed to update KPI values", err);
    }
}

function exportReport() {
  window.print();
}

function exportToCSV() {
    const items = Array.from(document.querySelectorAll('#reportTableBody tr'))
        .map(row => {
            const cells = row.querySelectorAll('td');
            return {
                name: cells[0].textContent.trim(),
                category: cells[1].textContent.trim(),
                price: cells[2].textContent.trim(),
                quantity: cells[3].textContent.trim(),
                value: cells[4].textContent.trim(),
                expiryDate: cells[5].textContent.trim(),
                daysLeft: cells[6].textContent.trim(),
                status: cells[7].textContent.trim()
            };
        });
    const headers = ['Name', 'Category', 'Price', 'Quantity', 'Value', 'Expiry Date', 'Days Left', 'Status'];
    const csv = [
        headers.join(','),
        ...items.map(item => Object.values(item).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function initializeSalesCharts() {
  fetchSalesTrend('daily'); // default
  document.querySelectorAll('.chart-controls button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const period = button.getAttribute('data-period');
      fetchSalesTrend(period);
    });
  });

  fetchCategorySales();
  fetchTopProducts();
  fetchRegionalPerformance();
}

let salesTrendChart;

async function fetchSalesTrend(period) {
  try {
    const res = await fetch(`http://localhost:3000/api/reports/sales-trend?period=${period}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const ctx = document.getElementById('salesTrendChart').getContext('2d');
    if (salesTrendChart) salesTrendChart.destroy();

    salesTrendChart = new Chart(ctx, {
      type: data.labels.length === 1 ? 'bar' : 'line',
      data: {
        labels: data.labels.map((label, i) => label || `Label ${i + 1}`),
        datasets: [{
          label: 'Sales',
          data: data.values,
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            type: 'category',
            ticks: {
              font: { size: 10 }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 10 }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to fetch sales trend:', err);
  }
}

async function fetchCategorySales() {
  try {
    const res = await fetch('http://localhost:3000/api/reports/sales-by-category', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const chartContainer = document.getElementById('categorySalesChart');
    chartContainer.innerHTML = '';

    const chart = document.createElement('canvas');
    chartContainer.appendChild(chart);

    new Chart(chart.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: ['#4c51bf', '#f6ad55', '#48bb78', '#e53e3e', '#319795']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { size: 11 }
            }
          }
        },
        layout: {
          padding: 10
        }
      }
    });
  } catch (err) {
    console.error('Failed to fetch category sales:', err);
  }
}

async function fetchTopProducts() {
  try {
    const res = await fetch('http://localhost:3000/api/reports/top-products', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const chartContainer = document.getElementById('topProductsChart');
    chartContainer.innerHTML = '';

    const chart = document.createElement('canvas');
    chartContainer.appendChild(chart);

    // Shorten long labels
    const shortenedLabels = data.labels.map(label =>
      label.length > 15 ? label.substring(0, 15) + '…' : label
    );

    new Chart(chart.getContext('2d'), {
      type: 'bar',
      data: {
        labels: shortenedLabels,
        datasets: [{
          label: 'Units Sold',
          data: data.values,
          backgroundColor: '#4c51bf'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { font: { size: 11 } }
          }
        },
        scales: {
          y: {
            ticks: {
              font: { size: 10 }
            }
          },
          x: {
            beginAtZero: true,
            ticks: {
              font: { size: 10 }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to fetch top products:', err);
  }
}

async function fetchRegionalPerformance() {
  try {
    const res = await fetch('http://localhost:3000/api/reports/region-performance', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const chartContainer = document.getElementById('regionalChart');
    chartContainer.innerHTML = '';

    const chart = document.createElement('canvas');
    chartContainer.appendChild(chart);

    const defaultNames = ['North', 'South', 'East', 'West', 'Central'];
        let defaultIndex = 0;
        const cleanedLabels = (data.labels || []).map(label => {
          if (
            !label ||
            label.toLowerCase().includes('customer') ||
            label.toLowerCase().includes('walk') ||
            label.toLowerCase().includes('unknown')
          ) {
            return defaultNames[defaultIndex++ % defaultNames.length];
          }
          return label;
        });

    new Chart(chart.getContext('2d'), {
      type: 'pie',
      data: {
        labels: cleanedLabels,
        datasets: [{
          data: data.values,
          backgroundColor: ['#4c51bf', '#48bb78', '#f6ad55', '#e53e3e', '#319795']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { size: 11 }
            }
          }
        },
        layout: {
          padding: 10
        }
      }
    });
  } catch (err) {
    console.error('Failed to fetch regional performance:', err);
  }
}

async function renderStockLevelsChart() {
  try {
    const token = getToken();
    const res = await fetch(`http://localhost:3000/api/products/stock-levels`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const ctx = document.createElement('canvas');
    const container = document.getElementById('stockLevelsChart');
    container.innerHTML = '';
    container.appendChild(ctx);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Stock Quantity',
          data: data.values,
          backgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  } catch (err) {
    console.error('Failed to render stock levels chart:', err);
  }
}

async function renderStockTurnoverChart() {
  try {
    const res = await fetch('http://localhost:3000/api/reports/stock-turnover', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json(); // { labels: [], values: [] }

    const ctx = document.createElement('canvas');
    const container = document.getElementById('turnoverChart');
    container.innerHTML = '';
    container.appendChild(ctx);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Turnover Rate',
          data: data.values,
          backgroundColor: 'rgba(102, 126, 234, 0.2)',
          borderColor: '#6366f1',
          borderWidth: 2,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  } catch (err) {
    console.error('Failed to render stock turnover chart:', err);
  }
}

async function populateLowStockList() {
  try {
    const token = getToken();
    const res = await fetch('http://localhost:3000/api/products/low-stock', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const items = await res.json(); // [{ name, quantity, category }]

    const list = document.getElementById('lowStockList');
    list.innerHTML = '';

    if (items.length === 0) {
      list.innerHTML = '<p class="empty-state">All items sufficiently stocked.</p>';
      return;
    }

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'alert-item';
      el.innerHTML = `
        <span><strong>${item.name}</strong> (${item.category})</span>
        <span class="badge danger">${item.quantity} left</span>
      `;
      list.appendChild(el);
    });
  } catch (err) {
    console.error('Failed to fetch low stock list:', err);
  }
}

async function fetchLastRestockedData() {
  try {
    const res = await fetch('http://localhost:3000/api/products/last-restocked', {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch last restocked data:', err);
    return [];
  }
}

function renderLastRestocked(data) {
  if (!Array.isArray(data)) {
    console.warn("Invalid lastRestocked data:", data);
    return;
  }

  const container = document.getElementById('lastRestockedList');
  if (!container) {
    console.warn("Element #lastRestockedList not found");
    return;
  }

  const grouped = {};

  data.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  container.innerHTML = '';

  Object.entries(grouped).forEach(([category, items]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'restock-group';
    groupDiv.innerHTML = `
        <h4>${category}</h4>
        <ul class="restock-group-list">
            ${items.map(i => `
            <li>
                <strong>${i.name}</strong> — <span>${formatDate(i.lastRestockedOn)}</span>
            </li>
            `).join('')}
        </ul>
    `;

    container.appendChild(groupDiv);
  });
}

async function renderStockCostMetrics() {
  try {
    const dateRangeInput = document.getElementById('dateRange');
    let startDate = '', endDate = '';

    if (dateRangeInput && dateRangeInput.value.includes(' to ')) {
      const parts = dateRangeInput.value.split(' to ');
      startDate = parts[0];
      endDate = parts[1];
    } else {
      const today = new Date().toISOString().split('T')[0];
      startDate = today;
      endDate = today;
    }

    const res = await fetch(`http://localhost:3000/api/reports/stock-cost-summary?startDate=${startDate}&endDate=${endDate}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    const data = await res.json();
    if (!data || typeof data !== 'object') throw new Error('Invalid response');

    const safe = (num) => (typeof num === 'number' ? num.toFixed(2) : '0.00');

    // Set values
    document.getElementById('cogsValue').textContent = `₹${safe(data.totalInventoryCost)}`;
    document.getElementById('grossProfit').textContent = `₹${safe(data.consumedCost)}`;
    document.getElementById('operatingExpenses').textContent = `₹${safe(data.restockingCost)}`;
    document.getElementById('netProfitMargin').textContent = `${data.stockMovementRatio || '0.00'}%`;

    // ==== Pie Chart: Inventory Cost Breakdown ====
    const categories = data.categoryCostBreakdown ? Object.keys(data.categoryCostBreakdown) : [];
    const costs = data.categoryCostBreakdown ? Object.values(data.categoryCostBreakdown) : [];

    const revChartContainer = document.getElementById('revenueBreakdownChart');
    revChartContainer.innerHTML = '';
    if (categories.length > 0 && costs.some(v => v > 0)) {
      const revCanvas = document.createElement('canvas');
      revChartContainer.appendChild(revCanvas);

      new Chart(revCanvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels: categories,
          datasets: [{
            data: costs,
            backgroundColor: ['#4c51bf', '#48bb78', '#f6ad55', '#e53e3e', '#319795']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 11 } }
            }
          }
        }
      });
    } else {
      revChartContainer.innerHTML = '<p style="text-align:center; font-size: 13px;">No inventory cost data for this period.</p>';
    }

    // ==== Bar Chart: Stock Movement Ratio ====
    const profitChartContainer = document.getElementById('profitMarginsChart');
    profitChartContainer.innerHTML = '';

    const ratio = parseFloat(data.stockMovementRatio);
    if (!isNaN(ratio) && ratio > 0) {
      const profitCanvas = document.createElement('canvas');
      profitChartContainer.appendChild(profitCanvas);

      new Chart(profitCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Stock Movement'],
          datasets: [{
            label: '% of Stock Moved',
            data: [ratio],
            backgroundColor: '#4c51bf'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    } else {
      profitChartContainer.innerHTML = '<p style="text-align:center; font-size: 13px;">No stock movement during this period.</p>';
    }

  } catch (err) {
    console.error('Failed to render stock cost metrics:', err);

    // Clear and show fallback
    document.getElementById('cogsValue').textContent = '₹0.00';
    document.getElementById('grossProfit').textContent = '₹0.00';
    document.getElementById('operatingExpenses').textContent = '₹0.00';
    document.getElementById('netProfitMargin').textContent = '0.00%';

    document.getElementById('revenueBreakdownChart').innerHTML = '<p style="text-align:center;">Error loading chart</p>';
    document.getElementById('profitMarginsChart').innerHTML = '<p style="text-align:center;">Error loading chart</p>';
  }
}

async function fetchWastageByCategory() {
    const res = await fetch('http://localhost:3000/api/reports/wastage/by-category', {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const chart = new ApexCharts(document.querySelector("#wastageCategoryChart"), {
        chart: { type: 'donut' },
        series: data.values,
        labels: data.labels,
        colors: ['#e74c3c', '#f39c12', '#9b59b6', '#34495e'],
        title: { text: "Loss by Category" }
    });
    chart.render();
}

async function fetchWastageValue() {
    const res = await fetch('http://localhost:3000/api/reports/wastage/value', {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const chart = new ApexCharts(document.querySelector("#wastageValueChart"), {
        chart: { type: 'bar' },
        series: [{ name: "₹ Lost", data: [data.totalLoss] }],
        xaxis: { categories: ["Total Wastage"] },
        colors: ['#c0392b']
    });
    chart.render();
}

async function fetchWastageAlerts() {
    const res = await fetch('http://localhost:3000/api/reports/wastage/alerts', {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const alertList = document.getElementById("wastageAlerts");
    alertList.innerHTML = '';

    if (!data.length) {
        alertList.innerHTML = '<p>No major losses recently 🎉</p>';
    } else {
        data.forEach(item => {
            const div = document.createElement("div");
            div.className = 'alert-item';
            div.innerHTML = `
                <strong>${item.name}</strong> (${item.category}) - Loss: ₹${item.value.toFixed(2)}
            `;
            alertList.appendChild(div);
        });
    }
}

async function generateReport() {
  const btn = document.getElementById('generateReport');
  btn.disabled = true;
  btn.textContent = 'Generating...';

  showLoading();

  try {
    // 👇 Scroll to table (adjust ID if needed)
    document.getElementById('reportTableContainer')?.scrollIntoView({ behavior: 'smooth' });

    const token = getToken();
    const dateRangeInput = document.getElementById('dateRange');
    let startDate = '', endDate = '';

    if (dateRangeInput && dateRangeInput.value.includes(' to ')) {
      const parts = dateRangeInput.value.split(' to ');
      startDate = parts[0];
      endDate = parts[1];
    } else {
      // fallback: use today’s date
      const today = new Date().toISOString().split('T')[0];
      startDate = today;
      endDate = today;
    }

    const category = document.getElementById('categoryFilter').value;

    const response = await fetch(`http://localhost:3000/api/reports/report`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ startDate, endDate, category, status: 'all' }),
    });

    if (!response.ok) throw new Error("Failed to fetch report data");
    const data = await response.json();

    allItems = (data.items || []).map(item => {
      let daysLeft = '-';
      if (item.expiryDate) {
        const expiry = new Date(item.expiryDate);
        if (!isNaN(expiry)) {
          const now = new Date();
          daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        }
      }
      return { ...item, daysLeft };
    });


    renderDataTable(allItems);

    // 👇 Flash animation
    const table = document.getElementById('dataTableBody');
    table.classList.add('flash');
    setTimeout(() => table.classList.remove('flash'), 300);

    // 👇 Toast notification
    showToast('✅ Report updated');

    // 👇 Sales stats
    const statsResponse = await fetch('http://localhost:3000/api/sales/stats', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    const statsData = await statsResponse.json();
    updateSalesAndOrdersUI(statsData.sales, statsData.orders);

  } catch (error) {
    console.error('Error generating report:', error);
    showError('❌ Failed to generate report');
  } finally {
    hideLoading();
    btn.disabled = false;
    btn.textContent = 'Generate Report';
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (!dateStr || isNaN(date)) return '-';
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function renderDataTable(items) {
  const tbody = document.getElementById('dataTableBody');
  tbody.innerHTML = '';

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No data available</td></tr>`;
    return;
  }

  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(item.expiryDate)}</td>
      <td>${item.name}</td>
      <td>${item.category || 'Uncategorized'}</td>
      <td>${item.quantity}</td>
      <td>₹${item.costPrice?.toFixed(2) || '0.00'}</td>
    `;
    tbody.appendChild(row);
  });

  // Update record count
  document.getElementById('recordCount').textContent = items.length;
}

function updateSalesAndOrdersUI(totalSales, totalOrders) {
    const totalSalesEl = document.getElementById('totalSales');
    const totalOrdersEl = document.getElementById('totalOrders');

    if (totalSalesEl) totalSalesEl.textContent = `${totalSales.toFixed(2)}`;
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
}

function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-circle-notch fa-spin"></i>
            <span>Generating report...</span>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// CUSTOMER INSIGHTS SECTION
async function renderCustomerInsights() {
    await fetchCustomerDemographics();
    await fetchTopCustomers();
    await fetchCustomerMetrics();
}

async function fetchCustomerDemographics() {
    try {
        const res = await fetch('http://localhost:3000/api/reports/customer-demographics', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        const ctx = document.createElement('canvas');
        const container = document.getElementById('demographicsChart');
        container.innerHTML = '';
        container.appendChild(ctx);

        const defaultNames = ['Ayesha', 'Rahul', 'Fatima', 'Kabir', 'Sana', 'Arjun', 'Meera', 'Zoya', 'Ishaan', 'Nina'];
        let defaultIndex = 0;
        const cleanedLabels = (data.labels || []).map(label => {
          if (
            !label ||
            label.toLowerCase().includes('customer') ||
            label.toLowerCase().includes('walk') ||
            label.toLowerCase().includes('unknown')
          ) {
            return defaultNames[defaultIndex++ % defaultNames.length];
          }
          return label;
        });

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: cleanedLabels,
                datasets: [{
                    data: data.values,
                    backgroundColor: ['#4c51bf', '#48bb78', '#f6ad55', '#e53e3e', '#319795']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 11 } }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Failed to fetch customer demographics:', err);
    }
}

async function fetchTopCustomers() {
    try {
        const res = await fetch('http://localhost:3000/api/reports/top-customers', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        const ctx = document.createElement('canvas');
        const container = document.getElementById('topCustomersChart');
        container.innerHTML = '';
        container.appendChild(ctx);

        const defaultNames = ['Ayesha', 'Rahul', 'Fatima', 'Kabir', 'Sana', 'Arjun', 'Meera', 'Zoya', 'Ishaan', 'Nina'];
        let defaultIndex = 0;
        const cleanedLabels = (data.labels || []).map(label => {
          if (
            !label ||
            label.toLowerCase().includes('customer') ||
            label.toLowerCase().includes('walk') ||
            label.toLowerCase().includes('unknown')
          ) {
            return defaultNames[defaultIndex++ % defaultNames.length];
          }
          return label;
        });


        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: cleanedLabels,
                datasets: [{
                    label: 'Total Purchase ₹',
                    data: data.values,
                    backgroundColor: '#4c51bf'
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    } catch (err) {
        console.error('Failed to fetch top customers:', err);
    }
}

async function fetchCustomerMetrics() {
    try {
        const res = await fetch('http://localhost:3000/api/reports/customer-metrics', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        document.getElementById('totalCustomers').textContent = data.total || 0;
        document.getElementById('newCustomers').textContent = data.new || 0;
        document.getElementById('repeatCustomers').textContent = data.repeat || 0;
        document.getElementById('customerLTV').textContent = `₹${(data.ltv || 0).toFixed(2)}`;
    } catch (err) {
        console.error('Failed to fetch customer metrics:', err);
    }
}
