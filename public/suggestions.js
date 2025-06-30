const backendBaseUrl = 'http://localhost:3000';

let chatHistory = [];
let suggestionHistory = [];
let bookmarkedSuggestions = [];
let isListening = false;
let recognition = null;

// Auto-suggestions data
const autoSuggestionsData = [
    "How can I improve my store's performance?",
    "Show me optimization strategies",
    "What are the best selling categories?",
    "How to increase customer satisfaction?",
    "Seasonal inventory planning tips",
    "Cost reduction strategies",
    "Staff productivity improvements",
    "Marketing suggestions for groceries",
    "Layout optimization ideas",
    "Customer retention strategies"
];

async function updateMetricCards() {
    try {
        const token = JSON.parse(localStorage.getItem('user') || '{}').token;
        const res = await fetch('http://localhost:3000/api/reports/suggestions/metrics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch metric data');

        const data = await res.json();

        // Update DOM
        document.getElementById('performanceScore').textContent = data.performanceScore + '%';
        document.getElementById('topCategories').textContent = data.topCategories;
        document.getElementById('activeSuggestions').textContent = data.activeSuggestions;
        document.getElementById('lastAnalysis').textContent = 'Just now';
    } catch (error) {
        console.error('Metric update error:', error);
    }
}

async function updateSuggestionMetrics() {
  const token = JSON.parse(localStorage.getItem('user'))?.token || '';
  try {
    const response = await fetch('http://localhost:3000/api/reports/suggestions/metrics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    document.querySelectorAll('.metric-card')[0].querySelector('.metric-value').textContent = `${data.performanceScore}%`;
    document.querySelectorAll('.metric-card')[1].querySelector('.metric-value').textContent = data.topCategories;
    document.querySelectorAll('.metric-card')[2].querySelector('.metric-value').textContent = data.activeSuggestions;
    document.querySelectorAll('.metric-card')[3].querySelector('.metric-value').textContent = formatTimeAgo(data.lastAnalysis);

  } catch (error) {
    console.error('Failed to fetch metrics:', error);
  }
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  return `${diffMin}m ago`;
}

document.addEventListener('DOMContentLoaded', updateSuggestionMetrics);


async function logSuggestion(message, type = 'custom') {
  const token = JSON.parse(localStorage.getItem('user'))?.token || '';
  await fetch('http://localhost:3000/api/suggestions/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, type })
  });
}

async function fetchReportsData() {
    try {
        const urls = [
            `${backendBaseUrl}/api/products/low-stock`,
            `${backendBaseUrl}/api/products/expiring-soon`,
            `${backendBaseUrl}/api/reports/sales-trend`,
            `${backendBaseUrl}/api/reports/sales-by-category`,
            `${backendBaseUrl}/api/reports/top-products`,
            `${backendBaseUrl}/api/reports/wastage/by-category`,
            `${backendBaseUrl}/api/reports/wastage/value`,
            `${backendBaseUrl}/api/reports/stock-turnover`,
            `${backendBaseUrl}/api/reports/stock-cost-summary`,
            `${backendBaseUrl}/api/products/stock-levels`
        ];

        const headers = { Authorization: `Bearer ${getToken()}` };

        const responses = await Promise.all(urls.map(url =>
            fetch(url, { headers })
        ));

        // Check for failed responses
        for (let i = 0; i < responses.length; i++) {
            if (!responses[i].ok) {
                console.error(`❌ API call failed: ${urls[i]} — ${responses[i].status}`);
                throw new Error(`Failed API: ${urls[i]} — Status ${responses[i].status}`);
            }
        }

        const [
            lowStock, expiringSoon, salesTrend, salesByCategory,
            topProducts, wastageByCategory, wastageValue,
            stockTurnover, stockCostSummary, stockLevels
        ] = await Promise.all(responses.map(r => r.json()));

        return {
            lowStock,
            expiringSoon,
            salesTrend,
            salesByCategory,
            topProducts,
            wastageByCategory,
            wastageValue,
            stockTurnover,
            stockCostSummary,
            stockLevels
        };
    } catch (err) {
        console.error('❌ Failed to fetch reports data:', err.message);
        return null;
    }
}

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

