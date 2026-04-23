const BotanikaBot = {
    isOpen: false,
    messages: [],
    products: [],

    async init() {
        await BOTANIKA.ready();
        this.products = ProductManager.getAll();
        this.render();
        this.attachEventListeners();
        this.addWelcomeMessage();
    },
    
    render() {
        const chatbotHTML = `
            <div class="chatbot-container" id="chatbotContainer">
                <button class="chatbot-toggle" id="chatbotToggle" title="Chat with us">
                    <svg class="icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
                
                <div class="chatbot-window" id="chatbotWindow">
                    <div class="chatbot-header">
                        <div class="chatbot-header-info">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C13.5 4.5 17 7 17 11C17 15 14.5 18 12 22M12 2C10.5 4.5 7 7 7 11C7 15 9.5 18 12 22M12 2V22"/>
                            </svg>
                            <div>
                                <h3>BOTANIKA Assistant</h3>
                                <span class="status">Online</span>
                            </div>
                        </div>
                        <button class="chatbot-close" id="chatbotClose">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="chatbot-messages" id="chatbotMessages"></div>
                    
                    <div class="chatbot-input-area">
                        <input 
                            type="text" 
                            id="chatbotInput" 
                            placeholder="Ask about our plants..."
                            autocomplete="off"
                        />
                        <button id="chatbotSend">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="chatbot-quick-actions">
                        <button class="quick-action" data-action="show-all">Show all plants</button>
                        <button class="quick-action" data-action="best-sellers">Best sellers</button>
                        <button class="quick-action" data-action="low-price">Budget friendly</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    },
    
    attachEventListeners() {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const send = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');
        const container = document.getElementById('chatbotContainer');
        const quickActions = document.querySelectorAll('.quick-action');
        
        toggle.addEventListener('click', () => this.toggle());
        close.addEventListener('click', () => this.close());
        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        quickActions.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });
        
        document.addEventListener('botanika:products-updated', () => {
            this.products = ProductManager.getAll();
        });
    },
    
    toggle() {
        const container = document.getElementById('chatbotContainer');
        const chatWindow = document.getElementById('chatbotWindow');
        
        if (this.isOpen) {
            chatWindow.classList.remove('open');
            container.classList.remove('open');
        } else {
            this.products = ProductManager.getAll();
            chatWindow.classList.add('open');
            container.classList.add('open');
            document.getElementById('chatbotInput').focus();
        }
        
        this.isOpen = !this.isOpen;
    },
    
    close() {
        const container = document.getElementById('chatbotContainer');
        const chatWindow = document.getElementById('chatbotWindow');
        chatWindow.classList.remove('open');
        container.classList.remove('open');
        this.isOpen = false;
    },
    
    addWelcomeMessage() {
        const welcomeMsg = {
            type: 'bot',
            text: 'Hello. I am your BOTANIKA assistant. I can help you find the right plants, answer product questions, and share care tips. What would you like to know?'
        };
        this.addMessage(welcomeMsg);
    },
    
    addMessage(message) {
        this.messages.push(message);
        this.renderMessages();
    },
    
    renderMessages() {
        const messagesContainer = document.getElementById('chatbotMessages');
        messagesContainer.innerHTML = '';
        
        this.messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.className = `chatbot-message ${msg.type}`;
            
            if (msg.type === 'bot') {
                messageEl.innerHTML = `
                    <div class="message-avatar">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C13.5 4.5 17 7 17 11C17 15 14.5 18 12 22M12 2C10.5 4.5 7 7 7 11C7 15 9.5 18 12 22"/>
                        </svg>
                    </div>
                    <div class="message-content">${msg.text}</div>
                `;
            } else {
                messageEl.innerHTML = `<div class="message-content">${msg.text}</div>`;
            }
            
            messagesContainer.appendChild(messageEl);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    sendMessage() {
        const input = document.getElementById('chatbotInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        this.addMessage({ type: 'user', text });
        input.value = '';
        
        setTimeout(() => {
            const response = this.getResponse(text);
            this.addMessage({ type: 'bot', text: response });
        }, 500);
    },
    
    handleQuickAction(action) {
        switch(action) {
            case 'show-all':
                this.addMessage({ type: 'user', text: 'Show all plants' });
                setTimeout(() => {
                    const response = this.showAllProducts();
                    this.addMessage({ type: 'bot', text: response });
                }, 500);
                break;
            case 'best-sellers':
                this.addMessage({ type: 'user', text: 'Show best sellers' });
                setTimeout(() => {
                    const response = this.showBestSellers();
                    this.addMessage({ type: 'bot', text: response });
                }, 500);
                break;
            case 'low-price':
                this.addMessage({ type: 'user', text: 'Show budget friendly options' });
                setTimeout(() => {
                    const response = this.showBudgetFriendly();
                    this.addMessage({ type: 'bot', text: response });
                }, 500);
                break;
        }
    },
    
    getResponse(question) {
        this.products = ProductManager.getAll();
        const q = question.toLowerCase().trim();
        
        const greetings = ['hello', 'hi', 'hey', 'hola', 'howdy', 'greetings', 'good morning', 'good afternoon', 'good evening', 'whats up', "what's up", 'sup', 'yo'];
        if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + '!'))) {
            const responses = [
                'Hello. How can I help you today? Looking for a new plant for your space?',
                'Welcome to BOTANIKA. What can I help you find?',
                'Great to see you. Are you looking for indoor plants, care tips, or something else?',
                'Ready to explore our botanical collection? Ask away.'
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
        
        const thanks = ['thank', 'thanks', 'thx', 'appreciate', 'awesome', 'great', 'perfect', 'cool'];
        if (thanks.some(t => q.includes(t))) {
            return "You're welcome. Is there anything else I can help you with?";
        }
        
        const bye = ['bye', 'goodbye', 'see you', 'later', 'gotta go', 'cya'];
        if (bye.some(b => q.includes(b))) {
            return 'Goodbye. Thanks for visiting BOTANIKA. Come back soon.';
        }
        
        if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
            return this.getPriceResponse(q);
        } else if (q.includes('stock') || q.includes('available')) {
            return this.getStockResponse(q);
        } else if (q.includes('category') || q.includes('type')) {
            return this.getCategoryResponse();
        } else if (q.includes('cheap') || q.includes('budget') || q.includes('affordable')) {
            return this.showBudgetFriendly();
        } else if (q.includes('expensive') || q.includes('premium')) {
            return this.showPremiumProducts();
        } else if (q.includes('all') || q.includes('show') || q.includes('list')) {
            return this.showAllProducts();
        } else if (q.includes('help') || q.includes('what can you')) {
            return 'I can help you with:\n• Finding products by name, category, or price\n• Checking product availability and stock\n• Showing budget-friendly or premium options\n• Providing product details and recommendations\n\nJust ask me anything about our plants!';
        } else {
            return this.searchProducts(q);
        }
    },
    
    getPriceResponse(question) {
        if (this.products.length === 0) {
            return 'We currently have no products available. Please check back later!';
        }
        
        const prices = this.products.map(p => p.price);
        const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        const min = Math.min(...prices).toFixed(2);
        const max = Math.max(...prices).toFixed(2);
        
        return `Our products range from $${min} to $${max}, with an average price of $${avg}. Would you like to see products in a specific price range?`;
    },
    
    getStockResponse(question) {
        const inStock = this.products.filter(p => p.stock > 0);
        const outOfStock = this.products.filter(p => p.stock === 0);
        
        return `We currently have ${inStock.length} products in stock and ${outOfStock.length} temporarily out of stock. ${inStock.length > 0 ? 'Would you like to see what\'s available?' : ''}`;
    },
    
    getCategoryResponse() {
        const categories = [...new Set(this.products.map(p => p.category))];
        return `We have products in these categories:\n${categories.map(c => `• ${c}`).join('\n')}\n\nWhich category interests you?`;
    },
    
    showAllProducts() {
        if (this.products.length === 0) {
            return 'No products available at the moment.';
        }
        
        const list = this.products.map(p => 
            `• ${p.name} - $${p.price.toFixed(2)} (${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'})`
        ).join('\n');
        
        return `Here are all our products:\n\n${list}`;
    },
    
    showBestSellers() {
        const sorted = [...this.products].sort((a, b) => b.price - a.price).slice(0, 3);
        
        if (sorted.length === 0) {
            return 'No products available at the moment.';
        }
        
        const list = sorted.map(p => 
            `• ${p.name} - $${p.price.toFixed(2)}\n  ${p.description}`
        ).join('\n\n');
        
        return `Our top picks:\n\n${list}`;
    },
    
    showBudgetFriendly() {
        const budget = this.products.filter(p => p.price < 30).sort((a, b) => a.price - b.price);
        
        if (budget.length === 0) {
            return 'No budget-friendly options available right now.';
        }
        
        const list = budget.map(p => 
            `• ${p.name} - $${p.price.toFixed(2)} (${p.stock} in stock)`
        ).join('\n');
        
        return `Budget-friendly options under $30:\n\n${list}`;
    },
    
    showPremiumProducts() {
        const premium = this.products.filter(p => p.price >= 50).sort((a, b) => b.price - a.price);
        
        if (premium.length === 0) {
            return 'No premium products available at the moment.';
        }
        
        const list = premium.map(p => 
            `• ${p.name} - $${p.price.toFixed(2)}\n  ${p.description}`
        ).join('\n\n');
        
        return `Our premium collection:\n\n${list}`;
    },
    
    searchProducts(query) {
        const matches = this.products.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
        
        if (matches.length === 0) {
            return `I couldn't find any products matching "${query}". Try asking about:\n• Specific plant names\n• Categories like "Indoor Plants"\n• Price ranges\n• Product availability`;
        }
        
        if (matches.length === 1) {
            const p = matches[0];
            return `I found ${p.name}!\n\nPrice: $${p.price.toFixed(2)}\nCategory: ${p.category}\nStock: ${p.stock > 0 ? `${p.stock} available` : 'Out of stock'}\n\n${p.description}`;
        }
        
        const list = matches.map(p => 
            `• ${p.name} - $${p.price.toFixed(2)} (${p.category})`
        ).join('\n');
        
        return `I found ${matches.length} products:\n\n${list}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    BotanikaBot.init().catch(error => {
        console.error(error);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('shop-page') || 
        document.body.classList.contains('user-page') ||
        document.querySelector('.shop-page') ||
        document.querySelector('.user-page')) {
        setTimeout(() => BotanikaBot.init(), 500);
    }
});

window.BotanikaBot = BotanikaBot;
