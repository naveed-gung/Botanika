const BotanikaBot = {
    isOpen: false,
    messages: [],
    products: [],
    isRendered: false,
    dataReady: false,
    lastAdminIntent: null,

    async init() {
        if (!this.isRendered) {
            this.render();
            this.attachEventListeners();
            this.addWelcomeMessage();
            this.isRendered = true;
        }

        try {
            await BOTANIKA.ready();
            this.products = ProductManager.getAll();
            this.dataReady = true;
            this.updateStatus('Online');
            this.updateQuickActions();
            this.updateInputPlaceholder();
        } catch (error) {
            console.error(error);
            this.dataReady = false;
            this.updateStatus('Limited');
            this.addMessage({
                type: 'bot',
                text: 'The chat UI is available, but live catalog data is blocked until Firestore rules allow product reads.'
            });
        }
    },
    
    render() {
        if (document.getElementById('chatbotContainer')) {
            return;
        }

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
                    
                    <div class="chatbot-quick-actions" id="chatbotQuickActions"></div>
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
        
        toggle.addEventListener('click', () => this.toggle());
        close.addEventListener('click', () => this.close());
        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        document.addEventListener('click', event => {
            const quickAction = event.target.closest('.quick-action');

            if (!quickAction || !quickAction.closest('#chatbotQuickActions')) {
                return;
            }

            this.handleQuickAction(quickAction.getAttribute('data-action'));
        });
        
        document.addEventListener('botanika:products-updated', () => {
            this.products = ProductManager.getAll();
            if (this.products.length) {
                this.dataReady = true;
                this.updateStatus('Online');
            }
        });

        document.addEventListener('botanika:users-updated', () => {
            this.updateQuickActions();
        });

        document.addEventListener('botanika:orders-updated', () => {
            this.updateQuickActions();
        });

        document.addEventListener('botanika:user-changed', () => {
            this.updateQuickActions();
            this.updateInputPlaceholder();
        });
    },

    isAdminMode() {
        return Boolean(UserManager.getCurrentUser() && UserManager.getCurrentUser().isAdmin);
    },

    updateInputPlaceholder() {
        const input = document.getElementById('chatbotInput');

        if (!input) {
            return;
        }

        input.placeholder = this.isAdminMode()
            ? 'Ask about inventory, customers, or orders...'
            : 'Ask about our plants...';
    },

    updateQuickActions() {
        const container = document.getElementById('chatbotQuickActions');

        if (!container) {
            return;
        }

        const actions = this.isAdminMode()
            ? [
                { action: 'inventory-overview', label: 'Inventory overview' },
                { action: 'top-products', label: 'Most bought' },
                { action: 'inactive-users', label: 'Inactive users' }
            ]
            : [
                { action: 'show-all', label: 'Show all plants' },
                { action: 'best-sellers', label: 'Best sellers' },
                { action: 'low-price', label: 'Budget friendly' }
            ];

        container.innerHTML = actions.map(item => (
            `<button class="quick-action" data-action="${item.action}">${item.label}</button>`
        )).join('');
    },

    updateStatus(label) {
        const status = document.querySelector('#chatbotWindow .status');
        if (status) {
            status.textContent = label;
        }
    },
    
    toggle() {
        const container = document.getElementById('chatbotContainer');
        const chatWindow = document.getElementById('chatbotWindow');

        if (!container || !chatWindow) {
            return;
        }
        
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
            case 'inventory-overview':
                this.addMessage({ type: 'user', text: 'Give me the inventory overview' });
                setTimeout(() => {
                    this.addMessage({ type: 'bot', text: this.getInventoryOverview() });
                }, 500);
                break;
            case 'top-products':
                this.addMessage({ type: 'user', text: 'Which products are bought the most?' });
                setTimeout(() => {
                    this.addMessage({ type: 'bot', text: this.getTopProductsReport() });
                }, 500);
                break;
            case 'inactive-users':
                this.addMessage({ type: 'user', text: 'Which users have not bought for a long time?' });
                setTimeout(() => {
                    this.addMessage({ type: 'bot', text: this.getInactiveUsersReport() });
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

        if (this.isAdminMode()) {
            if ((q.includes('who ordered') || q.includes('names of the clients') || q.includes('clients that ordered') || q.includes('customers that ordered') || q.includes('who bought') || ((q.includes('name') || q.includes('names')) && (q.includes('ordered') || q.includes('bought') || q.includes('purchase')))) || (this.lastAdminIntent === 'customer-summary' && (q.includes('name') || q.includes('names')) && (q.includes('ordered') || q.includes('bought') || q.includes('purchase') || q.includes('who')))) {
                this.lastAdminIntent = 'ordered-customers';
                return this.getCustomersWithOrdersReport();
            }

            if (q.includes('inventory value') || q.includes('inventory overview') || q.includes('stock summary') || q.includes('total inventory')) {
                this.lastAdminIntent = 'inventory';
                return this.getInventoryOverview();
            }

            if (q.includes('most bought') || q.includes('top product') || q.includes('best selling') || q.includes('bought the most')) {
                this.lastAdminIntent = 'top-products';
                return this.getTopProductsReport();
            }

            if (q.includes('inactive user') || q.includes('didn') || q.includes('long time') || q.includes('no order') || q.includes('no purchase')) {
                this.lastAdminIntent = 'inactive-users';
                return this.getInactiveUsersReport();
            }

            if (q.includes('customer') || q.includes('client') || q.includes('users')) {
                this.lastAdminIntent = 'customer-summary';
                return this.getCustomerSummary();
            }
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
            return this.dataReady
                ? 'We currently have no products available. Please check back later.'
                : 'I am ready to chat, but product data is still unavailable until Firestore product reads are allowed.';
        }
        
        const prices = this.products.map(p => p.price);
        const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        const min = Math.min(...prices).toFixed(2);
        const max = Math.max(...prices).toFixed(2);
        
        return `Our products range from $${min} to $${max}, with an average price of $${avg}. Would you like to see products in a specific price range?`;
    },
    
    getStockResponse(question) {
        const matchedProduct = this.products.find(product => question.includes(product.name.toLowerCase()));

        if (matchedProduct) {
            return `${matchedProduct.name} currently has ${matchedProduct.stock} unit${matchedProduct.stock === 1 ? '' : 's'} in stock.`;
        }

        const inStock = this.products.filter(p => p.stock > 0);
        const outOfStock = this.products.filter(p => p.stock === 0);
        
        return `We currently have ${inStock.length} products in stock and ${outOfStock.length} temporarily out of stock. ${inStock.length > 0 ? 'Would you like to see what\'s available?' : ''}`;
    },

    getInventoryOverview() {
        const snapshot = BotanikaInsights.getSnapshot();

        if (!snapshot.products.length) {
            return 'No catalog data is available yet. Seed products first or check Firestore product reads.';
        }

        return [
            `Inventory value: ${formatPrice(snapshot.inventoryValue)}`,
            `Total products: ${snapshot.products.length}`,
            `Total stock units: ${snapshot.totalStockUnits}`,
            `Registered clients: ${snapshot.users.length}`,
            `Orders tracked: ${snapshot.orders.length}`,
            `Low stock items: ${snapshot.lowStock.length}`,
            `Out of stock items: ${snapshot.outOfStock.length}`
        ].join('\n');
    },

    getTopProductsReport() {
        const snapshot = BotanikaInsights.getSnapshot();
        const topProducts = snapshot.topProducts.slice(0, 3);

        if (!topProducts.length) {
            return 'No order history is available yet, so there is no most-bought product report.';
        }

        return `Most bought products:\n\n${topProducts.map((product, index) => `${index + 1}. ${product.name} - ${product.quantity} unit${product.quantity === 1 ? '' : 's'} sold`).join('\n')}`;
    },

    getInactiveUsersReport() {
        const snapshot = BotanikaInsights.getSnapshot();
        const dormantUsers = snapshot.dormantUsers.slice(0, 4);

        if (!dormantUsers.length) {
            return 'Every customer has placed a recent order in the last 45 days.';
        }

        return `Customers needing attention:\n\n${dormantUsers.map(user => {
            if (user.hasNeverOrdered) {
                return `• ${user.name} has not placed a first order yet.`;
            }

            return `• ${user.name} last ordered ${user.inactiveDays} days ago.`;
        }).join('\n')}`;
    },

    getCustomerSummary() {
        const snapshot = BotanikaInsights.getSnapshot();
        const customersWithOrders = this.getCustomersWithOrders(snapshot);
        const customersWithoutOrders = snapshot.dormantUsers.filter(user => user.hasNeverOrdered);

        if (!snapshot.users.length) {
            return 'No client profiles are available yet.';
        }

        return [
            `Registered clients: ${snapshot.users.length}`,
            `Clients with at least one order: ${snapshot.activeCustomers}`,
            `Clients with no order yet: ${customersWithoutOrders.length}`,
            customersWithOrders.length
                ? `Ordered clients: ${customersWithOrders.map(user => user.name).join(', ')}`
                : 'Ordered clients: none yet'
        ].join('\n');
    },

    getCustomersWithOrders(snapshot = BotanikaInsights.getSnapshot()) {
        return snapshot.users
            .map(user => {
                const userOrders = snapshot.orders.filter(order => order.userId === user.id || order.customerEmail === user.email);
                const lastOrder = userOrders
                    .slice()
                    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))[0] || null;

                return {
                    ...user,
                    orderCount: userOrders.length,
                    lastOrder
                };
            })
            .filter(user => user.orderCount > 0)
            .sort((left, right) => right.orderCount - left.orderCount || left.name.localeCompare(right.name));
    },

    getCustomersWithOrdersReport() {
        const snapshot = BotanikaInsights.getSnapshot();
        const customersWithOrders = this.getCustomersWithOrders(snapshot);

        if (!customersWithOrders.length) {
            return 'No clients have placed an order yet.';
        }

        return `Clients who already ordered:\n\n${customersWithOrders.map(user => {
            const lastOrderDate = user.lastOrder?.createdAt
                ? new Date(user.lastOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'unknown date';

            return `• ${user.name} - ${user.orderCount} order${user.orderCount === 1 ? '' : 's'} (last order ${lastOrderDate})`;
        }).join('\n')}`;
    },
    
    getCategoryResponse() {
        const categories = [...new Set(this.products.map(p => p.category))];
        return `We have products in these categories:\n${categories.map(c => `• ${c}`).join('\n')}\n\nWhich category interests you?`;
    },
    
    showAllProducts() {
        if (this.products.length === 0) {
            return this.dataReady
                ? 'No products available at the moment.'
                : 'Product data is currently blocked by Firestore rules, so I cannot list the catalog yet.';
        }
        
        const list = this.products.map(p => 
            `• ${p.name} - $${p.price.toFixed(2)} (${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'})`
        ).join('\n');
        
        return `Here are all our products:\n\n${list}`;
    },
    
    showBestSellers() {
        const sorted = [...this.products].sort((a, b) => b.price - a.price).slice(0, 3);
        
        if (sorted.length === 0) {
            return this.dataReady
                ? 'No products available at the moment.'
                : 'I cannot rank best sellers until product reads are available in Firestore.';
        }
        
        const list = sorted.map(p => 
            `• ${p.name} - $${p.price.toFixed(2)}\n  ${p.description}`
        ).join('\n\n');
        
        return `Our top picks:\n\n${list}`;
    },
    
    showBudgetFriendly() {
        const budget = this.products.filter(p => p.price < 30).sort((a, b) => a.price - b.price);
        
        if (budget.length === 0) {
            return this.dataReady
                ? 'No budget-friendly options available right now.'
                : 'Budget recommendations need product reads from Firestore, which are currently blocked.';
        }
        
        const list = budget.map(p => 
            `• ${p.name} - $${p.price.toFixed(2)} (${p.stock} in stock)`
        ).join('\n');
        
        return `Budget-friendly options under $30:\n\n${list}`;
    },
    
    showPremiumProducts() {
        const premium = this.products.filter(p => p.price >= 50).sort((a, b) => b.price - a.price);
        
        if (premium.length === 0) {
            return this.dataReady
                ? 'No premium products available at the moment.'
                : 'Premium recommendations need product reads from Firestore, which are currently blocked.';
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
            return this.dataReady
                ? `I couldn't find any products matching "${query}". Try asking about:\n• Specific plant names\n• Categories like "Indoor Plants"\n• Price ranges\n• Product availability`
                : 'I can still answer general questions, but product search is blocked until Firestore product reads are enabled.';
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

window.BotanikaBot = BotanikaBot;