const botResponses = {
    'top-performers': {
        title: "Top Performing Categories Analysis",
        content: "Based on your store's performance data, here are your top performing categories:\n\n🥇 **Fresh Produce** - 23% of total revenue\n• High turnover rate with 95% customer satisfaction\n• Recommendation: Expand organic selection\n\n🥈 **Dairy Products** - 18% of total revenue\n• Consistent daily demand\n• Recommendation: Consider premium brand partnerships\n\n🥉 **Bakery Items** - 15% of total revenue\n• Peak sales during morning hours\n• Recommendation: Introduce fresh evening baking cycles\n\nWould you like detailed strategies for any specific category?"
    },
    'optimization': {
        title: "Store Optimization Recommendations",
        content: "Here are key optimization strategies for your grocery store:\n\n📊 **Layout Optimization**\n• Place high-margin items at eye level\n• Create clear pathways with strategic product placement\n• Use end-cap displays for promotional items\n\n💰 **Cost Management**\n• Implement dynamic pricing for perishables\n• Optimize inventory turnover ratios\n• Negotiate better supplier terms for bulk purchases\n\n👥 **Staff Efficiency**\n• Cross-train employees for flexibility\n• Implement task scheduling systems\n• Regular customer service training\n\nImplementing these strategies could increase profitability by 12-18%."
    },
    'strategy': {
        title: "Strategic Business Suggestions",
        content: "Strategic recommendations for long-term growth:\n\n🎯 **Customer Experience**\n• Implement loyalty program with personalized offers\n• Add self-checkout options for convenience\n• Create mobile app for online ordering\n\n📈 **Revenue Growth**\n• Expand private label products (higher margins)\n• Add complementary services (pharmacy, food court)\n• Implement seasonal promotional campaigns\n\n🔍 **Market Analysis**\n• Monitor competitor pricing weekly\n• Track customer demographic shifts\n• Analyze seasonal purchasing patterns\n\nThese strategies can drive 20-25% revenue growth over 12 months."
    },
    'performance': {
        title: "Performance Analysis Template",
        content: "Complete performance analysis for your grocery store:\n\n📊 **Key Metrics Overview**\n• Sales per square foot: Above industry average\n• Customer retention rate: 78% (Target: 85%)\n• Average transaction value: $42.50\n• Inventory turnover: 12x annually\n\n⚡ **Areas for Improvement**\n• Reduce checkout wait times\n• Improve product availability (reduce stockouts)\n• Enhance cross-selling opportunities\n\n✅ **Quick Wins**\n• Optimize staff scheduling during peak hours\n• Implement dynamic pricing for slow-moving items\n• Create targeted promotional campaigns"
    },
    'customer': {
        title: "Customer Insights Template",
        content: "Deep dive into customer behavior and preferences:\n\n👥 **Customer Demographics**\n• Primary: Families (35-50 years) - 45%\n• Secondary: Young professionals (25-35) - 30%\n• Seniors (55+) - 25%\n\n🛒 **Shopping Patterns**\n• Peak hours: 6-8 PM weekdays, 10 AM-2 PM weekends\n• Average visit frequency: 2.3 times per week\n• Basket composition: 60% essentials, 40% impulse purchases\n\n💡 **Actionable Insights**\n• Introduce express lanes for quick shopping\n• Develop senior-friendly shopping hours\n• Create family-oriented promotional bundles"
    },
    'seasonal': {
        title: "Seasonal Planning Template",
        content: "Strategic seasonal planning for optimal inventory management:\n\n🌸 **Spring Planning (Mar-May)**\n• Increase fresh produce variety\n• Easter/holiday promotional items\n• Spring cleaning products surge\n\n☀️ **Summer Strategy (Jun-Aug)**\n• BBQ and outdoor dining supplies\n• Frozen foods and beverages peak\n• Fresh fruit and ice cream focus\n\n🍂 **Fall Preparation (Sep-Nov)**\n• Back-to-school lunch items\n• Halloween seasonal products\n• Comfort food ingredients\n\n❄️ **Winter Focus (Dec-Feb)**\n• Holiday party supplies and ingredients\n• Warm beverages and comfort foods\n• New Year health-focused products"
    },
    'default': [
        "I'd be happy to help you analyze that aspect of your business. Could you provide more specific details about what you'd like to explore?",
        "That's an interesting question! Based on typical grocery store performance patterns, I can suggest several strategies. What's your primary concern?",
        "Great question! Let me provide some insights that could help improve your store's performance in that area.",
        "I understand you're looking for suggestions in this area. Here are some proven strategies that work well for grocery stores.",
        "That's definitely something worth exploring. Based on industry best practices, here are my recommendations."
    ]
};

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const autoSuggestions = document.getElementById('autoSuggestions');
const voiceBtn = document.getElementById('voiceBtn');
const voiceIndicator = document.getElementById('voiceIndicator');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const exportBtn = document.getElementById('exportBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const printChatBtn = document.getElementById('printChatBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    setupEventListeners();
    initializeSpeechRecognition();
    updateBookmarkDisplay();
    loadBookmarks();
    updateMetricCards();
});

