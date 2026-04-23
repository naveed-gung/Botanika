document.addEventListener('DOMContentLoaded', async () => {
    
    
    const salesData = {
        'prod_001': { sold: 234, views: 1520, rating: 4.8, reviews: 89 },
        'prod_002': { sold: 156, views: 980, rating: 4.6, reviews: 52 },
        'prod_003': { sold: 312, views: 2100, rating: 4.9, reviews: 127 },
        'prod_004': { sold: 89, views: 650, rating: 4.5, reviews: 34 },
        'prod_005': { sold: 198, views: 1340, rating: 4.7, reviews: 76 },
        'prod_006': { sold: 145, views: 890, rating: 4.4, reviews: 45 }
    };
    
    function getProductSalesData(productId) {
        return salesData[productId] || {
            sold: Math.floor(Math.random() * 200) + 20,
            views: Math.floor(Math.random() * 1000) + 100,
            rating: (Math.random() * 1 + 4).toFixed(1),
            reviews: Math.floor(Math.random() * 50) + 10
        };
    }
    
    function getSalesBadge(productId, stock) {
        const data = getProductSalesData(productId);
        
        if (data.sold > 250) {
            return `<span class="sales-badge bestseller">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Best Seller
            </span>`;
        } else if (data.sold > 150) {
            return `<span class="sales-badge popular">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                Most Popular
            </span>`;
        } else if (data.views > 1000) {
            return `<span class="sales-badge trending">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
                Trending
            </span>`;
        } else if (stock > 15) {
            return `<span class="sales-badge new">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                New Arrival
            </span>`;
        }
        return '';
    }
    
    
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    const cartBtn = document.getElementById('cartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartClose = document.getElementById('cartClose');
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    const authLink = document.getElementById('authLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const userBadge = document.getElementById('userBadge');
    const userName = document.getElementById('userName');
    
    
    
    
    
    try {
        await BOTANIKA.ready();
    } catch (error) {
        console.error(error);
        Toast.error('Firebase failed to start. Check your local config.');
        return;
    }

    initUserUI();
    loadProducts();
    updateCartUI();
    
    
    
    
    
    function initUserUI() {
        const user = UserManager.getCurrentUser();
        
        if (user) {
            
            if (authLink) authLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'flex';
            if (userBadge) {
                userBadge.style.display = 'flex';
                if (userName) userName.textContent = user.name;
                
                
                userBadge.href = user.isAdmin ? 'admin.html' : 'user.html';
            }
            
            
            if (user.isAdmin && cartBtn) {
                cartBtn.style.display = 'none';
            }
        } else {
            
            if (authLink) authLink.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userBadge) userBadge.style.display = 'none';
        }
    }
    
    
    
    
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await UserManager.logout();
            Toast.success('You have been logged out');
            setTimeout(() => {
                PageTransition.navigate('index.html');
            }, 1000);
        });
    }
    
    
    
    
    
    function loadProducts() {
        const products = ProductManager.getAll();
        
        if (products.length === 0) {
            if (productGrid) productGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        
        if (productGrid) productGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        
        renderProducts(products);
    }
    
    function renderProducts(products) {
        if (!productGrid) return;
        
        const user = UserManager.getCurrentUser();
        const isAdmin = user && user.isAdmin;
        
        productGrid.innerHTML = products.map(product => {
            const stockBadge = getStockBadge(product.stock);
            const salesBadge = getSalesBadge(product.id, product.stock);
            const isOutOfStock = product.stock < 1;
            
            return `
                <article class="product-card" data-product-id="${product.id}">
                    <div class="product-image">
                        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" 
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23E6DFD3%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238A9A5B%22 font-size=%2214%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                        ${salesBadge}
                        ${stockBadge}
                    </div>
                    <div class="product-info">
                        <span class="product-category">${escapeHtml(product.category)}</span>
                        <h3 class="product-name">${escapeHtml(product.name)}</h3>
                        <p class="product-description">${escapeHtml(product.description)}</p>
                        <div class="product-footer">
                            <span class="product-price">${formatPrice(product.price)}</span>
                            ${user ? `
                                <button class="add-to-cart-btn" 
                                        data-product-id="${product.id}"
                                        ${isOutOfStock ? 'disabled' : ''}
                                        aria-label="${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <path d="M12 5v14M5 12h14"/>
                                    </svg>
                                </button>
                            ` : `
                                <span class="login-prompt">
                                    <a href="auth.html#login">Sign in</a> to buy
                                </span>
                            `}
                        </div>
                    </div>
                </article>
            `;
        }).join('');
        
        
        attachCartButtonListeners();
        attachCardClickListeners();
    }
    
    function getStockBadge(stock) {
        if (stock < 1) {
            return '<span class="stock-badge out">Out of Stock</span>';
        } else if (stock <= 5) {
            return `<span class="stock-badge low">Only ${stock} left</span>`;
        }
        return '';
    }
    
    
    
    
    
    function attachCartButtonListeners() {
        const addButtons = document.querySelectorAll('.add-to-cart-btn');
        
        addButtons.forEach(btn => {
            btn.addEventListener('click', handleAddToCart);
        });
    }
    
    async function handleAddToCart(e) {
        const btn = e.currentTarget;
        const productId = btn.dataset.productId;
        const productCard = btn.closest('.product-card');
        const productImage = productCard.querySelector('.product-image img');
        
        
        const result = await CartManager.addItem(productId, 1);
        
        if (result.success) {
            
            btn.classList.add('added');
            btn.querySelector('svg').innerHTML = '<path d="M20 6L9 17l-5-5"/>';
            
            
            if (productImage) {
                FlyingProduct.animate(productCard, productImage.src);
            }
            
            
            updateCartCount();
            
            
            setTimeout(() => {
                btn.classList.remove('added');
                btn.querySelector('svg').innerHTML = '<path d="M12 5v14M5 12h14"/>';
            }, 1500);
            
            Toast.success('Added to cart');
        } else {
            Toast.error(result.message);
        }
    }
    
    
    
    
    
    
    if (cartBtn) {
        cartBtn.addEventListener('click', openCart);
    }
    
    
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }
    
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartDrawer?.classList.contains('active')) {
            closeCart();
        }
    });
    
    function openCart() {
        if (cartOverlay) cartOverlay.classList.add('active');
        if (cartDrawer) {
            cartDrawer.classList.add('active');
            updateCartUI();
        }
        document.body.style.overflow = 'hidden';
    }
    
    function closeCart() {
        if (cartOverlay) cartOverlay.classList.remove('active');
        if (cartDrawer) cartDrawer.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    
    
    
    
    function updateCartUI() {
        const cart = CartManager.getCart();
        
        if (cart.length === 0) {
            if (cartItems) cartItems.style.display = 'none';
            if (cartEmpty) cartEmpty.style.display = 'flex';
            if (cartFooter) cartFooter.style.display = 'none';
        } else {
            if (cartItems) cartItems.style.display = 'block';
            if (cartEmpty) cartEmpty.style.display = 'none';
            if (cartFooter) cartFooter.style.display = 'block';
            
            renderCartItems(cart);
            updateCartTotal();
        }
        
        updateCartCount();
    }
    
    function renderCartItems(cart) {
        if (!cartItems) return;
        
        cartItems.innerHTML = cart.map(item => {
            const product = ProductManager.getById(item.productId);
            if (!product) return '';
            
            return `
                <div class="cart-item" data-product-id="${item.productId}">
                    <div class="cart-item-image">
                        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23E6DFD3%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
                    </div>
                    <div class="cart-item-details">
                        <span class="cart-item-name">${escapeHtml(product.name)}</span>
                        <span class="cart-item-price">${formatPrice(product.price)}</span>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button class="quantity-btn decrease" data-product-id="${item.productId}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M5 12h14"/>
                                    </svg>
                                </button>
                                <span class="quantity-value">${item.quantity}</span>
                                <button class="quantity-btn increase" data-product-id="${item.productId}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 5v14M5 12h14"/>
                                    </svg>
                                </button>
                            </div>
                            <button class="remove-btn" data-product-id="${item.productId}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        
        attachCartItemListeners();
    }
    
    function attachCartItemListeners() {
        
        document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                const cart = CartManager.getCart();
                const item = cart.find(i => i.productId === productId);
                
                if (item) {
                    updateQuantityWithAnimation(productId, item.quantity - 1);
                }
            });
        });
        
        
        document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                const cart = CartManager.getCart();
                const item = cart.find(i => i.productId === productId);
                
                if (item) {
                    updateQuantityWithAnimation(productId, item.quantity + 1);
                }
            });
        });
        
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                removeItemWithAnimation(productId);
            });
        });
    }
    
    function updateQuantityWithAnimation(productId, newQuantity) {
        const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        const quantityValue = cartItem?.querySelector('.quantity-value');
        
        if (quantityValue) {
            quantityValue.classList.add('updating');
            
            setTimeout(async () => {
                if (newQuantity < 1) {
                    removeItemWithAnimation(productId);
                } else {
                    const result = await CartManager.updateQuantity(productId, newQuantity);
                    
                    if (result.success) {
                        quantityValue.textContent = newQuantity;
                        quantityValue.classList.remove('updating');
                        updateCartTotal();
                        updateCartCount();
                    } else {
                        quantityValue.classList.remove('updating');
                        Toast.error(result.message);
                    }
                }
            }, 150);
        }
    }
    
    function removeItemWithAnimation(productId) {
        const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        
        if (cartItem) {
            cartItem.classList.add('removing');
            
            setTimeout(async () => {
                await CartManager.removeItem(productId);
                updateCartUI();
            }, 300);
        }
    }
    
    function updateCartTotal() {
        const total = CartManager.getTotal();
        if (cartTotal) {
            cartTotal.textContent = formatPrice(total);
        }
    }
    
    function updateCartCount() {
        const count = CartManager.getCount();
        
        if (cartCount) {
            cartCount.textContent = count;
            
            if (count > 0) {
                cartCount.classList.add('visible');
            } else {
                cartCount.classList.remove('visible');
            }
        }
    }
    
    
    
    
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const user = UserManager.getCurrentUser();

            if (!user) {
                Toast.error('Please sign in to continue');
                setTimeout(() => {
                    PageTransition.navigate('auth.html#login');
                }, 800);
                return;
            }

            if (user.isAdmin) {
                Toast.error('Admin accounts cannot place customer orders');
                return;
            }

            if (CartManager.getCart().length === 0) {
                Toast.error('Your cart is empty');
                return;
            }

            closeCart();
            PageTransition.navigate('user.html#checkout');
        });
    }

    document.addEventListener('botanika:carts-updated', updateCartUI);
    document.addEventListener('botanika:products-updated', loadProducts);
    document.addEventListener('botanika:user-changed', () => {
        initUserUI();
        updateCartUI();
    });
    
    
    
    
    
    document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.product-card');
        
        if (card) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / centerY * -3;
            const rotateY = (x - centerX) / centerX * 3;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        }
    });
    
    document.addEventListener('mouseleave', (e) => {
        if (e.target.classList?.contains('product-card')) {
            e.target.style.transform = '';
        }
    }, true);
    
    
    if (productGrid) {
        productGrid.addEventListener('mouseleave', () => {
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.transform = '';
            });
        });
    }
    
    
    
    
    
    const productModalOverlay = document.getElementById('productModalOverlay');
    const productModal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const modalProductImage = document.getElementById('modalProductImage');
    const modalBadges = document.getElementById('modalBadges');
    const modalCategory = document.getElementById('modalCategory');
    const modalTitle = document.getElementById('modalTitle');
    const modalRating = document.getElementById('modalRating');
    const modalDescription = document.getElementById('modalDescription');
    const modalStats = document.getElementById('modalStats');
    const modalSoldCount = document.getElementById('modalSoldCount');
    const modalViews = document.getElementById('modalViews');
    const modalPrice = document.getElementById('modalPrice');
    const modalStock = document.getElementById('modalStock');
    const qtyInput = document.getElementById('qtyInput');
    const qtyDecrease = document.getElementById('qtyDecrease');
    const qtyIncrease = document.getElementById('qtyIncrease');
    const modalAddToCart = document.getElementById('modalAddToCart');
    const modalBuyNow = document.getElementById('modalBuyNow');
    const relatedGrid = document.getElementById('relatedGrid');
    
    let currentModalProductId = null;
    
    function attachCardClickListeners() {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                
                if (e.target.closest('.add-to-cart-btn') || e.target.closest('.login-prompt')) {
                    return;
                }
                const productId = card.dataset.productId;
                openProductModal(productId);
            });
        });
    }
    
    function openProductModal(productId) {
        const product = ProductManager.getById(productId);
        if (!product) return;
        
        currentModalProductId = productId;
        const user = UserManager.getCurrentUser();
        const salesInfo = getProductSalesData(productId);
        const isOutOfStock = product.stock < 1;
        
        
        if (modalProductImage) {
            modalProductImage.src = product.image;
            modalProductImage.alt = product.name;
            modalProductImage.onerror = function() {
                this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23E6DFD3' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%238A9A5B' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
            };
        }
        
        
        if (modalBadges) {
            const salesBadge = getSalesBadge(productId, product.stock);
            const stockBadge = getStockBadge(product.stock);
            modalBadges.innerHTML = salesBadge + stockBadge;
        }
        
        
        if (modalCategory) modalCategory.textContent = product.category;
        if (modalTitle) modalTitle.textContent = product.name;
        if (modalDescription) modalDescription.textContent = product.description;
        
        
        if (modalRating) {
            const stars = modalRating.querySelector('.stars');
            const ratingCount = modalRating.querySelector('.rating-count');
            if (stars) {
                const rating = parseFloat(salesInfo.rating);
                let starsHTML = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= rating) {
                        starsHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                    } else if (i - 0.5 <= rating) {
                        starsHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                    } else {
                        starsHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                    }
                }
                stars.innerHTML = starsHTML;
            }
            if (ratingCount) ratingCount.textContent = `${salesInfo.rating} (${salesInfo.reviews} reviews)`;
        }
        
        
        if (modalSoldCount) modalSoldCount.textContent = `${salesInfo.sold} sold`;
        if (modalViews) modalViews.textContent = `${salesInfo.views} views`;
        
        
        if (modalPrice) modalPrice.textContent = formatPrice(product.price);
        
        
        if (modalStock) {
            if (isOutOfStock) {
                modalStock.textContent = 'Out of Stock';
                modalStock.className = 'modal-stock out';
            } else if (product.stock <= 5) {
                modalStock.textContent = `Only ${product.stock} left`;
                modalStock.className = 'modal-stock low';
            } else {
                modalStock.textContent = `${product.stock} in stock`;
                modalStock.className = 'modal-stock';
            }
        }
        
        
        if (qtyInput) qtyInput.value = 1;
        
        
        if (modalAddToCart) {
            modalAddToCart.disabled = !user || isOutOfStock;
            if (!user) {
                modalAddToCart.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Sign in to Add</span>
                `;
            } else {
                modalAddToCart.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 6h15l-1.5 9h-12z"/>
                        <circle cx="9" cy="20" r="1"/>
                        <circle cx="18" cy="20" r="1"/>
                    </svg>
                    <span>Add to Cart</span>
                `;
            }
        }
        
        if (modalBuyNow) {
            modalBuyNow.disabled = !user || isOutOfStock;
            if (!user) {
                modalBuyNow.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    <span>Sign in to Buy</span>
                `;
            } else {
                modalBuyNow.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <span>Buy Now</span>
                `;
            }
        }
        
        
        loadRelatedProducts(product);
        
        
        if (productModalOverlay) productModalOverlay.classList.add('active');
        if (productModal) productModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeProductModal() {
        if (productModalOverlay) productModalOverlay.classList.remove('active');
        if (productModal) productModal.classList.remove('active');
        document.body.style.overflow = '';
        currentModalProductId = null;
    }
    
    function loadRelatedProducts(currentProduct) {
        if (!relatedGrid) return;
        
        const allProducts = ProductManager.getAll();
        const related = allProducts
            .filter(p => p.id !== currentProduct.id)
            .filter(p => p.category === currentProduct.category || Math.random() > 0.5)
            .slice(0, 4);
        
        if (related.length === 0) {
            relatedGrid.parentElement.style.display = 'none';
            return;
        }
        
        relatedGrid.parentElement.style.display = 'block';
        relatedGrid.innerHTML = related.map(product => `
            <div class="related-card" data-product-id="${product.id}">
                <div class="related-card-image">
                    <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23E6DFD3%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
                </div>
                <div class="related-card-info">
                    <div class="related-card-name">${escapeHtml(product.name)}</div>
                    <div class="related-card-price">${formatPrice(product.price)}</div>
                </div>
            </div>
        `).join('');
        
        
        relatedGrid.querySelectorAll('.related-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                openProductModal(productId);
            });
        });
    }
    
    
    if (modalClose) {
        modalClose.addEventListener('click', closeProductModal);
    }
    
    if (productModalOverlay) {
        productModalOverlay.addEventListener('click', closeProductModal);
    }
    
    
    if (qtyDecrease) {
        qtyDecrease.addEventListener('click', () => {
            const current = parseInt(qtyInput.value) || 1;
            if (current > 1) qtyInput.value = current - 1;
        });
    }
    
    if (qtyIncrease) {
        qtyIncrease.addEventListener('click', () => {
            const current = parseInt(qtyInput.value) || 1;
            const product = ProductManager.getById(currentModalProductId);
            if (product && current < product.stock) {
                qtyInput.value = current + 1;
            }
        });
    }
    
    if (qtyInput) {
        qtyInput.addEventListener('change', () => {
            let value = parseInt(qtyInput.value) || 1;
            const product = ProductManager.getById(currentModalProductId);
            if (value < 1) value = 1;
            if (product && value > product.stock) value = product.stock;
            qtyInput.value = value;
        });
    }
    
    
    if (modalAddToCart) {
        modalAddToCart.addEventListener('click', async () => {
            const user = UserManager.getCurrentUser();
            if (!user) {
                Toast.info('Please sign in to add items to cart');
                setTimeout(() => {
                    PageTransition.navigate('auth.html#login');
                }, 1000);
                return;
            }
            
            const quantity = parseInt(qtyInput.value) || 1;
            const result = await CartManager.addItem(currentModalProductId, quantity);
            
            if (result.success) {
                Toast.success(`Added ${quantity} item(s) to cart`);
                updateCartCount();
                closeProductModal();
            } else {
                Toast.error(result.message);
            }
        });
    }
    
    
    if (modalBuyNow) {
        modalBuyNow.addEventListener('click', async () => {
            const user = UserManager.getCurrentUser();
            if (!user) {
                Toast.info('Please sign in to purchase');
                setTimeout(() => {
                    PageTransition.navigate('auth.html#login');
                }, 1000);
                return;
            }
            
            const quantity = parseInt(qtyInput.value) || 1;
            const result = await CartManager.addItem(currentModalProductId, quantity);
            
            if (result.success) {
                Toast.success('Proceeding to checkout...');
                updateCartCount();
                closeProductModal();
                
                setTimeout(() => {
                    openCart();
                }, 500);
            } else {
                Toast.error(result.message);
            }
        });
    }
    
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productModal?.classList.contains('active')) {
            closeProductModal();
        }
    });
});