// Initialize charts
let charts = {
    expiry: null,
    category: null,
    status: null,
    trend: null
};

// Initialize date picker
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date picker
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

    // Initialize event listeners
    initializeEventListeners();
    
    // Generate initial report
    generateReport();
});

function initializeEventListeners() {
    // Filter changes
    document.getElementById('categoryFilter').addEventListener('change', generateReport);
    document.getElementById('statusFilter').addEventListener('change', generateReport);
    
    // Chart type toggle
    document.querySelectorAll('.chart-controls button').forEach(button => {
        button.addEventListener('click', () => {
            const chartType = button.dataset.chart;
            document.querySelectorAll('.chart-controls button').forEach(btn => 
                btn.classList.remove('active'));
            button.classList.add('active');
            updateExpiryChart(chartType);
        });
    });
    
    // Table search
    document.getElementById('tableSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#expiryTable tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    // Table sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            sortTable(column);
        });
    });
    
    // Export buttons
    document.getElementById('exportReport').addEventListener('click', exportReport);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    
    // Navigation
    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

function generateSampleData(startDate, endDate, categories, status) {
    // Sample categories
    const groceryCategories = {
        fruits: {
            name: 'Fruits',
            items: ['Apples', 'Bananas', 'Oranges', 'Berries', 'Grapes'],
            color: '#f97316'
        },
        vegetables: {
            name: 'Vegetables',
            items: ['Carrots', 'Tomatoes', 'Lettuce', 'Broccoli', 'Peppers'],
            color: '#22c55e'
        },
        dairy: {
            name: 'Dairy',
            items: ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream'],
            color: '#fbbf24'
        },
        meat: {
            name: 'Meat',
            items: ['Chicken', 'Beef', 'Pork', 'Fish', 'Lamb'],
            color: '#ef4444'
        },
        bakery: {
            name: 'Bakery',
            items: ['Bread', 'Pastries', 'Cakes', 'Cookies', 'Muffins'],
            color: '#9f7aea'
        }
    };

    // Generate random items
    const items = [];
    const today = new Date();
    
    Object.entries(groceryCategories).forEach(([key, category]) => {
        if (categories.includes('all') || categories.includes(key)) {
            category.items.forEach(itemName => {
                const daysToExpiry = Math.floor(Math.random() * 30) - 5; // -5 to 25 days
                const expiryDate = new Date(today);
                expiryDate.setDate(expiryDate.getDate() + daysToExpiry);
                
                // Lower price range in INR (₹20 to ₹300)
                const price = Math.random() * 280 + 20;
                const quantity = Math.floor(Math.random() * 10) + 1; // 1 to 10 items
                
                const item = {
                    name: itemName,
                    category: category.name,
                    categoryColor: category.color,
                    price: price,
                    quantity: quantity,
                    value: price * quantity,
                    expiryDate: expiryDate,
                    daysLeft: daysToExpiry,
                    status: getStatus(daysToExpiry)
                };
                
                // Filter by status if specified
                if (status === 'all' || 
                    (status === 'expiring' && daysToExpiry <= 7 && daysToExpiry > 0) ||
                    (status === 'expired' && daysToExpiry <= 0) ||
                    (status === 'fresh' && daysToExpiry > 7)) {
                    items.push(item);
                }
            });
        }
    });

    // Calculate metrics
    const metrics = {
        expiringSoon: items.filter(i => i.daysLeft > 0 && i.daysLeft <= 7).length,
        expired: items.filter(i => i.daysLeft <= 0).length,
        fresh: items.filter(i => i.daysLeft > 7).length,
        totalValue: items.reduce((sum, item) => sum + item.value, 0)
    };

    // Generate insights data
    const insights = {
        expiry: {
            critical: items.filter(i => i.daysLeft >= 0 && i.daysLeft <= 2).length,
            warning: items.filter(i => i.daysLeft > 2 && i.daysLeft <= 5).length,
            attention: items.filter(i => i.daysLeft > 5 && i.daysLeft <= 7).length,
            safe: items.filter(i => i.daysLeft > 7).length
        },
        freshness: {
            overallScore: Math.round((items.filter(i => i.daysLeft > 7).length / items.length) * 100) || 0,
            distribution: {
                excellent: Math.round((items.filter(i => i.daysLeft > 14).length / items.length) * 100) || 0,
                good: Math.round((items.filter(i => i.daysLeft > 7 && i.daysLeft <= 14).length / items.length) * 100) || 0,
                fair: Math.round((items.filter(i => i.daysLeft > 3 && i.daysLeft <= 7).length / items.length) * 100) || 0,
                poor: Math.round((items.filter(i => i.daysLeft <= 3).length / items.length) * 100) || 0
            }
        },
        storage: {
            score: Math.round(Math.random() * 30 + 70), // 70-100%
            spaceUtilization: Math.round(Math.random() * 20 + 75), // 75-95%
            temperatureCompliance: Math.round(Math.random() * 15 + 80), // 80-95%
            organization: Math.round(Math.random() * 25 + 70) // 70-95%
        },
        value: {
            immediateAction: items
                .filter(i => i.daysLeft <= 3 && i.daysLeft > 0)
                .reduce((sum, item) => sum + item.value, 0),
            shortTerm: items
                .filter(i => i.daysLeft > 3 && i.daysLeft <= 7)
                .reduce((sum, item) => sum + item.value, 0)
        }
    };

    // Calculate risk level
    const riskScore = (insights.expiry.critical * 3 + insights.expiry.warning * 2 + insights.expiry.attention) /
                     Math.max(1, insights.expiry.critical + insights.expiry.warning + insights.expiry.attention + insights.expiry.safe);
    insights.riskLevel = riskScore >= 2 ? 'High' : riskScore >= 1 ? 'Medium' : 'Low';

    return {
        items,
        metrics,
        insights,
        chartData: generateChartData(items)
    };
}