// Initialize chat functionality
function initializeChat() {
    // Add welcome message to history
    chatHistory.push({
        type: 'bot',
        message: "Hello! I'm your GroceryTrack AI Assistant. I'm here to help you analyze your store's performance and provide actionable suggestions to improve your business. What would you like to explore today?",
        timestamp: new Date()
    });
}

// Setup all event listeners
function setupEventListeners() {
    // Chat input events
    chatInput.addEventListener('keypress', handleKeyPress);
    chatInput.addEventListener('input', handleAutoSuggestions);
    sendBtn.addEventListener('click', sendMessage);

    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });

    // Template buttons
    document.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', handleTemplateSelect);
    });

    // Header action buttons
    voiceBtn.addEventListener('click', toggleVoiceInput);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    exportBtn.addEventListener('click', showExportModal);
    clearChatBtn.addEventListener('click', clearChat);
    printChatBtn.addEventListener('click', printChat);

    // Modal events
    setupModalEvents();

    // Auto-suggestion events
    document.addEventListener('click', hideAutoSuggestions);
}

// Handle keypress events
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Handle auto-suggestions
function handleAutoSuggestions() {
    const value = chatInput.value.toLowerCase();
    
    if (value.length < 2) {
        hideAutoSuggestions();
        return;
    }

    const matches = autoSuggestionsData.filter(suggestion => 
        suggestion.toLowerCase().includes(value)
    ).slice(0, 5);

    if (matches.length > 0) {
        showAutoSuggestions(matches);
    } else {
        hideAutoSuggestions();
    }
}

// Show auto-suggestions
function showAutoSuggestions(suggestions) {
    autoSuggestions.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">${suggestion}</div>`
    ).join('');
    autoSuggestions.classList.add('show');
}

// Hide auto-suggestions
function hideAutoSuggestions() {
    autoSuggestions.classList.remove('show');
}

// Select auto-suggestion
function selectSuggestion(suggestion) {
    chatInput.value = suggestion;
    hideAutoSuggestions();
    chatInput.focus();
}

