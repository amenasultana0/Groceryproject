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

let allItems = [];

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
    document.getElementById('chartAllToggle').addEventListener('change', () => {
    // Use the last filtered items for data
    const status = document.getElementById('statusFilter').value;
    const filteredItems = filterItemsByStatus(allItems, status);
    updateCharts({ ...generateChartData(filteredItems), items: filteredItems });
    });

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

function filterItemsByStatus(items, status) {
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);

    if (!status || status === 'all') return items;

    if (status === 'expired') {
        return items.filter(item => new Date(item.expiryDate) < now);
    }
    if (status === 'expiring') {
        return items.filter(item => {
            const expiry = new Date(item.expiryDate);
            return expiry >= now && expiry <= in7Days;
        });
    }
    if (status === 'fresh') {
        return items.filter(item => new Date(item.expiryDate) > in7Days);
    }
    return items;
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
            body: JSON.stringify({ startDate, endDate, category, status: 'all' }),
        });

        const data = await response.json();
        allItems = data.items || [];

        updateMetrics(calculateMetrics(allItems));

        updateFilteredView();

        // updateCharts(data);
        // updateTable(data.items);
        updateInsights(data);

        hideLoading();
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Failed to generate report');
        hideLoading();
    }
}

// This function updates the table and charts based on the selected status
function updateFilteredView() {
    const status = document.getElementById('statusFilter').value;
    const filteredItems = filterItemsByStatus(allItems, status);

    updateCharts({ ...generateChartData(filteredItems), items: filteredItems });
    updateTable(filteredItems);
}

function updateMetrics(metrics) {
    document.getElementById('expiringSoonCount').textContent = metrics.expiringSoon || 0;
    document.getElementById('expiredItemsCount').textContent = metrics.expired || 0;
    document.getElementById('freshItemsCount').textContent = metrics.fresh || 0;
    document.getElementById('totalValue').textContent = formatCurrency(metrics.totalValue || 0);
}

function calculateMetrics(items) {
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);

    let expired = 0, expiringSoon = 0, fresh = 0, totalValue = 0;

    items.forEach(item => {
        const expiry = new Date(item.expiryDate);
        if (expiry < now) {
            expired++;
        } else if (expiry >= now && expiry <= in7Days) {
            expiringSoon++;
        } else if (expiry > in7Days) {
            fresh++;
        }
        totalValue += (item.price || 0) * (item.quantity || 0);
    });

    return { expired, expiringSoon, fresh, totalValue };
}

function updateCharts(data) {
    // Check the toggle state
    const showAll = document.getElementById('chartAllToggle')?.checked;
    // Use allItems or filtered items based on toggle
    const chartSourceItems = showAll ? allItems : (data.items || []);

    addStatusToItems(chartSourceItems);

    const categoryData = generateCategoryData(chartSourceItems);
    const statusData = generateStatusData(chartSourceItems);
    
    const expiryData = generateExpiryData(chartSourceItems);

    const weeklyTrendData = generateWeeklyExpiryTrend(chartSourceItems);
    

    updateExpiryChart(expiryData); // This can stay filtered if you want
    updateCategoryChart(categoryData);
    updateStatusChart(statusData);
    updateTrendChart(weeklyTrendData);
}

function updateExpiryChart(expiryData, type = 'line') {
    const ctx = document.getElementById('expiryChart').getContext('2d');
    if (charts.expiry) charts.expiry.destroy();

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    gradientFill.addColorStop(1, 'rgba(99, 102, 241, 0)');

    charts.expiry = new Chart(ctx, {
        type: type,
        data: {
            labels: expiryData.labels,
            datasets: [{
                label: 'Items',
                data: expiryData.data,
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

function generateWeeklyExpiryTrend(items) {
    const labels = [];
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const dayStart = new Date(day.setHours(0,0,0,0));
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        labels.push(dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        const count = items.filter(item => {
            const expiry = new Date(item.expiryDate);
            return expiry >= dayStart && expiry < dayEnd;
        }).length;
        data.push(count);
    }
    return { labels, data };
}

function updateTrendChart(trendData) {
    const options = {
        chart: { type: 'area', height: '100%' },
        series: [{ name: 'Items', data: trendData.data }],
        xaxis: { categories: trendData.labels },
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

    // Update Freshness Quality Distribution
    if (data.metrics.freshnessQuality) {
    const quality = data.metrics.freshnessQuality;
    console.log("Freshness Quality:", data.metrics.freshnessQuality);

    document.getElementById('excellentQuality').style.width = `${quality.excellent || 0}%`;
    document.getElementById('goodQuality').style.width = `${quality.good || 0}%`;
    document.getElementById('fairQuality').style.width = `${quality.fair || 0}%`;
    document.getElementById('poorQuality').style.width = `${quality.poor || 0}%`;
    } else {
    console.warn("No freshness quality data found.");
    }

    // Storage Optimization (dummy values)
    document.getElementById('storageOptScore').textContent = Math.round(Math.random() * 20 + 80);
    document.getElementById('spaceUtilization').style.width = `${Math.round(Math.random() * 20 + 80)}%`;
    document.getElementById('tempCompliance').style.width = `${Math.round(Math.random() * 15 + 80)}%`;
    document.getElementById('orgScore').style.width = `${Math.round(Math.random() * 25 + 70)}%`;
    // Value Analysis (dummy values)
    document.getElementById('immediateAction').textContent = formatCurrency(Math.round(Math.random() * 1000));
    document.getElementById('shortTermAction').textContent = formatCurrency(Math.round(Math.random() * 2000));
}

function addStatusToItems(items) {
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);

    items.forEach(item => {
        const expiry = new Date(item.expiryDate);
        if (expiry < now) {
            item.status = 'expired';
        } else if (expiry >= now && expiry <= in7Days) {
            item.status = 'expiring';
        } else {
            item.status = 'fresh';
        }
    });
}

function generateChartData(items) {
    const categories = {};
    items.forEach(item => {
        if (!item || !item.category) return;
        // Count items instead of summing value
        categories[item.category] = (categories[item.category] || 0) + 1;
    });
    return {
        expiry: generateExpiryData(items),
        category: generateCategoryData(items),
        status: generateStatusData(items),
        trend: generateExpiryData(items)
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
        categories[item.category] = (categories[item.category] || 0) + 1;
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