async function generateReport() {
    showLoading();
    
    try {
        // Get filter values
        const dateRange = document.getElementById('dateRange').value.split(' to ');
        const startDate = dateRange[0];
        const endDate = dateRange[1] || dateRange[0];
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        // Generate sample data (replace with actual API call)
        const data = generateSampleData(startDate, endDate, [category], status);
        
        // Update UI
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

function getStatus(daysLeft) {
    if (daysLeft <= 0) return 'expired';
    if (daysLeft <= 7) return 'expiring';
    return 'fresh';
}

function generateWastePreventionTips(items) {
    const expiringSoon = items
        .filter(i => i.daysLeft > 0 && i.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 3);
    
    return expiringSoon.map(item => ({
        item: item.name,
        tip: `Use ${item.name} within ${item.daysLeft} days to prevent waste of ${formatCurrency(item.value)}`
    }));
}

function generateTrendingItems(items) {
    return items
        .filter(i => i.daysLeft > 7)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map(item => ({
            name: item.name,
            value: item.value
        }));
}

function generateStorageTips(items) {
    const expiringSoon = items
        .filter(i => i.daysLeft > 0 && i.daysLeft <= 7)
        .slice(0, 3);
    
    return expiringSoon.map(item => ({
        item: item.name,
        tip: `Ensure proper storage for ${item.name} to extend shelf life`
    }));
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
    // Enhanced data generation for better visualization
    const timelineData = new Array(8).fill(0); // -1 to 6 days
    const maxItems = Math.max(...items.map(item => item.quantity));
    
    items.forEach(item => {
        if (item.daysLeft >= -1 && item.daysLeft <= 6) {
            timelineData[item.daysLeft + 1] += item.quantity;
        }
    });
    
    // Ensure we have some minimum values for visualization
    const minValue = Math.max(1, Math.floor(maxItems * 0.1));
    timelineData.forEach((value, index) => {
        if (value === 0) {
            timelineData[index] = Math.random() * minValue;
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
        categories[item.category] = (categories[item.category] || 0) + item.quantity;
    });
    
    return {
        labels: Object.keys(categories),
        data: Object.values(categories)
    };
}

function generateStatusData(items) {
    const categories = [...new Set(items.map(item => item.category))];
    const data = {
        expired: [],
        expiring: [],
        fresh: []
    };
    
    categories.forEach(category => {
        const categoryItems = items.filter(item => item.category === category);
        data.expired.push(categoryItems.filter(item => item.status === 'expired').length);
        data.expiring.push(categoryItems.filter(item => item.status === 'expiring').length);
        data.fresh.push(categoryItems.filter(item => item.status === 'fresh').length);
    });
    
    return {
        categories,
        data
    };
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

function updateMetrics(metrics) {
    document.getElementById('expiringSoon').textContent = metrics.expiringSoon;
    document.getElementById('expiredItems').textContent = metrics.expired;
    document.getElementById('freshItems').textContent = metrics.fresh;
    document.getElementById('totalValue').textContent = formatCurrency(metrics.totalValue);
}

function updateCharts(data) {
    updateExpiryChart();
    updateCategoryChart(data.chartData.category);
    updateStatusChart(data.chartData.status);
    updateTrendChart(data.chartData.trend);
}

function updateExpiryChart(type = 'line') {
    const ctx = document.getElementById('expiryChart').getContext('2d');
    const chartData = charts.expiry?.data || generateExpiryData([]);
    
    if (charts.expiry) {
        charts.expiry.destroy();
    }
    
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    gradientFill.addColorStop(1, 'rgba(99, 102, 241, 0)');

    // Enhanced chart configuration
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
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1f2937',
                    bodyColor: '#1f2937',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} items`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        },
                        padding: 10
                    },
                    title: {
                        display: true,
                        text: 'Number of Items',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        padding: 10
                    },
                    title: {
                        display: true,
                        text: 'Time to Expiry',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 10
                    }
                }
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        }
    });
}

function updateCategoryChart(data) {
    const options = {
        chart: {
            type: 'donut',
            height: '100%'
        },
        series: data.data,
        labels: data.labels,
        colors: ['#f97316', '#22c55e', '#fbbf24', '#ef4444', '#9f7aea'],
        plotOptions: {
            pie: {
                donut: {
                    size: '70%'
                }
            }
        },
        legend: {
            position: 'bottom'
        }
    };

    if (charts.category) {
        charts.category.destroy();
    }
    charts.category = new ApexCharts(document.querySelector("#categoryChart"), options);
    charts.category.render();
}

function updateStatusChart(data) {
    const options = {
        chart: {
            type: 'bar',
            height: '100%',
            stacked: true
        },
        series: [
            {
                name: 'Fresh',
                data: data.data.fresh,
                color: '#22c55e'
            },
            {
                name: 'Expiring Soon',
                data: data.data.expiring,
                color: '#f59e0b'
            },
            {
                name: 'Expired',
                data: data.data.expired,
                color: '#ef4444'
            }
        ],
        xaxis: {
            categories: data.categories
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 6
            }
        }
    };

    if (charts.status) {
        charts.status.destroy();
    }
    charts.status = new ApexCharts(document.querySelector("#statusChart"), options);
    charts.status.render();
}

function updateTrendChart(data) {
    const options = {
        chart: {
            type: 'area',
            height: '100%'
        },
        series: [{
            name: 'Items',
            data: data.data
        }],
        xaxis: {
            categories: data.labels
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.2,
                stops: [0, 90, 100]
            }
        },
        colors: ['#6366f1']
    };

    if (charts.trend) {
        charts.trend.destroy();
    }
    charts.trend = new ApexCharts(document.querySelector("#trendChart"), options);
    charts.trend.render();
}

function updateTable(items) {
    const tbody = document.querySelector('#expiryTable tbody');
    tbody.innerHTML = '';
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="item-name">
                    <span>${item.name}</span>
                </div>
            </td>
            <td>
                <div class="category" style="color: ${item.categoryColor}">
                    ${item.category}
                </div>
            </td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.value)}</td>
            <td>${formatDate(item.expiryDate)}</td>
            <td>${formatDaysLeft(item.daysLeft)}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <button class="btn-icon" onclick="showItemDetails(${JSON.stringify(item)})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('itemCount').textContent = items.length;
}

function updateInsights(data) {
    // Update Expiry Timeline
    document.querySelector('.timeline-metrics .critical .count').textContent = data.insights.expiry.critical;
    document.querySelector('.timeline-metrics .warning .count').textContent = data.insights.expiry.warning;
    document.querySelector('.timeline-metrics .attention .count').textContent = data.insights.expiry.attention;
    document.querySelector('.timeline-metrics .safe .count').textContent = data.insights.expiry.safe;
    document.querySelector('.risk-level').textContent = `Risk Level: ${data.insights.riskLevel}`;

    // Update Freshness Index
    const freshness = data.insights.freshness;
    document.querySelector('.freshness-metrics .overall-freshness span:first-child').textContent = freshness.overallScore;
    
    // Update progress bars
    document.querySelector('#excellentQuality').style.width = `${freshness.distribution.excellent}%`;
    document.querySelector('#goodQuality').style.width = `${freshness.distribution.good}%`;
    document.querySelector('#fairQuality').style.width = `${freshness.distribution.fair}%`;
    document.querySelector('#poorQuality').style.width = `${freshness.distribution.poor}%`;

    // Update Storage Optimization
    const storage = data.insights.storage;
    document.querySelector('.storage-metrics .storage-score span:first-child').textContent = storage.score;
    document.querySelector('#spaceUtilization').style.width = `${storage.spaceUtilization}%`;
    document.querySelector('#tempCompliance').style.width = `${storage.temperatureCompliance}%`;
    document.querySelector('#orgScore').style.width = `${storage.organization}%`;

    // Update Value Analysis
    document.querySelector('#immediateAction').textContent = formatCurrency(data.insights.value.immediateAction);
    document.querySelector('#shortTermAction').textContent = formatCurrency(data.insights.value.shortTerm);
}

// Utility Functions
function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0 // Remove decimal places for INR
    }).format(value);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDaysLeft(days) {
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    return `${days} day${days === 1 ? '' : 's'}`;
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

function sortTable(column) {
    const tbody = document.querySelector('#expiryTable tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const aValue = a.children[getColumnIndex(column)].textContent;
        const bValue = b.children[getColumnIndex(column)].textContent;
        
        if (column === 'price' || column === 'value') {
            return parseFloat(aValue.replace(/[^0-9.-]+/g, '')) - 
                   parseFloat(bValue.replace(/[^0-9.-]+/g, ''));
        }
        
        if (column === 'daysLeft') {
            const aDays = aValue === 'Expired' ? -1 : 
                         aValue === 'Today' ? 0 : 
                         parseInt(aValue);
            const bDays = bValue === 'Expired' ? -1 : 
                         bValue === 'Today' ? 0 : 
                         parseInt(bValue);
            return aDays - bDays;
        }
        
        return aValue.localeCompare(bValue);
    });
    
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

function getColumnIndex(column) {
    const indices = {
        name: 0,
        category: 1,
        price: 2,
        quantity: 3,
        value: 4,
        expiry: 5,
        daysLeft: 6,
        status: 7
    };
    return indices[column];
}

function exportReport() {
    window.print();
}

function exportToCSV() {
    const items = Array.from(document.querySelectorAll('#expiryTable tbody tr'))
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
    if (overlay) {
        overlay.remove();
    }
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

// New Analytics Functions
function generateExpiryTimeline(items) {
    const timeline = {
        critical: items.filter(i => i.daysLeft <= 2).length,
        warning: items.filter(i => i.daysLeft > 2 && i.daysLeft <= 5).length,
        attention: items.filter(i => i.daysLeft > 5 && i.daysLeft <= 7).length,
        safe: items.filter(i => i.daysLeft > 7).length
    };
    
    return {
        data: timeline,
        riskLevel: calculateRiskLevel(timeline)
    };
}

function analyzeRiskFactors(items) {
    const categories = {};
    items.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = {
                expired: 0,
                expiring: 0,
                total: 0,
                value: 0
            };
        }
        categories[item.category].total++;
        categories[item.category].value += item.value;
        
        if (item.daysLeft <= 0) categories[item.category].expired++;
        else if (item.daysLeft <= 7) categories[item.category].expiring++;
    });
    
    return Object.entries(categories).map(([category, data]) => ({
        category,
        riskScore: Math.round(((data.expired * 2 + data.expiring) / data.total) * 100),
        valueAtRisk: data.value,
        expiryRate: Math.round((data.expired / data.total) * 100)
    }));
}

function calculateCategoryFreshness(items) {
    const categories = {};
    items.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = {
                totalDays: 0,
                itemCount: 0,
                freshItems: 0
            };
        }
        categories[item.category].itemCount++;
        categories[item.category].totalDays += Math.max(0, item.daysLeft);
        if (item.daysLeft > 7) categories[item.category].freshItems++;
    });
    
    return Object.entries(categories).map(([category, data]) => ({
        category,
        freshnessScore: Math.round((data.freshItems / data.itemCount) * 100),
        averageShelfLife: Math.round(data.totalDays / data.itemCount),
        qualityRating: ['Poor', 'Fair', 'Good', 'Excellent'][Math.floor(Math.random() * 4)]
    }));
}

function generateQualityMetrics(items) {
    return {
        overallFreshness: Math.round((items.filter(i => i.daysLeft > 7).length / items.length) * 100),
        qualityDistribution: {
            excellent: Math.round((items.filter(i => i.daysLeft > 14).length / items.length) * 100),
            good: Math.round((items.filter(i => i.daysLeft > 7 && i.daysLeft <= 14).length / items.length) * 100),
            fair: Math.round((items.filter(i => i.daysLeft > 3 && i.daysLeft <= 7).length / items.length) * 100),
            poor: Math.round((items.filter(i => i.daysLeft <= 3).length / items.length) * 100)
        },
        trendAnalysis: generateTrendAnalysis(items)
    };
}

function calculateStorageOptimization(items) {
    const metrics = {
        spaceUtilization: Math.round(Math.random() * 30 + 70),
        temperatureCompliance: Math.round(Math.random() * 20 + 80),
        organizationScore: Math.round(Math.random() * 25 + 75)
    };
    
    return {
        ...metrics,
        overallScore: Math.round(Object.values(metrics).reduce((a, b) => a + b) / 3)
    };
}

function analyzeStorageZones(items) {
    const zones = ['Refrigerator', 'Freezer', 'Pantry', 'Counter'];
    return zones.map(zone => ({
        zone,
        utilization: Math.round(Math.random() * 30 + 70),
        itemCount: Math.floor(Math.random() * items.length / 3),
        recommendations: generateZoneRecommendations(zone)
    }));
}

function generateValueBreakdown(items) {
    const categories = {};
    items.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = {
                total: 0,
                atRisk: 0
            };
        }
        categories[item.category].total += item.value;
        if (item.daysLeft <= 7) categories[item.category].atRisk += item.value;
    });
    
    return Object.entries(categories).map(([category, data]) => ({
        category,
        totalValue: data.total,
        atRiskValue: data.atRisk,
        savingsPotential: Math.round((data.atRisk / data.total) * 100)
    }));
}

function identifySavingsOpportunities(items) {
    return {
        immediateAction: items
            .filter(i => i.daysLeft <= 3 && i.daysLeft > 0)
            .reduce((sum, item) => sum + item.value, 0),
        shortTerm: items
            .filter(i => i.daysLeft > 3 && i.daysLeft <= 7)
            .reduce((sum, item) => sum + item.value, 0),
        preventiveMeasures: generatePreventiveMeasures(items)
    };
}

function generateTrendAnalysis(items) {
    return {
        weeklyTrend: Array.from({ length: 4 }, () => Math.round(Math.random() * 30 + 70)),
        improvement: Math.round(Math.random() * 20 - 10),
        factors: [
            'Storage conditions',
            'Purchase frequency',
            'Seasonal variations',
            'Consumption patterns'
        ]
    };
}

function generateZoneRecommendations(zone) {
    const recommendations = {
        Refrigerator: ['Organize items by expiry date', 'Check temperature settings', 'Use clear containers'],
        Freezer: ['Maintain proper temperature', 'Use freezer bags', 'Label items clearly'],
        Pantry: ['Keep dry and cool', 'Use airtight containers', 'Implement FIFO system'],
        Counter: ['Check ripeness daily', 'Maintain proper airflow', 'Separate ethylene-producing items']
    };
    
    return recommendations[zone] || [];
}

function generatePreventiveMeasures(items) {
    return [
        {
            type: 'Shopping Habits',
            potential: Math.round(items.reduce((sum, item) => sum + (item.daysLeft <= 0 ? item.value : 0), 0) * 0.7),
            actions: ['Buy smaller quantities', 'Check expiry dates before purchase', 'Plan meals in advance']
        },
        {
            type: 'Storage Optimization',
            potential: Math.round(items.reduce((sum, item) => sum + (item.daysLeft <= 7 ? item.value : 0), 0) * 0.3),
            actions: ['Organize by expiry date', 'Use proper storage containers', 'Monitor storage conditions']
        }
    ];
}

function calculateRiskLevel(timeline) {
    const riskScore = (timeline.critical * 3 + timeline.warning * 2 + timeline.attention) / 
                     (timeline.critical + timeline.warning + timeline.attention + timeline.safe);
    
    if (riskScore >= 2) return 'High';
    if (riskScore >= 1) return 'Medium';
    return 'Low';
} 
async function loadReports() {
  const res = await fetch('/api/reports/report');
  const data = await res.json();

  document.getElementById('expiredItemsCount').innerText = data.counts.expired;
  document.getElementById('expiringSoonCount').innerText = data.counts.expiringSoon;
  document.getElementById('freshItemsCount').innerText = data.counts.fresh;
  document.getElementById('totalValue').innerText = `₹${data.totalValue}`;
  document.getElementById('freshnessIndex').innerText = `${data.freshnessIndex}%`;

  const table = document.getElementById('reportTableBody');
  table.innerHTML = "";
  data.items.forEach(item => {
    const row = `<tr>
      <td>${item.name}</td><td>${item.category}</td><td>${item.price}</td>
      <td>${item.quantity}</td><td>${item.price * item.quantity}</td>
      <td>${new Date(item.expiryDate).toLocaleDateString()}</td><td>${item.daysLeft}</td>
      <td>${item.daysLeft < 0 ? 'Expired' : item.daysLeft <= 7 ? 'Expiring' : 'Fresh'}</td>
    </tr>`;
    table.innerHTML += row;
  });
}

// 🔁 Automatically run when page loads
window.onload = loadReports;