// Send message
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);
    chatInput.value = '';
    hideAutoSuggestions();

    // Show typing indicator
    showTypingIndicator();

    // Simulate bot response delay
    setTimeout(() => {
        const responseMeta = generateBotResponse(message);
if (responseMeta.type === 'live') {
    showTypingIndicator();

    fetchReportsData().then(data => {
        hideTypingIndicator();

        if (!data) {
            addMessage('bot', "❌ Sorry, I couldn't fetch live report data. Please try again later.", "Live Business Suggestion");
            return;
        }

        const suggestions = generateLiveSuggestionsByCategory(data, responseMeta.category);
        addMessage('bot', suggestions.join('<br><br>'), "📊 Live Insights: " + formatCategoryTitle(responseMeta.category));
    });
    } else {
        addMessage('bot', 
        "I'm here to help with real-time store insights. Please wait while I fetch live report data...",
        "📍 I'm Listening..."
    );

    fetchReportsData().then(data => {
        if (!data) {
            addMessage('bot', "Sorry, I couldn't fetch real-time report data. Please try again later.");
            return;
        }

        const suggestions = generateLiveSuggestions(data);
        addMessage('bot', suggestions.join('<br><br>'), "🧠 AI Suggestions from Live Report Data");
        hideTypingIndicator();
    });

    }
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
    }

// Add message to chat
function addMessage(type, content, title = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    let messageContent = content;
    if (title && type === 'bot') {
        messageContent = `<strong>${title}</strong>\n\n${content}`;
    }

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-text">${messageContent.replace(/\n/g, '<br>')}</div>
            <div class="message-time">${time}</div>
            ${type === 'bot' ? `
                <div class="message-reactions">
                    <button class="reaction-btn" onclick="reactToMessage(this, 'helpful')" title="Helpful">
                        <i class="fas fa-thumbs-up"></i>
                    </button>
                    <button class="reaction-btn" onclick="reactToMessage(this, 'not-helpful')" title="Not Helpful">
                        <i class="fas fa-thumbs-down"></i>
                    </button>
                    <button class="reaction-btn" onclick="bookmarkMessage(this)" title="Bookmark">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add to chat history
    chatHistory.push({
        type: type,
        message: content,
        title: title,
        timestamp: new Date()
    });
}

function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('top perform') || lowerMessage.includes('best sell') || lowerMessage.includes('popular')) {
        return { type: 'live', category: 'top-performers' };
    } else if (lowerMessage.includes('optim') || lowerMessage.includes('improve') || lowerMessage.includes('better')) {
        return { type: 'live', category: 'optimization' };
    } else if (lowerMessage.includes('strategy') || lowerMessage.includes('plan') || lowerMessage.includes('growth')) {
        return { type: 'live', category: 'strategy' };
    } else if (lowerMessage.includes('performance') || lowerMessage.includes('metric') || lowerMessage.includes('kpi')) {
        return { type: 'live', category: 'performance' };
    } else if (lowerMessage.includes('customer') || lowerMessage.includes('client') || lowerMessage.includes('shopper')) {
        return { type: 'live', category: 'customer' };
    } else if (lowerMessage.includes('season') || lowerMessage.includes('holiday') || lowerMessage.includes('time')) {
        return { type: 'live', category: 'seasonal' };
    } else {
        return { type: 'default' };
    }
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.classList.add('show');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.classList.remove('show');
}

// Handle quick actions
function handleQuickAction(e) {
    const action = e.target.closest('.quick-action-btn').dataset.action;
    let message = '';
    
    switch(action) {
        case 'top-performers':
            message = 'Analyze my top performing product categories';
            break;
        case 'optimization':
            message = 'Give me store optimization recommendations';
            break;
        case 'strategy':
            message = 'Provide strategic business suggestions';
            break;
    }
    
    if (message) {
        chatInput.value = message;
        sendMessage();
    }
}

// Handle template selection
function handleTemplateSelect(e) {
    const template = e.target.closest('.template-item').dataset.template;
    let message = '';
    
    switch(template) {
        case 'performance':
            message = 'Show me a complete performance analysis template';
            break;
        case 'customer':
            message = 'Provide customer insights and behavior analysis';
            break;
        case 'seasonal':
            message = 'Help me with seasonal inventory planning';
            break;
    }
    
    if (message) {
        chatInput.value = message;
        sendMessage();
    }
}

// Initialize speech recognition
function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) return;

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        voiceIndicator.style.display = 'flex';
    };

    recognition.onend = () => {
        isListening = false;
        voiceIndicator.style.display = 'none';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        sendMessage();
    };
}

function toggleVoiceInput() {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function clearChat() {
    chatMessages.innerHTML = '';
    chatHistory = [];
}

function printChat() {
    const printWindow = window.open('', '', 'width=800,height=600');
    const chatContent = chatMessages.innerHTML;
    printWindow.document.write(`
        <html>
        <head><title>Print Chat</title></head>
        <body>${chatContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// React to message
function reactToMessage(btn, reaction) {
    const allReactionBtns = btn.parentElement.querySelectorAll('.reaction-btn');
    allReactionBtns.forEach(b => b.classList.remove('active'));
    
    btn.classList.add('active');
    
    // You could send this feedback to your backend when implemented
    console.log('Message reaction:', reaction);
}

function bookmarkMessage(btn) {
    const messageDiv = btn.closest('.message');
    const text = messageDiv.querySelector('.message-text').innerText;

    bookmarkedSuggestions.push({
        text: text,
        timestamp: new Date()
    });

    updateBookmarkDisplay();
}

function updateBookmarkDisplay() {
    const list = document.getElementById('bookmarkList');
    list.innerHTML = bookmarkedSuggestions.map(item => `
        <div class="bookmark-item">
            <span>${item.text}</span>
            <button class="bookmark-btn" onclick="removeBookmark('${item.timestamp}')">
                <i class="fas fa-bookmark"></i>
            </button>
        </div>
    `).join('');
}

function removeBookmark(timestamp) {
    bookmarkedSuggestions = bookmarkedSuggestions.filter(b => b.timestamp.toString() !== timestamp);
    updateBookmarkDisplay();
}


function saveBookmarks() {
    localStorage.setItem('groceryBookmarks', JSON.stringify(bookmarkedSuggestions));
}


function loadBookmarks() {
    const saved = localStorage.getItem('groceryBookmarks');
    if (saved) {
        bookmarkedSuggestions = JSON.parse(saved);
        updateBookmarkDisplay();
    }
}


function showExportModal() {
    document.getElementById('exportModal').style.display = 'flex';
}

function setupModalEvents() {
    document.getElementById('closeExportModal').addEventListener('click', () => {
        document.getElementById('exportModal').style.display = 'none';
    });

    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            exportChat(format);
        });
    });
}

