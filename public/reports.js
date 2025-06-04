// Sample Data Categories with simplified items
const GROCERY_CATEGORIES = {
    FRUITS: {
        name: 'Exotic Fruits',
        icon: 'fa-apple-whole',
        color: '#f97316',
        items: [
            { name: 'Japanese Fuji Apples', price: 7.99, shelf_life: 14, storage: 'refrigerated', nutrition_score: 85, origin: 'Japan', organic: true },
            { name: 'Thai Golden Mangoes', price: 6.99, shelf_life: 7, storage: 'room_temp', nutrition_score: 90, origin: 'Thailand', organic: false },
            { name: 'Dragon Fruit (Pitaya)', price: 12.99, shelf_life: 5, storage: 'refrigerated', nutrition_score: 88, origin: 'Vietnam', organic: true },
            { name: 'Mixed Berry Medley', price: 9.99, shelf_life: 5, storage: 'refrigerated', nutrition_score: 95, origin: 'Local Farm', organic: true },
            { name: 'Passion Fruit Bundle', price: 8.99, shelf_life: 8, storage: 'room_temp', nutrition_score: 92, origin: 'Brazil', organic: false }
        ]
    },
    VEGETABLES: {
        name: 'Premium Vegetables',
        icon: 'fa-carrot',
        color: '#22c55e',
        items: [
            { name: 'Heirloom Tomato Mix', price: 6.99, shelf_life: 7, storage: 'refrigerated', nutrition_score: 98, origin: 'Local Farm', organic: true },
            { name: 'Rainbow Swiss Chard', price: 5.99, shelf_life: 10, storage: 'refrigerated', nutrition_score: 85, origin: 'California', organic: true },
            { name: 'Purple Asparagus Bundle', price: 8.99, shelf_life: 5, storage: 'refrigerated', nutrition_score: 92, origin: 'Peru', organic: true },
            { name: 'Watermelon Radish', price: 4.99, shelf_life: 14, storage: 'refrigerated', nutrition_score: 88, origin: 'Local Farm', organic: false },
            { name: 'Micro Greens Mix', price: 7.99, shelf_life: 7, storage: 'refrigerated', nutrition_score: 95, origin: 'Hydroponic Farm', organic: true }
        ]
    },
    DAIRY: {
        name: 'Artisanal Dairy',
        icon: 'fa-cheese',
        color: '#fbbf24',
        items: [
            { name: 'French Cheese Board', price: 24.99, shelf_life: 30, storage: 'refrigerated', nutrition_score: 75, origin: 'France', artisanal: true },
            { name: 'Pasture-Raised Eggs', price: 8.99, shelf_life: 28, storage: 'refrigerated', nutrition_score: 90, origin: 'Local Farm', organic: true },
            { name: 'Greek Honey Yogurt', price: 6.99, shelf_life: 21, storage: 'refrigerated', nutrition_score: 85, origin: 'Greece', probiotic: true },
            { name: 'Barista Oat Milk', price: 5.99, shelf_life: 10, storage: 'refrigerated', nutrition_score: 88, origin: 'Sweden', organic: true },
            { name: 'Cultured Butter', price: 9.99, shelf_life: 30, storage: 'refrigerated', nutrition_score: 80, origin: 'France', artisanal: true }
        ]
    },
    BAKERY: {
        name: 'Artisan Bakery',
        icon: 'fa-bread-slice',
        color: '#9f7aea',
        items: [
            { name: 'San Francisco Sourdough', price: 8.99, shelf_life: 5, storage: 'room_temp', nutrition_score: 85, origin: 'In-house', artisanal: true },
            { name: 'French Butter Croissants', price: 12.99, shelf_life: 3, storage: 'room_temp', nutrition_score: 75, origin: 'In-house', artisanal: true },
            { name: 'Ancient Grain Muffins', price: 9.99, shelf_life: 7, storage: 'room_temp', nutrition_score: 80, origin: 'In-house', gluten_free: true },
            { name: 'Nordic Rye Bread', price: 7.99, shelf_life: 4, storage: 'room_temp', nutrition_score: 70, origin: 'Denmark', organic: true },
            { name: 'Sprouted Bagels', price: 6.99, shelf_life: 5, storage: 'room_temp', nutrition_score: 88, origin: 'In-house', vegan: true }
        ]
    },
    MEAT: {
        name: 'Premium Meats',
        icon: 'fa-drumstick-bite',
        color: '#ef4444',
        items: [
            { name: 'A5 Wagyu Ribeye', price: 129.99, shelf_life: 7, storage: 'refrigerated', nutrition_score: 85, origin: 'Japan', grade: 'A5' },
            { name: 'Free-Range Chicken', price: 15.99, shelf_life: 5, storage: 'refrigerated', nutrition_score: 90, origin: 'Local Farm', organic: true },
            { name: 'Wild Alaskan Salmon', price: 29.99, shelf_life: 4, storage: 'refrigerated', nutrition_score: 95, origin: 'Alaska', wild_caught: true },
            { name: 'Heritage Turkey', price: 89.99, shelf_life: 6, storage: 'refrigerated', nutrition_score: 88, origin: 'Local Farm', heritage: true },
            { name: 'New Zealand Lamb Rack', price: 44.99, shelf_life: 5, storage: 'refrigerated', nutrition_score: 85, origin: 'New Zealand', grass_fed: true }
        ]
    }
};

