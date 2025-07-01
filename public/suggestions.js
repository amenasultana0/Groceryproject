const backendBaseUrl = 'http://localhost:3000';

let chatHistory = [];
let suggestionHistory = [];
let bookmarkedSuggestions = [];
let isListening = false;
let recognition = null;

// Professional auto-suggestions data
const autoSuggestionsData = [
    "Analyze my store's performance metrics",
    "Show me customer behavior insights",
    "What are my top-performing categories?",
    "How can I optimize inventory management?",
    "Provide revenue growth strategies",
    "Analyze seasonal trends and patterns",
    "Staff efficiency and scheduling optimization",
    "Customer retention and loyalty strategies",
    "Store layout and merchandising improvements",
    "Cost reduction and profit optimization",
    "Competitive analysis and market positioning",
    "Technology integration recommendations"
];

async function updateMetricCards() {
    try {
        const token = JSON.parse(localStorage.getItem('user') || '{}').token;
        const res = await fetch(`${backendBaseUrl}/api/reports/suggestions/metrics`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!res.ok) {
            throw new Error(`API error ${res.status}: ${res.statusText}`);
        }

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
    const response = await fetch(`${backendBaseUrl}/api/reports/suggestions/metrics`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
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
  await fetch(`${backendBaseUrl}/api/suggestions/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
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
            // `${backendBaseUrl}/api/reports/stock-cost-summary`,
            `${backendBaseUrl}/api/products/stock-levels`
        ];

        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };

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
            stockTurnover, stockLevels
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
        title: "🏆 Top Performing Categories Analysis",
        content: "Based on your comprehensive performance data, here's your category analysis:\n\n🥇 **Fresh Produce** - 23% of total revenue\n• **Performance**: 95% customer satisfaction, 8.2x turnover rate\n• **Growth**: +12% vs last quarter\n• **Recommendation**: Expand organic selection by 25%\n\n🥈 **Dairy Products** - 18% of total revenue\n• **Performance**: Consistent daily demand, 6.8x turnover\n• **Growth**: +8% vs last quarter\n• **Recommendation**: Introduce premium brand partnerships\n\n🥉 **Bakery Items** - 15% of total revenue\n• **Performance**: Peak sales 6-9 AM, 95% freshness rating\n• **Growth**: +15% vs last quarter\n• **Recommendation**: Add evening baking cycles\n\n📈 **Strategic Insights**\n• Focus on high-margin organic produce expansion\n• Implement dynamic pricing for peak bakery hours\n• Consider dairy subscription services\n\nWould you like detailed implementation strategies for any category?"
    },
    'optimization': {
        title: "⚡ Store Optimization Strategies",
        content: "Comprehensive optimization framework for your grocery store:\n\n📊 **Layout & Merchandising**\n• **Eye-level placement**: Increase high-margin items visibility by 40%\n• **Pathway optimization**: Create strategic product flow patterns\n• **End-cap displays**: Rotate promotional items weekly\n• **Expected impact**: +15% impulse purchases\n\n💰 **Cost & Inventory Management**\n• **Dynamic pricing**: Implement for perishables with 3-day shelf life\n• **Turnover optimization**: Target 12x annual inventory turnover\n• **Supplier negotiations**: Bulk purchase discounts of 8-12%\n• **Expected impact**: +18% profit margins\n\n👥 **Staff & Operations**\n• **Cross-training**: Enable 80% staff flexibility across departments\n• **Smart scheduling**: AI-powered peak hour optimization\n• **Performance metrics**: Track productivity with real-time dashboards\n• **Expected impact**: +25% operational efficiency\n\n🎯 **Implementation Timeline**: 6-8 weeks for full rollout"
    },
    'strategy': {
        title: "🎯 Strategic Business Growth Plan",
        content: "Long-term strategic roadmap for sustainable growth:\n\n🎯 **Customer Experience Transformation**\n• **Loyalty Program**: Personalized offers with 85% engagement target\n• **Digital Integration**: Self-checkout + mobile app for 60% of transactions\n• **Omnichannel**: Seamless online-to-store experience\n• **Expected impact**: +30% customer retention\n\n📈 **Revenue Diversification**\n• **Private Labels**: Launch 15 new products with 35% margin\n• **Service Expansion**: Pharmacy, food court, delivery services\n• **Seasonal Campaigns**: Data-driven promotional strategies\n• **Expected impact**: +25% revenue growth\n\n🔍 **Market Intelligence**\n• **Competitive Analysis**: Weekly pricing and promotion monitoring\n• **Demographic Tracking**: Real-time customer behavior insights\n• **Trend Prediction**: AI-powered seasonal pattern analysis\n• **Expected impact**: +20% market share\n\n📊 **Success Metrics**: 20-25% revenue growth over 12 months"
    },
    'performance': {
        title: "📊 Comprehensive Performance Analysis",
        content: "Detailed performance assessment and improvement roadmap:\n\n📈 **Key Performance Indicators**\n• **Sales per square foot**: $425 (Industry avg: $380) ✅\n• **Customer retention rate**: 78% (Target: 85%) ⚠️\n• **Average transaction value**: $42.50 (Target: $45) ⚠️\n• **Inventory turnover**: 12x annually (Target: 15x) ⚠️\n• **Staff productivity**: 85% efficiency (Target: 90%) ⚠️\n\n⚡ **Critical Improvement Areas**\n• **Checkout optimization**: Reduce wait times by 40%\n• **Stock availability**: Achieve 98% product availability\n• **Cross-selling**: Increase basket size by 15%\n• **Staff training**: Implement performance-based incentives\n\n✅ **Quick Win Opportunities**\n• **Peak hour staffing**: AI-optimized scheduling\n• **Dynamic pricing**: Real-time price adjustments\n• **Targeted promotions**: Customer segment-specific campaigns\n• **Expected timeline**: 4-6 weeks implementation"
    },
    'customer': {
        title: "👥 Customer Behavior & Insights Analysis",
        content: "Deep-dive customer intelligence and behavioral patterns:\n\n👥 **Customer Demographics & Segments**\n• **Primary**: Families (35-50 years) - 45% of revenue\n• **Secondary**: Young professionals (25-35) - 30% of revenue\n• **Tertiary**: Seniors (55+) - 25% of revenue\n• **Growth segment**: Millennials showing +18% increase\n\n🛒 **Shopping Behavior Patterns**\n• **Peak hours**: 6-8 PM weekdays, 10 AM-2 PM weekends\n• **Visit frequency**: 2.3 times per week average\n• **Basket composition**: 60% essentials, 40% impulse purchases\n• **Payment preference**: 65% card, 35% cash\n\n💡 **Actionable Customer Insights**\n• **Express lanes**: Implement for 15-minute shopping trips\n• **Senior hours**: Dedicated 8-10 AM shopping times\n• **Family bundles**: Create value-oriented product packages\n• **Digital engagement**: 40% customers prefer mobile offers\n\n📊 **Customer Lifetime Value**: $2,450 average (Target: $3,000)"
    },
    'seasonal': {
        title: "📅 Strategic Seasonal Planning Framework",
        content: "Comprehensive seasonal strategy for optimal inventory and revenue management:\n\n🌸 **Spring Strategy (March-May)**\n• **Fresh produce**: 40% increase in variety and quantity\n• **Holiday items**: Easter, Mother's Day, graduation supplies\n• **Cleaning products**: 25% inventory boost for spring cleaning\n• **Revenue target**: +18% vs winter quarter\n\n☀️ **Summer Optimization (June-August)**\n• **BBQ & outdoor**: 50% increase in grilling supplies\n• **Frozen foods**: Peak demand for convenience items\n• **Beverages**: 35% increase in cold drinks and ice cream\n• **Revenue target**: +22% vs spring quarter\n\n🍂 **Fall Preparation (September-November)**\n• **Back-to-school**: Lunch supplies and snack items\n• **Halloween**: Seasonal candy and decoration inventory\n• **Comfort foods**: Warm meal ingredients and ready-to-eat\n• **Revenue target**: +15% vs summer quarter\n\n❄️ **Winter Focus (December-February)**\n• **Holiday supplies**: Party ingredients and gift items\n• **Comfort foods**: Hot beverages and warm meal components\n• **Health focus**: New Year resolution products\n• **Revenue target**: +20% vs fall quarter\n\n📊 **Inventory Planning**: AI-powered demand forecasting for each season"
    },
    'inventory': {
        title: "📦 Inventory Optimization & Management",
        content: "Advanced inventory management strategies for maximum efficiency:\n\n📊 **Current Inventory Analysis**\n• **Turnover rate**: 12x annually (Target: 15x)\n• **Stockout rate**: 8% (Target: <3%)\n• **Carrying costs**: 22% of inventory value (Target: 18%)\n• **Waste percentage**: 5% (Target: <3%)\n\n⚡ **Optimization Strategies**\n• **Just-in-time ordering**: Reduce lead times by 40%\n• **ABC analysis**: Focus on high-value, high-turnover items\n• **Safety stock optimization**: AI-powered demand forecasting\n• **Supplier partnerships**: Negotiate better terms and delivery schedules\n\n🎯 **Technology Integration**\n• **RFID tracking**: Real-time inventory visibility\n• **Predictive analytics**: Forecast demand with 95% accuracy\n• **Automated reordering**: Reduce manual intervention by 70%\n• **Mobile inventory management**: Staff efficiency improvement\n\n📈 **Expected Outcomes**\n• **Reduced waste**: 60% decrease in expired products\n• **Improved availability**: 98% product availability rate\n• **Cost savings**: 15% reduction in carrying costs\n• **Revenue increase**: +12% through better stock management"
    },
    'default': [
        "I'd be happy to provide a comprehensive analysis of that aspect of your business. Could you share more specific details about what you'd like to explore?",
        "Excellent question! Based on industry best practices and your store's data patterns, I can offer several strategic insights. What's your primary business objective?",
        "Great inquiry! Let me provide you with data-driven insights that could significantly improve your store's performance in that area.",
        "I understand you're seeking strategic guidance in this area. Here are some proven methodologies that work exceptionally well for modern grocery operations.",
        "That's a strategic area worth exploring. Based on current market trends and operational best practices, here are my recommendations."
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
    document.getElementById('exportBtn').addEventListener('click', exportReport);
});

function exportReport() {
  window.print();
}

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
        case 'inventory':
            message = 'Help me optimize my inventory.';
            break;
        default:
            message = '';
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