function exportChat(format) {
    const data = {
        messages: chatHistory,
        bookmarks: bookmarkedSuggestions.map(b => ({
            fullText: b.text,
            timestamp: b.timestamp
        }))
    };

    if (format === 'txt') {
        const content = generateTextExport(data);
        downloadFile(content, 'GroceryTrack_ChatExport.txt', 'text/plain');
    } else if (format === 'json') {
        const content = JSON.stringify(data, null, 2);
        downloadFile(content, 'GroceryTrack_ChatExport.json', 'application/json');
    } else if (format === 'pdf') {
        alert("PDF export isn't supported in this implementation. Try TXT or JSON instead.");
    }
    else if (format === 'html') {
        const content = generateHTMLExport(data);
        downloadFile(content, 'GroceryTrack_ChatExport.html', 'text/html');
    }
}

// Generate text export
function generateTextExport(data) {
    let text = 'GroceryTrack AI Assistant - Chat Export\n';
    text += '=' .repeat(50) + '\n';
    text += `Export Date: ${new Date().toLocaleString()}\n\n`;
    
    text += 'CHAT HISTORY:\n';
    text += '-'.repeat(20) + '\n';
    
    data.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleString();
        const speaker = msg.type === 'user' ? 'You' : 'AI Assistant';
        text += `[${time}] ${speaker}: ${msg.message}\n\n`;
    });
    
    if (data.bookmarks.length > 0) {
        text += '\nBOOKMARKED SUGGESTIONS:\n';
        text += '-'.repeat(25) + '\n';
        data.bookmarks.forEach(bookmark => {
            text += `• ${bookmark.fullText}\n\n`;
        });
    }
    
    return text;
}

