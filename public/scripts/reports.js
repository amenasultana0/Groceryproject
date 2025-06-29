import { populateCategoryDropdown } from '../utils/categoryHelper.js';
import { getToken } from '../utils/authHelper.js';

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
    const token = getToken();
    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [
            new Date(new Date().setDate(new Date().getDate() - 30)),
            new Date()
        ],
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                generateReport(); // Regenerate when user changes
            }
        }
    });
    initializeEventListeners();
    generateReport();
    populateCategoryDropdown('categoryFilter');
    calculateWasteManagement();
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
            updateExpiryChart(generateExpiryData(allItems), chartType);
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
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
        const token = user?.token;

        const response = await fetch(`http://localhost:3000/api/reports/report`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ startDate, endDate, category, status: 'all' }),
        });

        const data = await response.json();
        allItems = data.items || [];

        updateMetrics(calculateMetrics(allItems));

        if (data.actions) {
            document.getElementById('immediateAction').textContent = formatCurrency(data.actions.immediate.totalValue || 0);
            document.getElementById('shortTermAction').textContent = formatCurrency(data.actions.shortTerm.totalValue || 0);
        }

        updateFilteredView();
        updateInsights(data);

        hideLoading();
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Failed to generate report');
        hideLoading();
    }
}

function showNotification(message, type = 'info') {
    let container = document.getElementById('notificationToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationToastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-end';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.textContent = message;
    toast.style.marginTop = '10px';
    toast.style.minWidth = '180px';
    toast.style.padding = '12px 20px';
    toast.style.background = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#6366f1');
    toast.style.color = '#fff';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';

    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Animate out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
    }, 3000);
    
    setTimeout(() => toast.remove(), 3300);
}

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
        totalValue += (item.costPrice || 0) * (item.quantity || 0);
    });

    return { expired, expiringSoon, fresh, totalValue };
}

function updateCharts(data) {
    const chartSourceItems = data.items || allItems;
    addStatusToItems(chartSourceItems);

    const categoryData = generateCategoryData(chartSourceItems);
    const statusData = generateStatusData(chartSourceItems);
    const expiryData = generateExpiryData(chartSourceItems);
    const weeklyTrendData = generateWeeklyExpiryTrend(chartSourceItems);

    updateExpiryChart(expiryData);
    updateCategoryChart(categoryData);
    updateStatusChart(statusData);
    updateTrendChart(weeklyTrendData);
}

function updateExpiryChart(expiryData, type = 'line') {
    const ctx = document.getElementById('expiryChart').getContext('2d');
    if (charts.expiry) charts.expiry.destroy();

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradientFill.addColorStop(1, 'rgba(99, 102, 241, 0.05)');

    const gridGradient = ctx.createLinearGradient(0, 0, 0, 400);
    gridGradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
    gridGradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

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
                fill: type === 'line',
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 10,
                pointHoverBackgroundColor: '#6366f1',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    titleFont: { size: 14, weight: '600' },
                    bodyFont: { size: 13 },
                    padding: 12
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 12, weight: '500' }
                    }
                },
                y: { 
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 12, weight: '500' }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function updateCategoryChart(data) {
    const options = {
        chart: { 
            type: 'donut', 
            height: '100%',
            fontFamily: 'Inter, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        series: data.data,
        labels: data.labels,
        colors: ['#f97316', '#22c55e', '#fbbf24', '#ef4444', '#9f7aea', '#3b82f6', '#ec4899'],
        plotOptions: { 
            pie: { 
                donut: { 
                    size: '70%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '14px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            color: '#1e293b'
                        },
                        value: {
                            show: true,
                            fontSize: '16px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 700,
                            color: '#6366f1'
                        }
                    }
                } 
            } 
        },
        legend: { 
            position: 'bottom',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 500,
            markers: {
                radius: 6
            }
        },
        tooltip: {
            theme: 'dark',
            style: {
                fontSize: '12px'
            }
        }
    };
    
    if (charts.category) charts.category.destroy();
    charts.category = new ApexCharts(document.querySelector("#categoryChart"), options);
    charts.category.render();
}

function updateStatusChart(data) {
    const options = {
        chart: { 
            type: 'bar', 
            height: '100%', 
            stacked: true,
            fontFamily: 'Inter, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        series: [
            { name: 'Fresh', data: data.data.fresh, color: '#22c55e' },
            { name: 'Expiring Soon', data: data.data.expiring, color: '#f59e0b' },
            { name: 'Expired', data: data.data.expired, color: '#ef4444' }
        ],
        xaxis: { 
            categories: data.categories,
            labels: {
                style: {
                    colors: '#64748b',
                    fontSize: '12px',
                    fontWeight: 500
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#64748b',
                    fontSize: '12px',
                    fontWeight: 500
                }
            }
        },
        plotOptions: { 
            bar: { 
                horizontal: true, 
                borderRadius: 6,
                dataLabels: {
                    position: 'center'
                }
            } 
        },
        legend: {
            position: 'top',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 500
        },
        tooltip: {
            theme: 'dark',
            style: {
                fontSize: '12px'
            }
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4
        }
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
        chart: { 
            type: 'area', 
            height: '100%',
            fontFamily: 'Inter, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        series: [{ 
            name: 'Items', 
            data: trendData.data 
        }],
        xaxis: { 
            categories: trendData.labels,
            labels: {
                style: {
                    colors: '#64748b',
                    fontSize: '12px',
                    fontWeight: 500
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#64748b',
                    fontSize: '12px',
                    fontWeight: 500
                }
            }
        },
        stroke: { 
            curve: 'smooth', 
            width: 3,
            colors: ['#6366f1']
        },
        fill: { 
            type: 'gradient', 
            gradient: { 
                shadeIntensity: 1, 
                opacityFrom: 0.7, 
                opacityTo: 0.1, 
                stops: [0, 90, 100],
                colorStops: [
                    { offset: 0, color: '#6366f1', opacity: 0.7 },
                    { offset: 100, color: '#6366f1', opacity: 0.1 }
                ]
            } 
        },
        colors: ['#6366f1'],
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4
        },
        tooltip: {
            theme: 'dark',
            style: {
                fontSize: '12px'
            }
        }
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
        const price = item.costPrice || 0;
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