// Storage Conditions
const STORAGE_CONDITIONS = {
    ROOM_TEMP: 'Room Temperature',
    REFRIGERATED: 'Refrigerated',
    FROZEN: 'Frozen'
};

// Shelf Life Categories
const SHELF_LIFE = {
    SHORT: { max: 7, unit: 'days' },
    MEDIUM: { max: 30, unit: 'days' },
    LONG: { max: 90, unit: 'days' },
    EXTENDED: { max: 180, unit: 'days' }
};

// Initialize chart instances
let expiryChart = null;
let categoryChart = null;
let statusChart = null;
let trendChart = null;
let itemHistoryChart = null;

// Premium Analytics Features
const ANALYTICS_FEATURES = {
    WASTE_PREVENTION: {
        title: 'Waste Prevention Score',
        icon: 'fa-leaf',
        calculate: (items) => {
            const expiringSoon = items.filter(i => i.daysLeft > 0 && i.daysLeft <= 7).length;
            const total = items.length;
            return Math.round((1 - (expiringSoon / total)) * 100);
        }
    },
    FRESHNESS_INDEX: {
        title: 'Freshness Index',
        icon: 'fa-star',
        calculate: (items) => {
            const fresh = items.filter(i => i.daysLeft > 7).length;
            const total = items.length;
            return Math.round((fresh / total) * 100);
        }
    },
    STORAGE_OPTIMIZATION: {
        title: 'Storage Optimization',
        icon: 'fa-box',
        calculate: (items) => {
            const properlyStored = items.filter(i => i.storage === 'refrigerated').length;
            const total = items.length;
            return Math.round((properlyStored / total) * 100);
        }
    }
};

// Initialize premium features
let premiumCharts = {
    expiryChart: null,
    categoryChart: null,
    statusChart: null,
    trendChart: null,
    itemHistoryChart: null,
    nutritionChart: null,
    valueChart: null,
    storageChart: null
};

// Premium Insights
const INSIGHTS = {
    generateInsights: (data) => {
        return {
            wastePrevention: {
                score: ANALYTICS_FEATURES.WASTE_PREVENTION.calculate(data.items),
                recommendations: getWastePreventionTips(data.items)
            },
            freshness: {
                score: ANALYTICS_FEATURES.FRESHNESS_INDEX.calculate(data.items),
                trending: getTrendingItems(data.items)
            },
            storage: {
                score: ANALYTICS_FEATURES.STORAGE_OPTIMIZATION.calculate(data.items),
                recommendations: getStorageOptimizationTips(data.items)
            },
            value: {
                total: calculateTotalValue(data.items),
                potential_savings: calculatePotentialSavings(data.items)
            }
        };
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeDateFilters();
    initializeEventListeners();
    generateReport();
    initializeAnimations();
});

function initializeDateFilters() {
    const dateRange = document.getElementById('dateRange');
    const customDateRange = document.getElementById('customDateRange');
    
    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById('startDate').value = formatDate(firstDay);
    document.getElementById('endDate').value = formatDate(lastDay);

    // Handle date range changes
    dateRange.addEventListener('change', function() {
        const range = this.value;
        const dates = calculateDateRange(range);
        document.getElementById('startDate').value = formatDate(dates.start);
        document.getElementById('endDate').value = formatDate(dates.end);
        
        customDateRange.style.display = range === 'custom' ? 'flex' : 'none';
        if (range !== 'custom') {
            generateReport();
        }
    });
}

function initializeEventListeners() {
    // Report generation
    document.getElementById('generateReport').addEventListener('click', generateReport);
    
    // Export buttons
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('printReport').addEventListener('click', exportReport);
    
    // Share functionality
    document.getElementById('shareReport').addEventListener('click', showShareModal);
    document.querySelector('.close-modal').addEventListener('click', hideShareModal);
    document.getElementById('copyLink').addEventListener('click', copyShareLink);
    
    // Table search
    document.getElementById('tableSearch').addEventListener('input', handleTableSearch);
    
    // Table sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => handleTableSort(th.dataset.sort));
    });
    
    // Chart type toggle
    document.querySelectorAll('.chart-controls button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateExpiryChart(lastTimelineData, button.dataset.chart);
        });
    });
    
    // Back to dashboard
    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Expiry range change
    document.getElementById('expiryRange').addEventListener('change', generateReport);
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', generateReport);

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));

    // Initialize tooltips
    initializeTooltips();
}

function initializeAnimations() {
    // Add fade-in animation to metric cards
    document.querySelectorAll('.metric-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Add hover effects to table rows
    document.querySelectorAll('#expiryTable tbody tr').forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.transition = 'all 0.3s ease';
            row.style.transform = 'scale(1.01)';
        });
        row.addEventListener('mouseleave', () => {
            row.style.transform = 'scale(1)';
        });
    });
}