// Generate HTML export
function generateHTMLExport(data) {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>GroceryTrack Chat Export</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
            .message { margin: 15px 0; padding: 10px; border-radius: 8px; }
            .user-message { background: #e3f2fd; text-align: right; }
            .bot-message { background: #f5f5f5; }
            .timestamp { font-size: 12px; color: #666; }
            .bookmarks { margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>GroceryTrack AI Assistant - Chat Export</h1>
            <p>Export Date: ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    data.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleString();
        const messageClass = msg.type === 'user' ? 'user-message' : 'bot-message';
        html += `
            <div class="message ${messageClass}">
                <div>${msg.message.replace(/\n/g, '<br>')}</div>
                <div class="timestamp">${time}</div>
            </div>
        `;
    });
    
    if (data.bookmarks.length > 0) {
        html += '<div class="bookmarks"><h2>Bookmarked Suggestions</h2>';
        data.bookmarks.forEach(bookmark => {
            html += `<p>• ${bookmark.fullText}</p>`;
        });
        html += '</div>';
    }
    
    html += '</body></html>';
    return html;
}

// Download file
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Update metrics periodically (simulate real-time updates)
setInterval(() => {
    const performanceScore = document.querySelector('.metric-value');
    if (performanceScore) {
        const currentScore = parseInt(performanceScore.textContent);
        const newScore = Math.max(75, Math.min(95, currentScore + (Math.random() - 0.5) * 2));
        performanceScore.textContent = Math.round(newScore) + '%';
    }
}, 30000);

function generateLiveSuggestions(data) {
    const suggestions = [];

    // ✅ 1. Low Stock Alerts (based on quantity)
    if (Array.isArray(data.lowStock)) {
        data.lowStock.forEach(product => {
            if (product.quantity < 10) {
                suggestions.push(`🔁 <b>Restock:</b> ${product.name} is running low on stock (only ${product.quantity} left).`);
            }
        });
    }

    // ✅ 2. Expiring Soon + Not Moving
    if (data.expiringSoon?.items?.length) {
        data.expiringSoon.items.forEach(product => {
            if (product.quantity > 0) {
                suggestions.push(`⚠️ <b>Expiring Soon:</b> ${product.name} has unsold items that will expire by ${new Date(product.expiryDate).toLocaleDateString()}.`);
            }
        });
    }

    // ✅ 3. High Wastage Value
    if (data.wastageValue?.totalLoss > 0) {
        suggestions.push(`💸 <b>Reduce Waste:</b> You've lost ₹${data.wastageValue.totalLoss} worth of goods due to expiry. Consider lowering reorder quantities.`);
    }

    // ✅ 4. Top Products (opportunity to promote)
    if (data.topProducts?.labels?.length) {
        const top = data.topProducts.labels[0];
        suggestions.push(`🏆 <b>Best Seller:</b> ${top} is your top-selling item recently. Consider featuring it in promotions.`);
    }

    // ✅ 5. Stock Turnover Check
    if (data.stockTurnover?.values?.length) {
        const latestRatio = parseFloat(data.stockTurnover.values.at(-1));
        if (latestRatio < 1) {
            suggestions.push(`📉 <b>Slow Inventory:</b> Your stock turnover ratio is below 1, which may indicate overstocking or slow sales.`);
        }
    }

    return suggestions.length
        ? suggestions
        : ["✅ No critical issues found. Store is operating efficiently!"];
}

function generateLiveSuggestionsByCategory(data, category) {
    const suggestions = [];

    switch (category) {
        case 'top-performers':
            if (data.salesByCategory?.labels?.length && data.salesByCategory?.values?.length) {
                const labels = data.salesByCategory.labels;
                const values = data.salesByCategory.values;

                const top = labels
                    .map((label, idx) => ({ category: label, value: values[idx] }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3);

                top.forEach((cat, idx) => {
                    const rankEmoji = ['🥇', '🥈', '🥉'][idx] || '';
                    suggestions.push(`${rankEmoji} <b>${cat.category}</b> - ₹${cat.value} in recent sales`);
                });
            }
            break;

        case 'optimization':
            if (data.lowStock?.length) {
                data.lowStock.forEach(p => {
                    if (p.quantity < 10) {
                        suggestions.push(`🔁 Restock <b>${p.name}</b> — only ${p.quantity} left.`);
                    }
                });
            }
            if (data.expiringSoon?.items?.length) {
                data.expiringSoon.items.forEach(p => {
                    suggestions.push(`⚠️ Reduce stock of <b>${p.name}</b> — expiring by ${new Date(p.expiryDate).toLocaleDateString()}.`);
                });
            }
            break;

        case 'strategy':
            if (data.topProducts?.labels?.length) {
                const top = data.topProducts.labels[0];
                suggestions.push(`📈 Focus on <b>${top}</b> — top-selling item. Promote it more widely.`);
            }
            if (data.wastageValue?.totalLoss > 0) {
                suggestions.push(`💸 You've lost ₹${data.wastageValue.totalLoss} to expiry. Adjust order volumes or shelf life.`);
            }
            break;

        case 'performance':
            if (data.stockTurnover?.values?.length) {
                const turnover = data.stockTurnover.values.at(-1);
                suggestions.push(`📦 Inventory turnover: ${turnover}.`);
            }
            if (data.stockCostSummary?.stockMovementRatio) {
                suggestions.push(`📊 Stock movement ratio: ${data.stockCostSummary.stockMovementRatio}`);
            }
            break;

        case 'customer':
            suggestions.push(`👥 This section is under development. You can link it to actual customer data in the next update.`);
            break;

        case 'seasonal':
            const month = new Date().getMonth();
            if (month >= 2 && month <= 4) suggestions.push("🌸 Spring Strategy: Promote fresh produce, holiday goods, and cleaning items.");
            else if (month >= 5 && month <= 7) suggestions.push("☀️ Summer Strategy: Push cold drinks, ice creams, and BBQ items.");
            else if (month >= 8 && month <= 10) suggestions.push("🍂 Fall Focus: Stock school snacks, Halloween treats, and baking ingredients.");
            else suggestions.push("❄️ Winter Focus: Promote warm foods, hot drinks, and party supplies.");
            break;
    }

    return suggestions.length
        ? suggestions
        : ["✅ Store operations look healthy in this area."];
}

function formatCategoryTitle(category) {
    const titles = {
        'top-performers': "Top Performers",
        'optimization': "Store Optimization",
        'strategy': "Growth Strategy",
        'performance': "Performance KPIs",
        'customer': "Customer Insights",
        'seasonal': "Seasonal Strategy"
    };
    return titles[category] || "Insights";
}