function animateProgressBar(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (parseFloat(el.style.width) === value) return;

    el.style.transition = 'width 0.8s ease';
    el.style.width = '0%';        // Reset first
    el.offsetWidth;               // 🔧 Force reflow
    setTimeout(() => {
        el.style.width = `${value}%`;  // Then animate to the target width
    }, 10); // Delay ensures transition is visible
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
    let freshnessIndex = parseFloat(data?.metrics?.freshnessIndex);
    if (isNaN(freshnessIndex)) freshnessIndex = 0;

    document.getElementById('freshnessIndex').textContent = freshnessIndex;


    ['excellentQuality', 'goodQuality', 'fairQuality', 'poorQuality'].forEach(id => {
    animateProgressBar(id, 0);
});

// Highlight the correct freshness level based on index
if (freshnessIndex >= 75) {
    animateProgressBar('excellentQuality', 100);
    animateProgressBar('goodQuality', 0);
    animateProgressBar('fairQuality', 0);
    animateProgressBar('poorQuality', 0);
} else if (freshnessIndex >= 50) {
    animateProgressBar('excellentQuality', 0);
    animateProgressBar('goodQuality', 100);
    animateProgressBar('fairQuality', 0);
    animateProgressBar('poorQuality', 0);
} else if (freshnessIndex >= 25) {
    animateProgressBar('excellentQuality', 0);
    animateProgressBar('goodQuality', 0);
    animateProgressBar('fairQuality', 100);
    animateProgressBar('poorQuality', 0);
} else {
    animateProgressBar('excellentQuality', 0);
    animateProgressBar('goodQuality', 0);
    animateProgressBar('fairQuality', 0);
    animateProgressBar('poorQuality', 100);
}

    // --- Real Storage Optimization Calculation ---

// 1. Space Utilization: total quantity / max capacity (set max, e.g., 100)
const maxCapacity = 100; // You can adjust this value
const totalQuantity = (allItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
const spaceUtilization = Math.min(100, Math.round((totalQuantity / maxCapacity) * 100));

// 2. Temperature Compliance: % of items in compliant categories
const compliantCategories = ['refrigerated', 'frozen', 'produce']; // adjust as needed
const compliantCount = (allItems || []).filter(item =>
    item.category && compliantCategories.includes(item.category.toLowerCase())
).length;
const tempCompliance = allItems.length ? Math.round((compliantCount / allItems.length) * 100) : 100;

// 3. Organization Score: % of items with a category assigned
const withCategory = (allItems || []).filter(item => item.category && item.category !== 'others').length;
const orgScore = allItems.length ? Math.round((withCategory / allItems.length) * 100) : 100;

// 4. Optimization Score: average of the above
const optScore = Math.round((spaceUtilization + tempCompliance + orgScore) / 3);

document.getElementById('storageOptScore').textContent = optScore;
animateProgressBar('spaceUtilization', spaceUtilization);
animateProgressBar('tempCompliance', tempCompliance);
animateProgressBar('orgScore', orgScore);
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
    return '₹' + (value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
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
                costPrice: cells[2].textContent.trim(),
                quantity: cells[3].textContent.trim(),
                value: cells[4].textContent.trim(),
                expiryDate: cells[5].textContent.trim(),
                daysLeft: cells[6].textContent.trim(),
                status: cells[7].textContent.trim()
            };
        });
    const headers = ['Name', 'Category', 'Cost Price', 'Quantity', 'Value', 'Expiry Date', 'Days Left', 'Status'];
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

async function calculateWasteManagement() {
  try {
    const res = await fetch(`http://localhost:3000/api/products`, {
      headers: {
        Authorization: `Bearer ${getToken()}`}
    });
    const products = await res.json();
    const today = new Date();

    let totalWasteCount = 0;
    let totalWasteValue = 0;

    products.forEach(product => {
      const expiry = new Date(product.expiryDate);
      if (expiry < today && product.quantity > 0) {
        totalWasteCount += product.quantity;
        totalWasteValue += product.quantity * (product.costPrice || 0);
      }
    });

    // Inject values into the UI
    document.getElementById('wasteItemCount').textContent = totalWasteCount;
    document.getElementById('wasteValue').textContent = `₹${totalWasteValue.toFixed(2)}`;

  } catch (err) {
    console.error('Error calculating waste management:', err);
  }
}