function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', e => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = element.dataset.tooltip;
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            tooltip.style.left = `${rect.left + (rect.width/2) - (tooltip.offsetWidth/2)}px`;
            
            setTimeout(() => tooltip.style.opacity = '1', 10);
        });
        
        element.addEventListener('mouseleave', () => {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

function calculateDateRange(range) {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch(range) {
        case 'today':
            start = today;
            break;
        case 'week':
            start = new Date(today.setDate(today.getDate() - 7));
            break;
        case 'month':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'quarter':
            start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
            end = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
            break;
        case 'year':
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31);
            break;
    }

    return { start, end };
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Store the last data for chart type toggle
let lastTimelineData = null;
let currentPage = 1;
const itemsPerPage = 10;

async function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const expiryRange = document.getElementById('expiryRange').value;
    const selectedCategories = Array.from(document.getElementById('categoryFilter').selectedOptions)
        .map(option => option.value)
        .filter(value => value !== 'all');

    showLoadingState();

    try {
        const data = generateSampleData(expiryRange, selectedCategories);
        updateDashboard(data);
        updateAllCharts(data);
        updateTable(data.items);
        updateCategoryFilters(data.categories);
        hideLoadingState();
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Failed to generate report. Please try again.');
        hideLoadingState();
    }
}

function generateSampleData(expiryRange, selectedCategories) {
    const categories = selectedCategories.length > 0 ? 
        selectedCategories : 
        Object.keys(GROCERY_CATEGORIES);

    const items = [];
    const today = new Date();
    let totalValue = 0;
    
    // Generate realistic seasonal variations
    const season = getSeason(today);
    const seasonalMultiplier = getSeasonalMultiplier(season);
    
    categories.forEach(categoryKey => {
        const category = GROCERY_CATEGORIES[categoryKey];
        category.items.forEach(item => {
            // Generate varying quantities based on popularity and season
            const baseQuantity = Math.floor(Math.random() * 3) + 1;
            const seasonalQuantity = Math.round(baseQuantity * seasonalMultiplier[categoryKey]);
            
            // Add some randomness to shelf life based on storage conditions
            const shelfLifeVariation = item.storage === 'refrigerated' ? 0.9 + Math.random() * 0.2 : 0.7 + Math.random() * 0.4;
            const adjustedShelfLife = Math.round(item.shelf_life * shelfLifeVariation);
            
            // Calculate expiry with some variation
            const daysToExpiry = Math.floor(Math.random() * adjustedShelfLife) - Math.floor(adjustedShelfLife * 0.2);
            const expiryDate = new Date(today);
            expiryDate.setDate(expiryDate.getDate() + daysToExpiry);
            
            // Calculate value with seasonal pricing
            const seasonalPrice = item.price * (1 + (Math.random() * 0.4 - 0.2)); // ±20% price variation
            const quantity = seasonalQuantity;
            const itemValue = seasonalPrice * quantity;
            totalValue += itemValue;

            items.push({
                name: item.name,
                category: category.name,
                categoryIcon: category.icon,
                categoryColor: category.color,
                quantity: quantity,
                price: seasonalPrice,
                value: itemValue,
                expiryDate: expiryDate,
                daysLeft: daysToExpiry,
                status: getExpiryStatus(daysToExpiry),
                storage: item.storage,
                nutrition_score: item.nutrition_score,
                shelf_life: adjustedShelfLife,
                origin: item.origin,
                special_attributes: getSpecialAttributes(item),
                seasonal_factor: seasonalMultiplier[categoryKey]
            });
        });
    });

    const filteredItems = filterItemsByExpiryRange(items, parseInt(expiryRange));
    const insights = generatePremiumInsights(filteredItems, season);
    
    return {
        expiringSoon: items.filter(item => item.daysLeft > 0 && item.daysLeft <= 7).length,
        expired: items.filter(item => item.daysLeft <= 0).length,
        fresh: items.filter(item => item.daysLeft > 7).length,
        items: filteredItems,
        totalValue: totalValue,
        insights: insights,
        expiryTimeline: generateExpiryTimeline(items),
        categoryDistribution: generateCategoryDistribution(items),
        statusByCategory: generateStatusByCategory(items),
        weeklyTrend: generateWeeklyTrend(items),
        nutritionAnalysis: generateNutritionAnalysis(items),
        storageDistribution: generateStorageDistribution(items),
        valueAnalysis: generateValueAnalysis(items),
        seasonalAnalysis: generateSeasonalAnalysis(items, season),
        categories: categories
    };
}

function filterItemsByExpiryRange(items, days) {
    if (days === 'all') return items;
    return items.filter(item => item.daysLeft <= days);
}

function getExpiryStatus(daysLeft) {
    if (daysLeft <= 0) return 'Expired';
    if (daysLeft <= 7) return 'Expiring Soon';
    if (daysLeft <= 30) return 'Good';
    return 'Fresh';
}

function generateExpiryTimeline(items) {
    const timeline = new Array(8).fill(0); // Next 7 days + expired
    
    items.forEach(item => {
        if (item.daysLeft <= -1) {
            timeline[0]++; // Expired
        } else if (item.daysLeft <= 7) {
            timeline[item.daysLeft + 1]++; // Next 7 days
        }
    });

    return {
        labels: ['Expired', 'Today', '1 day', '2 days', '3 days', '4 days', '5 days', '6-7 days'],
        data: timeline
    };
}

function calculateRevenueForecast(items) {
    const totalValue = items.reduce((sum, item) => sum + item.quantity, 0);
    const forecastMultiplier = 1.2; // 20% growth projection
    return totalValue * forecastMultiplier;
}

function calculateOverallTrend(items, metric) {
    const trends = items.map(item => item[metric]);
    return Math.floor(trends.reduce((sum, trend) => sum + trend, 0) / trends.length);
}

function updateDashboard(data) {
    // Update Premium Insights
    updatePremiumInsights(data.insights);
    
    // Update Key Metrics
    document.getElementById('expiringSoon').textContent = data.expiringSoon;
    document.getElementById('expiredItems').textContent = data.expired;
    document.getElementById('freshItems').textContent = data.fresh;

    // Update Value Analysis
    document.getElementById('totalValue').textContent = formatCurrency(data.totalValue);
    document.getElementById('potentialSavings').textContent = formatCurrency(data.insights.wastePrevention.potential_savings);
}

function updatePremiumInsights(insights) {
    // Update Waste Prevention Score
    document.getElementById('wastePreventionScore').textContent = insights.wastePrevention.score;
    const wasteTips = document.getElementById('wastePreventionTips');
    wasteTips.innerHTML = insights.wastePrevention.recommendations.map(tip => `
        <div class="recommendation-item">
            <i class="fas fa-check-circle"></i>
            <span>${tip.tip}</span>
        </div>
    `).join('');

    // Update Freshness Index
    document.getElementById('freshnessScore').textContent = insights.freshness.score;
    const trendingItems = document.getElementById('trendingItems');
    trendingItems.innerHTML = insights.freshness.trending.map(item => `
        <div class="trending-item">
            <i class="fas fa-star"></i>
            <span>${item.name} (${item.nutrition_score})</span>
        </div>
    `).join('');

    // Update Storage Optimization
    document.getElementById('storageScore').textContent = insights.storage.score;
    const storageTips = document.getElementById('storageTips');
    storageTips.innerHTML = insights.storage.recommendations.map(tip => `
        <div class="recommendation-item">
            <i class="fas fa-box"></i>
            <span>${tip.tip}</span>
        </div>
    `).join('');

    // Add seasonal note if available
    if (insights.freshness.seasonal_note) {
        const seasonalNote = document.createElement('div');
        seasonalNote.className = 'seasonal-note';
        seasonalNote.innerHTML = `
            <i class="fas fa-calendar-alt"></i>
            <span>${insights.freshness.seasonal_note}</span>
        `;
        trendingItems.appendChild(seasonalNote);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
}

function animateNumber(elementId, finalValue, isCurrency = false) {
    const element = document.getElementById(elementId);
    const startValue = Number(element.textContent.replace(/[^0-9.-]+/g, ''));
    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = (finalValue - startValue) / steps;
    let currentStep = 0;

    const animation = setInterval(() => {
        currentStep++;
        const currentValue = startValue + (increment * currentStep);
        element.textContent = isCurrency ? formatCurrency(currentValue) : Math.round(currentValue);

        if (currentStep >= steps) {
            clearInterval(animation);
            element.textContent = isCurrency ? formatCurrency(finalValue) : finalValue;
        }
    }, duration / steps);
}

function updateTrend(elementId, trend) {
    const element = document.getElementById(elementId);
    const value = trend?.value || 0;
    const isPositive = value > 0;
    
    element.textContent = `${isPositive ? '+' : ''}${value}%`;
    element.className = `trend ${isPositive ? 'up' : 'down'}`;
}

function updateAllCharts(data) {
    const chartType = document.querySelector('.chart-controls button.active').dataset.chart;
    updateExpiryChart(data.expiryTimeline, chartType);
    updateCategoryChart(data.categoryDistribution);
    updateStatusChart(data.statusByCategory);
    updateTrendChart(data.weeklyTrend);
    updateNutritionChart(data.nutritionAnalysis);
    updateValueChart(data.valueAnalysis);
    updateStorageChart(data.storageDistribution);
    updateInsightsPanel(data.insights);
}

function updateExpiryChart(timelineData, type = 'line') {
    lastTimelineData = timelineData;
    const ctx = document.getElementById('expiryChart').getContext('2d');
    
    if (expiryChart) {
        expiryChart.destroy();
    }

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    gradientFill.addColorStop(1, 'rgba(99, 102, 241, 0)');

    expiryChart = new Chart(ctx, {
        type: type,
        data: {
            labels: timelineData.labels,
            datasets: [{
                label: 'Items',
                data: timelineData.data,
                borderColor: '#6366f1',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                backgroundColor: type === 'line' ? gradientFill : 'rgba(99, 102, 241, 0.6)',
                pointBackgroundColor: '#6366f1',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Expiry Timeline',
                    font: {
                        size: 16,
                        weight: '600'
                    },
                    padding: 20
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Items'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
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
            height: '100%'
        },
        series: data.values,
        labels: data.labels,
        colors: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'],
        plotOptions: {
            pie: {
                donut: {
                    size: '70%'
                }
            }
        },
        legend: {
            position: 'bottom'
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: '100%'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    if (categoryChart) {
        categoryChart.destroy();
    }
    categoryChart = new ApexCharts(document.querySelector("#categoryChart"), options);
    categoryChart.render();
}

function updateStatusChart(data) {
    const options = {
        chart: {
            type: 'bar',
            height: '100%',
            stacked: true,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 6
            }
        },
        series: [
            {
                name: 'Fresh',
                data: data.fresh,
                color: '#22c55e'
            },
            {
                name: 'Expiring Soon',
                data: data.expiringSoon,
                color: '#f59e0b'
            },
            {
                name: 'Expired',
                data: data.expired,
                color: '#ef4444'
            }
        ],
        xaxis: {
            categories: data.categories
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left'
        }
    };

    if (statusChart) {
        statusChart.destroy();
    }
    statusChart = new ApexCharts(document.querySelector("#statusChart"), options);
    statusChart.render();
}

function updateTrendChart(data) {
    const options = {
        chart: {
            type: 'area',
            height: '100%',
            toolbar: {
                show: false
            }
        },
        series: [{
            name: 'Items',
            data: data.values
        }],
        xaxis: {
            categories: data.labels,
            axisBorder: {
                show: false
            }
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

    if (trendChart) {
        trendChart.destroy();
    }
    trendChart = new ApexCharts(document.querySelector("#trendChart"), options);
    trendChart.render();
}

function generateCategoryDistribution(items) {
    const distribution = {};
    items.forEach(item => {
        distribution[item.category] = (distribution[item.category] || 0) + item.quantity;
    });

    return {
        labels: Object.keys(distribution),
        values: Object.values(distribution)
    };
}

function generateStatusByCategory(items) {
    const categories = [...new Set(items.map(item => item.category))];
    const fresh = [];
    const expiringSoon = [];
    const expired = [];

    categories.forEach(category => {
        const categoryItems = items.filter(item => item.category === category);
        fresh.push(categoryItems.filter(item => item.daysLeft > 7).length);
        expiringSoon.push(categoryItems.filter(item => item.daysLeft > 0 && item.daysLeft <= 7).length);
        expired.push(categoryItems.filter(item => item.daysLeft <= 0).length);
    });

    return {
        categories,
        fresh,
        expiringSoon,
        expired
    };
}

function generateWeeklyTrend(items) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const values = Array(7).fill(0);
    const today = new Date().getDay();

    items.forEach(item => {
        const dayIndex = (today + item.daysLeft) % 7;
        if (dayIndex >= 0 && dayIndex < 7) {
            values[dayIndex]++;
        }
    });

    // Rotate arrays to start from current day
    const rotatedDays = [...days.slice(today), ...days.slice(0, today)];
    const rotatedValues = [...values.slice(today), ...values.slice(0, today)];

    return {
        labels: rotatedDays,
        values: rotatedValues
    };
}

function updateTable(items) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    const tbody = document.querySelector('#expiryTable tbody');
    tbody.innerHTML = '';

    paginatedItems.forEach(item => {
        const specialAttributes = item.special_attributes.join(', ');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="item-name">
                    <span class="item-title">${item.name}</span>
                    <span class="item-origin">${item.origin}</span>
                </div>
            </td>
            <td>
                <div class="category-cell">
                    <i class="fas ${item.categoryIcon}" style="color: ${item.categoryColor}"></i>
                    ${item.category}
                </div>
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>$${item.value.toFixed(2)}</td>
            <td>${formatDate(item.expiryDate)}</td>
            <td>${formatDaysLeft(item.daysLeft)}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <button class="btn-icon" onclick="showItemDetails('${JSON.stringify(item).replace(/"/g, '&quot;')}')">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Update pagination info
    document.getElementById('itemCount').textContent = items.length;
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${Math.ceil(items.length / itemsPerPage)}`;
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
    const statusClasses = {
        'Expired': 'danger',
        'Expiring Soon': 'warning',
        'Good': 'success',
        'Fresh': 'success'
    };
    
    return `<span class="status-badge ${statusClasses[status]}">${status}</span>`;
}

// Export Functions
function exportToPDF() {
    const doc = new jsPDF();
    // Add report content to PDF
    doc.save('inventory-report.pdf');
}

function exportToCSV() {
    // Implementation for CSV export
}

function exportReport() {
    window.print();
}

// Share Modal Functions
function showShareModal() {
    document.getElementById('shareModal').style.display = 'block';
}

function hideShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

function copyShareLink() {
    const link = document.getElementById('shareLink');
    link.select();
    document.execCommand('copy');
}

// Loading State
function showLoadingState() {
    // Add loading overlay with animation
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-circle-notch fa-spin"></i>
            <span>Loading report...</span>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoadingState() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function showError(message) {
    const errorToast = document.createElement('div');
    errorToast.className = 'error-toast';
    errorToast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorToast);
    
    setTimeout(() => {
        errorToast.style.opacity = '0';
        setTimeout(() => errorToast.remove(), 300);
    }, 3000);
}

// Table Functions
function handleTableSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#expiryTable tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function handleTableSort(column) {
    const table = document.getElementById('expiryTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const sortedRows = rows.sort((a, b) => {
        const aValue = a.children[getColumnIndex(column)].textContent;
        const bValue = b.children[getColumnIndex(column)].textContent;
        
        if (column === 'daysLeft') {
            return parseInt(aValue) - parseInt(bValue);
        }
        return aValue.localeCompare(bValue);
    });
    
    tbody.innerHTML = '';
    sortedRows.forEach(row => tbody.appendChild(row));
}

function getColumnIndex(column) {
    const columns = {
        'name': 0,
        'category': 1,
        'quantity': 2,
        'expiry': 3,
        'daysLeft': 4,
        'status': 5
    };
    return columns[column];
}

function updatePagination(totalItems) {
    // Implementation for pagination
}

function viewDetails(category) {
    // Find the category data
    const categoryData = GROCERY_CATEGORIES[Object.keys(GROCERY_CATEGORIES)
        .find(key => GROCERY_CATEGORIES[key].name === category)];

    if (!categoryData) return;

    // Create and show a modal with detailed information
    const detailsHtml = `
        <div class="modal-header">
            <h3>${category} Details</h3>
            <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="details-grid">
                <div class="detail-section">
                    <h4>Available Items</h4>
                    <ul>
                        ${categoryData.items.map(item => `
                            <li>
                                <strong>${item.name}</strong>
                                <ul>
                                    ${item.varieties.map(variety => `<li>${variety}</li>`).join('')}
                                </ul>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="detail-section">
                    <h4>Storage Distribution</h4>
                    <canvas id="storageChart"></canvas>
                </div>
            </div>
        </div>
    `;

    // Show modal with details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content">${detailsHtml}</div>`;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    // Initialize storage distribution chart
    const storageCtx = modal.querySelector('#storageChart').getContext('2d');
    const storageData = getStorageDistribution(category);
    
    new Chart(storageCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(storageData),
            datasets: [{
                data: Object.values(storageData),
                backgroundColor: [
                    'rgba(67, 97, 238, 0.6)',
                    'rgba(46, 196, 182, 0.6)',
                    'rgba(255, 159, 28, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update Category Filters
function updateCategoryFilters(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = GROCERY_CATEGORIES[category].name;
        categoryFilter.appendChild(option);
    });
}

function showItemActions(name, category, expiryDate) {
    const modal = document.getElementById('itemModal');
    document.getElementById('modalItemName').textContent = name;
    document.getElementById('modalItemCategory').textContent = category;
    document.getElementById('modalItemExpiry').textContent = expiryDate;
    
    modal.style.display = 'block';
    
    // Generate item history chart
    const ctx = document.getElementById('itemHistoryChart').getContext('2d');
    const historyData = generateItemHistory();
    
    if (itemHistoryChart) {
        itemHistoryChart.destroy();
    }
    
    itemHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historyData.labels,
            datasets: [{
                label: 'Quantity',
                data: historyData.values,
                borderColor: '#6366f1',
                tension: 0.4,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Item History',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Add event listeners for modal actions
    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    document.getElementById('markRemoved').onclick = () => {
        modal.style.display = 'none';
        generateReport();
    };
    document.getElementById('updateExpiry').onclick = () => {
        modal.style.display = 'none';
        generateReport();
    };
}

function generateItemHistory() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = Array(7).fill(0).map(() => Math.floor(Math.random() * 5) + 1);
    
    return {
        labels: days,
        values: values
    };
}

function changePage(delta) {
    const items = document.querySelectorAll('#expiryTable tbody tr');
    const maxPage = Math.ceil(items.length / itemsPerPage);
    
    currentPage = Math.max(1, Math.min(currentPage + delta, maxPage));
    generateReport();
}

// Premium Analytics Functions
function generateNutritionAnalysis(items) {
    const categories = [...new Set(items.map(item => item.category))];
    const scores = categories.map(category => {
        const categoryItems = items.filter(item => item.category === category);
        const avgScore = categoryItems.reduce((sum, item) => sum + item.nutrition_score, 0) / categoryItems.length;
        return {
            category: category,
            score: Math.round(avgScore)
        };
    });

    return {
        labels: scores.map(s => s.category),
        values: scores.map(s => s.score)
    };
}

function generateStorageDistribution(items) {
    const distribution = {
        refrigerated: items.filter(i => i.storage === 'refrigerated').length,
        room_temp: items.filter(i => i.storage === 'room_temp').length
    };

    return {
        labels: ['Refrigerated', 'Room Temperature'],
        values: [distribution.refrigerated, distribution.room_temp]
    };
}

function generateValueAnalysis(items) {
    const categories = [...new Set(items.map(item => item.category))];
    return categories.map(category => {
        const categoryItems = items.filter(item => item.category === category);
        return {
            category: category,
            value: categoryItems.reduce((sum, item) => sum + item.value, 0)
        };
    });
}

function getWastePreventionTips(items) {
    const expiringSoon = items.filter(i => i.daysLeft > 0 && i.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 3);

    return expiringSoon.map(item => ({
        item: item.name,
        tip: `Use ${item.name} within ${item.daysLeft} days to prevent waste`
    }));
}

function getTrendingItems(items) {
    return items
        .filter(i => i.daysLeft > 7)
        .sort((a, b) => b.nutrition_score - a.nutrition_score)
        .slice(0, 3)
        .map(item => ({
            name: item.name,
            nutrition_score: item.nutrition_score
        }));
}

function getStorageOptimizationTips(items) {
    const improperlyStored = items
        .filter(i => i.storage === 'refrigerated' && i.daysLeft < i.shelf_life / 2)
        .slice(0, 3);

    return improperlyStored.map(item => ({
        item: item.name,
        tip: `Keep ${item.name} refrigerated to extend shelf life`
    }));
}

function calculateTotalValue(items) {
    return items.reduce((sum, item) => sum + item.value, 0);
}

function calculatePotentialSavings(items) {
    const expiringSoon = items.filter(i => i.daysLeft > 0 && i.daysLeft <= 7);
    return expiringSoon.reduce((sum, item) => sum + item.value, 0);
}

// Add these new premium chart update functions
function updateNutritionChart(data) {
    const options = {
        chart: {
            type: 'radar',
            height: '100%',
            toolbar: {
                show: false
            }
        },
        series: [{
            name: 'Nutrition Score',
            data: data.values
        }],
        labels: data.labels,
        plotOptions: {
            radar: {
                polygons: {
                    strokeColors: '#e8e8e8',
                    fill: {
                        colors: ['#f8f8f8', '#fff']
                    }
                }
            }
        },
        colors: ['#6366f1'],
        markers: {
            size: 4,
            colors: ['#fff'],
            strokeColor: '#6366f1',
            strokeWidth: 2
        }
    };

    if (premiumCharts.nutritionChart) {
        premiumCharts.nutritionChart.destroy();
    }
    premiumCharts.nutritionChart = new ApexCharts(document.querySelector("#nutritionChart"), options);
    premiumCharts.nutritionChart.render();
}

function updateValueChart(data) {
    const options = {
        chart: {
            type: 'bar',
            height: '100%',
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                distributed: true
            }
        },
        colors: data.map(d => GROCERY_CATEGORIES[d.category]?.color || '#6366f1'),
        series: [{
            name: 'Value',
            data: data.map(d => d.value)
        }],
        xaxis: {
            categories: data.map(d => d.category)
        },
        tooltip: {
            y: {
                formatter: (value) => `$${value.toFixed(2)}`
            }
        }
    };

    if (premiumCharts.valueChart) {
        premiumCharts.valueChart.destroy();
    }
    premiumCharts.valueChart = new ApexCharts(document.querySelector("#valueChart"), options);
    premiumCharts.valueChart.render();
}

// Update the main chart update function
function updateAllCharts(data) {
    const chartType = document.querySelector('.chart-controls button.active').dataset.chart;
    updateExpiryChart(data.expiryTimeline, chartType);
    updateCategoryChart(data.categoryDistribution);
    updateStatusChart(data.statusByCategory);
    updateTrendChart(data.weeklyTrend);
    updateNutritionChart(data.nutritionAnalysis);
    updateValueChart(data.valueAnalysis);
    updateStorageChart(data.storageDistribution);
    updateInsightsPanel(data.insights);
}

function getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
}

function getSeasonalMultiplier(season) {
    const baseMultipliers = {
        spring: {
            FRUITS: 1.2,
            VEGETABLES: 1.5,
            DAIRY: 1.0,
            BAKERY: 0.9,
            MEAT: 1.1
        },
        summer: {
            FRUITS: 1.8,
            VEGETABLES: 1.6,
            DAIRY: 0.8,
            BAKERY: 0.7,
            MEAT: 1.3
        },
        fall: {
            FRUITS: 1.1,
            VEGETABLES: 1.4,
            DAIRY: 1.2,
            BAKERY: 1.3,
            MEAT: 1.2
        },
        winter: {
            FRUITS: 0.8,
            VEGETABLES: 0.9,
            DAIRY: 1.4,
            BAKERY: 1.5,
            MEAT: 1.4
        }
    };

    // Add some randomness to the multipliers
    const multipliers = {};
    Object.entries(baseMultipliers[season]).forEach(([category, value]) => {
        multipliers[category] = value * (0.9 + Math.random() * 0.2); // ±10% variation
    });

    return multipliers;
}

function generatePremiumInsights(items, season) {
    const seasonalTips = {
        spring: "Peak season for fresh berries and leafy greens. Stock up on spring vegetables!",
        summer: "Excellent time for tropical fruits and heirloom tomatoes. Consider preserving excess produce.",
        fall: "Prime time for root vegetables and artisanal cheeses. Perfect for hearty meals!",
        winter: "Focus on preserved items and hearty root vegetables. Don't forget winter citrus!"
    };

    const wastePrevention = calculateWastePreventionScore(items);
    const freshness = calculateFreshnessScore(items);
    const storage = calculateStorageScore(items);
    const valueAnalysis = calculateValueAnalysis(items);

    return {
        wastePrevention: {
            score: wastePrevention.score,
            recommendations: wastePrevention.recommendations,
            potential_savings: wastePrevention.potential_savings
        },
        freshness: {
            score: freshness.score,
            trending: generateTrendingItems(items),
            seasonal_note: seasonalTips[season]
        },
        storage: {
            score: storage.score,
            recommendations: storage.recommendations,
            distribution: generateStorageDistribution(items)
        },
        value: {
            total: valueAnalysis.total,
            premium_items: valueAnalysis.premium_items,
            seasonal_opportunities: getSeasonalOpportunities(items, season)
        }
    };
}

function generateSeasonalAnalysis(items, season) {
    const seasonalItems = items.filter(item => item.seasonal_factor > 1.2);
    const seasonalValue = seasonalItems.reduce((sum, item) => sum + item.value, 0);
    
    return {
        current_season: season,
        seasonal_items: seasonalItems.length,
        seasonal_value: seasonalValue,
        top_seasonal: seasonalItems
            .sort((a, b) => b.seasonal_factor - a.seasonal_factor)
            .slice(0, 3)
            .map(item => ({
                name: item.name,
                factor: item.seasonal_factor,
                value: item.value
            }))
    };
}

function generateTrendingItems(items) {
    const trending = items
        .filter(i => i.daysLeft > 7)
        .sort((a, b) => {
            // Complex sorting based on multiple factors
            const scoreA = (a.nutrition_score * 0.4) + (a.price * 0.3) + (a.organic ? 10 : 0) + (a.artisanal ? 15 : 0);
            const scoreB = (b.nutrition_score * 0.4) + (b.price * 0.3) + (b.organic ? 10 : 0) + (b.artisanal ? 15 : 0);
            return scoreB - scoreA;
        })
        .slice(0, 3);

    return trending.map(item => ({
        name: item.name,
        nutrition_score: item.nutrition_score,
        price: item.price,
        origin: item.origin,
        special_attributes: getSpecialAttributes(item)
    }));
}

function getSpecialAttributes(item) {
    const attributes = [];
    if (item.organic) attributes.push('Organic');
    if (item.artisanal) attributes.push('Artisanal');
    if (item.wild_caught) attributes.push('Wild Caught');
    if (item.grass_fed) attributes.push('Grass Fed');
    if (item.heritage) attributes.push('Heritage');
    if (item.gluten_free) attributes.push('Gluten Free');
    if (item.vegan) attributes.push('Vegan');
    if (item.probiotic) attributes.push('Probiotic');
    return attributes;
}

function getSeasonalOpportunities(items, season) {
    const opportunities = items.filter(item => item.seasonal_factor > 1.2);
    const seasonalValue = opportunities.reduce((sum, item) => sum + item.value, 0);
    
    return {
        current_season: season,
        seasonal_opportunities: opportunities.length,
        seasonal_value: seasonalValue,
        top_seasonal: opportunities
            .sort((a, b) => b.seasonal_factor - a.seasonal_factor)
            .slice(0, 3)
            .map(item => ({
                name: item.name,
                factor: item.seasonal_factor,
                value: item.value
            }))
    };
}

function getPremiumItems(items) {
    const premiumItems = items.filter(item => item.seasonal_factor > 1.2);
    const premiumValue = premiumItems.reduce((sum, item) => sum + item.value, 0);
    
    return {
        premium_items: premiumItems.length,
        premium_value: premiumValue
    };
}

function calculateWastePreventionScore(items) {
    const expiringSoon = items.filter(i => i.daysLeft > 0 && i.daysLeft <= 7);
    const expiredValue = expiringSoon.reduce((sum, item) => sum + item.value, 0);
    
    return {
        score: Math.round((1 - (expiringSoon.length / Math.max(items.length, 1))) * 100),
        recommendations: expiringSoon
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 3)
            .map(item => ({
                item: item.name,
                tip: `Use ${item.name} within ${item.daysLeft} days to prevent waste of ${formatCurrency(item.value)}`
            })),
        potential_savings: expiredValue
    };
}

function calculateFreshnessScore(items) {
    const fresh = items.filter(i => i.daysLeft > 7);
    return {
        score: Math.round((fresh.length / Math.max(items.length, 1)) * 100),
        fresh_items: fresh.length,
        total_items: items.length
    };
}

function calculateStorageScore(items) {
    const properlyStored = items.filter(i => 
        (i.storage === 'refrigerated' && i.daysLeft > i.shelf_life / 2) ||
        (i.storage === 'room_temp' && i.daysLeft > 0)
    );

    return {
        score: Math.round((properlyStored.length / Math.max(items.length, 1)) * 100),
        recommendations: items
            .filter(i => i.storage === 'refrigerated' && i.daysLeft < i.shelf_life / 2)
            .slice(0, 3)
            .map(item => ({
                item: item.name,
                tip: `Ensure ${item.name} is properly refrigerated to maintain freshness`
            }))
    };
}

function calculateValueAnalysis(items) {
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    const premiumItems = items.filter(i => i.price > 20);
    
    return {
        total: totalValue,
        premium_items: {
            count: premiumItems.length,
            value: premiumItems.reduce((sum, item) => sum + item.value, 0)
        }
    };
}

function getSeasonalOpportunities(items, season) {
    const opportunities = items.filter(item => item.seasonal_factor > 1.2);
    const seasonalValue = opportunities.reduce((sum, item) => sum + item.value, 0);
    
    return {
        current_season: season,
        seasonal_opportunities: opportunities.length,
        seasonal_value: seasonalValue,
        top_seasonal: opportunities
            .sort((a, b) => b.seasonal_factor - a.seasonal_factor)
            .slice(0, 3)
            .map(item => ({
                name: item.name,
                factor: item.seasonal_factor,
                value: item.value
            }))
    };
} 