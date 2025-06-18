function normalizeStatus(status) {
    if (!status) return '-';
    status = status.toLowerCase().replace(/\s+/g, '');
    if (status === 'expiringsoon') return 'expiring';
    return status;
}

// Initialize charts
let charts = {
    expiry: null,
    category: null,
    status: null,
    trend: null
};

// Initialize date picker and event listeners
document.addEventListener('DOMContentLoaded', function() {
    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [new Date(), new Date(new Date().setDate(new Date().getDate() + 30))],
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                generateReport();
            }
        }
    });

    initializeEventListeners();
    generateReport();
});

function initializeEventListeners() {
    document.getElementById('categoryFilter').addEventListener('change', generateReport);
    document.getElementById('statusFilter').addEventListener('change', generateReport);

    document.querySelectorAll('.chart-controls button').forEach(button => {
        button.addEventListener('click', () => {
            const chartType = button.dataset.chart;
            document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateExpiryChart(chartType);
        });
    });

    document.getElementById('tableSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#reportTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    document.getElementById('exportReport').addEventListener('click', exportReport);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

async function generateReport() {
    showLoading();
    try {
        const dateRange = document.getElementById('dateRange').value.split(' to ');
        const startDate = dateRange[0];
        const endDate = dateRange[1] || dateRange[0];
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;

        const response = await fetch(`http://localhost:3000/api/reports/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate, category, status }),
        });

        const data = await response.json();

        updateMetrics(data.metrics);
        updateCharts(data);
        updateTable(data.items);
        updateInsights(data);

        hideLoading();
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Failed to generate report');
        hideLoading();
    }
}

function updateMetrics(metrics) {
    document.getElementById('expiringSoonCount').textContent = metrics.expiringSoon || 0;
    document.getElementById('expiredItemsCount').textContent = metrics.expired || 0;
    document.getElementById('freshItemsCount').textContent = metrics.fresh || 0;
    document.getElementById('totalValue').textContent = formatCurrency(metrics.totalValue || 0);
}

function updateCharts(data) {
    const chartData = generateChartData(data.items || []);
    updateExpiryChart();
    updateCategoryChart(chartData.category);
    updateStatusChart(chartData.status);
    updateTrendChart(chartData.trend);
}

function updateExpiryChart(type = 'line') {
    const ctx = document.getElementById('expiryChart').getContext('2d');
    const chartData = charts.expiry?.data || generateExpiryData([]);
    if (charts.expiry) charts.expiry.destroy();

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    gradientFill.addColorStop(1, 'rgba(99, 102, 241, 0)');

    charts.expiry = new Chart(ctx, {
        type: type,
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Items',
                data: chartData.data,
                borderColor: '#6366f1',
                backgroundColor: type === 'line' ? gradientFill : 'rgba(99, 102, 241, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#6366f1',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function updateCategoryChart(data) {
    const options = {
        chart: { type: 'donut', height: '100%' },
        series: data.data,
        labels: data.labels,
        colors: ['#f97316', '#22c55e', '#fbbf24', '#ef4444', '#9f7aea'],
        plotOptions: { pie: { donut: { size: '70%' } } },
        legend: { position: 'bottom' }
    };
    if (charts.category) charts.category.destroy();
    charts.category = new ApexCharts(document.querySelector("#categoryChart"), options);
    charts.category.render();
}

function updateStatusChart(data) {
    const options = {
        chart: { type: 'bar', height: '100%', stacked: true },
        series: [
            { name: 'Fresh', data: data.data.fresh, color: '#22c55e' },
            { name: 'Expiring Soon', data: data.data.expiring, color: '#f59e0b' },
            { name: 'Expired', data: data.data.expired, color: '#ef4444' }
        ],
        xaxis: { categories: data.categories },
        plotOptions: { bar: { horizontal: true, borderRadius: 6 } }
    };
    if (charts.status) charts.status.destroy();
    charts.status = new ApexCharts(document.querySelector("#statusChart"), options);
    charts.status.render();
}

function updateTrendChart(data) {
    const options = {
        chart: { type: 'area', height: '100%' },
        series: [{ name: 'Items', data: data.data }],
        xaxis: { categories: data.labels },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 90, 100] } },
        colors: ['#6366f1']
    };
    if (charts.trend) charts.trend.destroy();
    charts.trend = new ApexCharts(document.querySelector("#trendChart"), options);
    charts.trend.render();
}

function updateTable(items) {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    items.forEach(item => {
        const name = item.name || '-';
        const category = item.category || '-';
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        const value = price * quantity;
        const expiryDate = item.expiryDate ? formatDate(item.expiryDate) : '-';
        const daysLeft = (item.daysLeft !== undefined && item.daysLeft !== null) ? item.daysLeft : '-';
        const status = item.status || '-';
        const categoryColor = item.categoryColor || '#333';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><div class="item-name"><span>${name}</span></div></td>
            <td><div class="category" style="color: ${categoryColor}">${category}</div></td>
            <td>${formatCurrency(price)}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(value)}</td>
            <td>${expiryDate}</td>
            <td>${daysLeft}</td>
            <td>${getStatusBadge(normalizeStatus(item.status))}</td>
            <td>
                <button class="btn-icon" onclick='showItemDetails(${JSON.stringify(item)})'>
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById('itemCount').textContent = items.length;
}

function updateInsights(data) {
    if (!data || !data.metrics || !data.metrics.expiry) return;
    // Expiry Timeline
    document.getElementById('criticalCount').textContent = data.metrics.expiry.critical;
    document.getElementById('warningCount').textContent = data.metrics.expiry.warning;
    document.getElementById('attentionCount').textContent = data.metrics.expiry.attention;
    document.getElementById('safeCount').textContent = data.metrics.expiry.safe;
    // Risk Level (simple logic)
    const riskLevel = (data.metrics.expiry.critical > 0)
        ? 'High'
        : (data.metrics.expiry.warning > 0)
            ? 'Medium'
            : 'Low';
    document.getElementById('riskLevel').textContent = riskLevel;
    // Freshness Index
    document.getElementById('freshnessIndex').textContent = data.metrics.freshnessIndex || 0;
    // Storage Optimization (dummy values)
    document.getElementById('storageOptScore').textContent = Math.round(Math.random() * 20 + 80);
    document.getElementById('spaceUtilization').style.width = `${Math.round(Math.random() * 20 + 80)}%`;
    document.getElementById('tempCompliance').style.width = `${Math.round(Math.random() * 15 + 80)}%`;
    document.getElementById('orgScore').style.width = `${Math.round(Math.random() * 25 + 70)}%`;
    // Value Analysis (dummy values)
    document.getElementById('immediateAction').textContent = formatCurrency(Math.round(Math.random() * 1000));
    document.getElementById('shortTermAction').textContent = formatCurrency(Math.round(Math.random() * 2000));
}

function generateChartData(items) {
    return {
        expiry: generateExpiryData(items),
        category: generateCategoryData(items),
        status: generateStatusData(items),
        trend: generateTrendData(items)
    };
}

function generateExpiryData(items) {
    const timelineData = new Array(8).fill(0);
    items.forEach(item => {
        if (item.daysLeft >= -1 && item.daysLeft <= 6) {
            timelineData[item.daysLeft + 1] += item.quantity || 1;
        }
    });
    return {
        labels: ['Expired', 'Today', '1 day', '2 days', '3 days', '4 days', '5 days', '6 days'],
        data: timelineData
    };
}

function generateCategoryData(items) {
    const categories = {};
    items.forEach(item => {
        if (!item || !item.category) return;
        categories[item.category] = (categories[item.category] || 0) + ((item.price || 0) * (item.quantity || 0));
    });
    return {
        labels: Object.keys(categories),
        data: Object.values(categories)
    };
}

function generateStatusData(items) {
    const categories = [...new Set(items.map(item => item.category))];
    const data = { expired: [], expiring: [], fresh: [] };
    categories.forEach(category => {
        const categoryItems = items.filter(item => item.category === category);
        data.expired.push(categoryItems.filter(item => normalizeStatus(item.status) === 'expired').length);
        data.expiring.push(categoryItems.filter(item => normalizeStatus(item.status) === 'expiring').length);
        data.fresh.push(categoryItems.filter(item => normalizeStatus(item.status) === 'fresh').length);
    });
    return { categories, data };
}

function generateTrendData(items) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = new Array(7).fill(0);
    const today = new Date().getDay();
    items.forEach(item => {
        const dayIndex = (today + item.daysLeft) % 7;
        if (dayIndex >= 0 && dayIndex < 7) {
            data[dayIndex]++;
        }
    });
    return {
        labels: [...days.slice(today), ...days.slice(0, today)],
        data: [...data.slice(today), ...data.slice(0, today)]
    };
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getStatusBadge(status) {
    const classes = {
        expired: 'danger',
        expiring: 'warning',
        fresh: 'success'
    };
    return `<span class="status-badge ${classes[status]}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

function showItemDetails(item) {
    // Implement item details modal
    console.log('Show details for:', item);
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