// Global Variables
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

// Sample responses for realistic chatbot behavior
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
        const response = generateBotResponse(message);
        hideTypingIndicator();
        addMessage('bot', response.content, response.title);
        
        // Add to suggestion history
        suggestionHistory.push({
            query: message,
            response: response.content,
            timestamp: new Date()
        });
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

// Generate bot response
function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for specific keywords
    if (lowerMessage.includes('top perform') || lowerMessage.includes('best sell') || lowerMessage.includes('popular')) {
        return botResponses['top-performers'];
    } else if (lowerMessage.includes('optim') || lowerMessage.includes('improve') || lowerMessage.includes('better')) {
        return botResponses['optimization'];
    } else if (lowerMessage.includes('strategy') || lowerMessage.includes('plan') || lowerMessage.includes('growth')) {
        return botResponses['strategy'];
    } else if (lowerMessage.includes('performance') || lowerMessage.includes('metric') || lowerMessage.includes('kpi')) {
        return botResponses['performance'];
    } else if (lowerMessage.includes('customer') || lowerMessage.includes('client') || lowerMessage.includes('shopper')) {
        return botResponses['customer'];
    } else if (lowerMessage.includes('season') || lowerMessage.includes('holiday') || lowerMessage.includes('time')) {
        return botResponses['seasonal'];
    } else {
        // Random default response
        const defaultResponses = botResponses['default'];
        const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        return {
            title: "General Business Insights",
            content: randomResponse + "\n\nSome specific areas I can help you with:\n• Performance analysis and KPI tracking\n• Customer behavior insights\n• Inventory optimization strategies\n• Seasonal planning and forecasting\n• Staff productivity improvements\n• Marketing and promotional strategies"
        };
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
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isListening = true;
            voiceIndicator.classList.add('show');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            chatInput.focus();
        };
        
        recognition.onend = function() {
            isListening = false;
            voiceIndicator.classList.remove('show');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            voiceIndicator.classList.remove('show');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
    } else {
        voiceBtn.style.display = 'none';
    }
}

// Toggle voice input
function toggleVoiceInput() {
    if (!recognition) return;
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    const chatContainer = document.querySelector('.chat-container');
    const isFullscreen = chatContainer.classList.contains('fullscreen');
    
    if (isFullscreen) {
        chatContainer.classList.remove('fullscreen');
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Fullscreen Chat';
    } else {
        chatContainer.classList.add('fullscreen');
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        fullscreenBtn.title = 'Exit Fullscreen';
    }
}

// Clear chat
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatMessages.innerHTML = '';
        chatHistory = [];
        initializeChat();
        
        // Re-add welcome message
        addMessage('bot', "Hello! I'm your GroceryTrack AI Assistant. I'm here to help you analyze your store's performance and provide actionable suggestions to improve your business. What would you like to explore today?");
    }
}

// Print chat
function printChat() {
    window.print();
}

// React to message
function reactToMessage(btn, reaction) {
    const allReactionBtns = btn.parentElement.querySelectorAll('.reaction-btn');
    allReactionBtns.forEach(b => b.classList.remove('active'));
    
    btn.classList.add('active');
    
    // You could send this feedback to your backend when implemented
    console.log('Message reaction:', reaction);
}

// Bookmark message
function bookmarkMessage(btn) {
    const messageText = btn.closest('.message-content').querySelector('.message-text').textContent;
    const timestamp = new Date().toISOString();
    
    const bookmark = {
        text: messageText.substring(0, 50) + '...',
        fullText: messageText,
        timestamp: timestamp
    };
    
    bookmarkedSuggestions.push(bookmark);
    updateBookmarkDisplay();
    
    btn.innerHTML = '<i class="fas fa-bookmark" style="color: #f39c12;"></i>';
    btn.disabled = true;
}

// Update bookmark display
function updateBookmarkDisplay() {
    const bookmarkList = document.getElementById('bookmarkList');
    
    if (bookmarkedSuggestions.length > 1) { // More than the initial demo bookmark
        bookmarkList.innerHTML = bookmarkedSuggestions.map((bookmark, index) => `
            <div class="bookmark-item">
                <span title="${bookmark.fullText}">${bookmark.text}</span>
                <button class="bookmark-btn" onclick="removeBookmark(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
}

// Remove bookmark
function removeBookmark(index) {
    bookmarkedSuggestions.splice(index, 1);
    updateBookmarkDisplay();
}

// Modal functions
function setupModalEvents() {
    // Export modal
    document.getElementById('exportBtn').addEventListener('click', () => {
        document.getElementById('exportModal').classList.add('show');
    });
    
    document.getElementById('closeExportModal').addEventListener('click', () => {
        document.getElementById('exportModal').classList.remove('show');
    });
    
    // Export buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const format = e.target.closest('.export-btn').dataset.format;
            exportChat(format);
            document.getElementById('exportModal').classList.remove('show');
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

// Show export modal
function showExportModal() {
    document.getElementById('exportModal').classList.add('show');
}

// Export chat
function exportChat(format) {
    const chatData = {
        timestamp: new Date().toISOString(),
        messages: chatHistory,
        suggestions: suggestionHistory,
        bookmarks: bookmarkedSuggestions
    };
    
    let content = '';
    let filename = `grocerytrack-chat-${new Date().toISOString().split('T')[0]}`;
    let mimeType = '';
    
    switch(format) {
        case 'json':
            content = JSON.stringify(chatData, null, 2);
            filename += '.json';
            mimeType = 'application/json';
            break;
            
        case 'txt':
            content = generateTextExport(chatData);
            filename += '.txt';
            mimeType = 'text/plain';
            break;
            
        case 'pdf':
            // For PDF, we'll generate HTML and let the browser handle PDF conversion
            content = generateHTMLExport(chatData);
            filename += '.html';
            mimeType = 'text/html';
            break;
    }
    
    downloadFile(content, filename, mimeType);
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
            .bookmarks { marginWtop: 30px; }
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
}, 30000); // Update every 30 seconds