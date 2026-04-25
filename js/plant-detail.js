document.addEventListener('DOMContentLoaded', async () => {

    // ─── Parse product ID from URL ─────────────────────────────────────────
    const params   = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    // ─── DOM refs ─────────────────────────────────────────────────────────
    const detailImage       = document.getElementById('detailImage');
    const detailCategory    = document.getElementById('detailCategory');
    const detailTitle       = document.getElementById('detailTitle');
    const detailStockBadge  = document.getElementById('detailStockBadge');
    const detailPrice       = document.getElementById('detailPrice');
    const detailCareText    = document.getElementById('detailCareText');
    const careTipsGrid      = document.getElementById('careTipsGrid');
    const detailQtyVal      = document.getElementById('detailQtyVal');
    const detailQtyDec      = document.getElementById('detailQtyDec');
    const detailQtyInc      = document.getElementById('detailQtyInc');
    const detailAddBtn      = document.getElementById('detailAddBtn');
    const detailSignInNote  = document.getElementById('detailSignInNote');
    const detailActionsWrap = document.getElementById('detailActionsWrap');
    const commentsList      = document.getElementById('commentsList');
    const commentsLoading   = document.getElementById('commentsLoading');
    const commentsEmpty     = document.getElementById('commentsEmpty');
    const commentFormWrap   = document.getElementById('commentFormWrap');
    const commentSignIn     = document.getElementById('commentSignIn');
    const commentFormAvatar = document.getElementById('commentFormAvatar');
    const commentFormName   = document.getElementById('commentFormName');
    const commentTextarea   = document.getElementById('commentTextarea');
    const commentSubmitBtn  = document.getElementById('commentSubmitBtn');
    const commentCharCount  = document.getElementById('commentCharCount');
    const commentCount      = document.getElementById('commentCount');

    // ─── Redirect if no product id ──────────────────────────────────────
    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    // ─── Boot Firebase ─────────────────────────────────────────────────
    try {
        await BOTANIKA.ready();
    } catch (error) {
        console.error(error);
        Toast.error('Firebase failed to start. Check your local config.');
        return;
    }

    const user    = UserManager.getCurrentUser();
    const product = ProductManager.getById(productId);

    if (!product) {
        Toast.error('Plant not found');
        setTimeout(() => { window.location.href = 'shop.html'; }, 1200);
        return;
    }

    // ─── Populate hero ─────────────────────────────────────────────────
    document.title = `BOTANIKA | ${product.name}`;

    if (detailImage) {
        detailImage.src = product.image;
        detailImage.alt = product.name;
        detailImage.onerror = function () {
            this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23E6DFD3' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%238A9A5B' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
        };
    }

    if (detailCategory) detailCategory.textContent = product.category;
    if (detailTitle)    detailTitle.textContent    = product.name;
    if (detailPrice)    detailPrice.textContent    = formatPrice(product.price);

    if (detailStockBadge) {
        if (product.stock < 1) {
            detailStockBadge.textContent = 'Out of Stock';
            detailStockBadge.className   = 'detail-stock-badge out-of-stock';
        } else if (product.stock <= 5) {
            detailStockBadge.textContent = `Only ${product.stock} left`;
            detailStockBadge.className   = 'detail-stock-badge low-stock';
        } else {
            detailStockBadge.textContent = `${product.stock} in stock`;
            detailStockBadge.className   = 'detail-stock-badge in-stock';
        }
    }

    // ─── Cart actions ──────────────────────────────────────────────────
    const isOutOfStock = product.stock < 1;
    let   qty          = 1;

    if (user && !user.isAdmin) {
        if (detailSignInNote)  detailSignInNote.style.display  = 'none';
        if (detailActionsWrap) detailActionsWrap.style.display = 'flex';

        if (detailAddBtn) {
            detailAddBtn.disabled = isOutOfStock;
            detailAddBtn.textContent = isOutOfStock ? 'Out of Stock' : 'Add to Cart';
        }

        if (detailQtyDec) detailQtyDec.addEventListener('click', () => {
            if (qty > 1) { qty--; if (detailQtyVal) detailQtyVal.textContent = qty; }
        });

        if (detailQtyInc) detailQtyInc.addEventListener('click', () => {
            if (qty < product.stock) { qty++; if (detailQtyVal) detailQtyVal.textContent = qty; }
        });

        if (detailAddBtn) {
            detailAddBtn.addEventListener('click', async () => {
                detailAddBtn.disabled = true;
                const result = await CartManager.addItem(productId, qty);
                if (result.success) {
                    Toast.success(`${qty} × ${product.name} added to cart`);
                    if (typeof updateCartCount === 'function') updateCartCount();
                    if (typeof openCart === 'function') openCart();
                    setTimeout(() => { detailAddBtn.disabled = isOutOfStock; }, 1500);
                } else {
                    Toast.error(result.message);
                    detailAddBtn.disabled = false;
                }
            });
        }
    } else {
        if (detailActionsWrap) detailActionsWrap.style.display = 'none';
        if (detailSignInNote) {
            detailSignInNote.style.display = user && user.isAdmin ? 'none' : 'block';
        }
    }

    // ─── General care (description) ────────────────────────────────────
    if (detailCareText) detailCareText.textContent = product.description;

    // ─── Special care tips (derived from category) ────────────────────
    if (careTipsGrid) careTipsGrid.innerHTML = buildCareTips(product).map(tip => `
        <div class="care-tip-card">
            <div class="care-tip-icon">${tip.icon}</div>
            <div class="care-tip-label">${escapeHtml(tip.label)}</div>
            <div class="care-tip-value">${escapeHtml(tip.value)}</div>
            <div class="care-tip-note">${escapeHtml(tip.note)}</div>
        </div>
    `).join('');

    // ─── Comments ─────────────────────────────────────────────────────
    await loadComments();
    setupCommentForm();

    // ─── Helper: care tips per category ───────────────────────────────
    function buildCareTips(p) {
        const cat  = (p.category || '').toLowerCase();
        const name = p.name.toLowerCase();

        // Defaults
        let light   = { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',  label: 'Light',       value: 'Bright indirect light',    note: 'Avoid direct harsh afternoon sun.' };
        let water   = { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>',  label: 'Watering',    value: 'Once a week',               note: 'Allow top 2 cm of soil to dry between waterings.' };
        let soil    = { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M7 8h10M5 8l2 14h10l2-14M12 2v6"/><path d="M9 5h6"/></svg>',  label: 'Soil',        value: 'Well-draining potting mix', note: 'Add perlite for better drainage.' };
        let humidity = { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5a4.5 4.5 0 0 0-4-4.5 5.5 5.5 0 0 0-10.5-1 4 4 0 0 0 1 7.8H17.5z"/><path d="M8 22l1-3"/><path d="M12 22l1-3"/><path d="M16 22l1-3"/></svg>', label: 'Humidity',    value: 'Moderate (40–60 %)',         note: 'Mist leaves occasionally or use a pebble tray.' };
        let temp    = { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>', label: 'Temperature', value: '18–27 °C (64–80 °F)',        note: 'Keep away from cold drafts and heating vents.' };
        let feeding = { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M12 10a6 6 0 0 0-6-6H3v2a6 6 0 0 0 6 6h3"/><path d="M12 14a6 6 0 0 1 6-6h3v2a6 6 0 0 1-6 6h-3"/><path d="M12 22V10"/></svg>',  label: 'Fertilising', value: 'Monthly in spring/summer',  note: 'Balanced liquid fertiliser diluted to half-strength.' };

        if (cat.includes('succulent') || cat.includes('cacti') || name.includes('cactus') || name.includes('aloe')) {
            light.value   = 'Full sun to bright direct light';
            light.note    = 'Needs at least 4–6 hours of sunlight per day.';
            water.value   = 'Every 2–4 weeks';
            water.note    = 'Let soil dry out completely between waterings. Less in winter.';
            soil.value    = 'Cactus / succulent mix';
            soil.note     = 'Excellent drainage is essential — never sit in water.';
            humidity.value = 'Low (under 40 %)';
            humidity.note  = 'These plants are desert natives and prefer dry air.';
        }

        if (name.includes('snake') || name.includes('sansevieria') || name.includes('pothos') || name.includes('zz')) {
            light.value  = 'Low to bright indirect light';
            light.note   = 'Extremely tolerant — one of the most adaptable houseplants.';
            water.value  = 'Every 2–6 weeks';
            water.note   = 'Thrives on neglect. Overwatering is the main risk.';
        }

        if (name.includes('monstera') || name.includes('fiddle') || name.includes('ficus')) {
            light.value  = 'Bright indirect light';
            light.note   = 'A few hours of dappled sun is perfect.';
            water.value  = 'Weekly in summer, less in winter';
            water.note   = 'Keep soil consistently moist but never waterlogged.';
            humidity.value = 'High (60 %+)';
            humidity.note  = 'Loves humidity — place near a humidifier for best results.';
        }

        if (name.includes('peace') || name.includes('lily')) {
            light.value  = 'Low to medium indirect light';
            light.note   = 'Tolerates low light well — great for darker rooms.';
            water.value  = 'Weekly';
            water.note   = 'Keep soil evenly moist. Will visibly droop when thirsty.';
        }

        if (cat.includes('herb') || cat.includes('edible')) {
            light.value  = 'Full sun';
            light.note   = 'Most herbs need 6+ hours of direct sunlight daily.';
            water.value  = 'Every 2–3 days';
            water.note   = 'Keep moist but never soggy. Ensure good drainage.';
            feeding.value = 'Every 2 weeks';
            feeding.note  = 'A nitrogen-rich liquid feed encourages lush leaf growth.';
        }

        if (cat.includes('outdoor') || cat.includes('garden')) {
            temp.value = 'Varies with season';
            temp.note  = 'Acclimatise to outdoor conditions before leaving permanently.';
            light.value = 'Full to partial sun';
            light.note  = 'Follow specific variety guidance for sun exposure.';
        }

        return [light, water, soil, humidity, temp, feeding];
    }

    // ─── Load + render comments ────────────────────────────────────────
    async function loadComments() {
        if (commentsLoading) commentsLoading.style.display = 'flex';
        if (commentsList)    commentsList.innerHTML = '';
        if (commentsEmpty)   commentsEmpty.style.display = 'none';

        try {
            const comments = await CommentManager.getForProduct(productId);
            renderComments(comments);
        } catch (err) {
            console.error('Comments load failed:', err);
            if (commentsLoading) commentsLoading.style.display = 'none';
            if (commentsEmpty) {
                commentsEmpty.style.display = 'flex';
                commentsEmpty.innerHTML = `
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p>Comments couldn't be loaded.</p>
                `;
            }
        }
    }

    function renderComments(comments) {
        if (commentsLoading) commentsLoading.style.display = 'none';

        if (commentCount) commentCount.textContent = comments.length;

        if (!comments.length) {
            if (commentsEmpty)   commentsEmpty.style.display   = 'flex';
            if (commentsList)    commentsList.innerHTML         = '';
            return;
        }

        if (commentsEmpty) commentsEmpty.style.display = 'none';

        const currentUserId = user ? user.id : null;
        const isAdmin       = user ? user.isAdmin : false;

        if (commentsList) {
            commentsList.innerHTML = comments.map(c => {
                const canDelete = isAdmin || (currentUserId && c.userId === currentUserId);
                const avatarHtml = c.userAvatar
                    ? `<img src="${escapeHtml(c.userAvatar)}" alt="${escapeHtml(c.userName)}">`
                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

                return `
                    <div class="comment-item" data-comment-id="${escapeHtml(c.id)}">
                        <div class="comment-avatar">${avatarHtml}</div>
                        <div class="comment-body">
                            <div class="comment-meta">
                                <span class="comment-author">${escapeHtml(c.userName || 'Anonymous')}</span>
                                <span class="comment-date">${formatCommentDate(c.createdAt)}</span>
                                ${canDelete ? `<button class="comment-delete-btn" data-id="${escapeHtml(c.id)}" title="Delete">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>` : ''}
                            </div>
                            <div class="comment-text">${escapeHtml(c.text)}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // Attach delete listeners
            commentsList.querySelectorAll('.comment-delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    btn.disabled = true;
                    try {
                        await CommentManager.delete(btn.dataset.id);
                        await loadComments();
                        Toast.success('Comment deleted');
                    } catch (err) {
                        Toast.error('Failed to delete comment');
                        btn.disabled = false;
                    }
                });
            });
        }
    }

    function formatCommentDate(val) {
        if (!val) return '';
        const d = new Date(val);
        if (isNaN(d)) return '';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            + ' · '
            + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // ─── Comment form ─────────────────────────────────────────────────
    function setupCommentForm() {
        if (!user) {
            if (commentFormWrap) commentFormWrap.style.display = 'none';
            if (commentSignIn)   commentSignIn.style.display   = 'flex';
            return;
        }

        if (commentSignIn)   commentSignIn.style.display   = 'none';
        if (commentFormWrap) commentFormWrap.style.display  = 'block';

        // Render the commenter's avatar + name
        if (commentFormAvatar) {
            commentFormAvatar.innerHTML = user.avatar
                ? `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}">`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        }
        if (commentFormName) commentFormName.textContent = user.name;

        // Char counter
        const MAX_CHARS = 500;
        if (commentTextarea && commentCharCount) {
            commentTextarea.addEventListener('input', () => {
                const left = MAX_CHARS - commentTextarea.value.length;
                commentCharCount.textContent = `${Math.max(0, left)} characters remaining`;
                commentCharCount.style.color = left < 50 ? 'var(--color-terracotta)' : 'var(--color-text-muted)';
                if (commentTextarea.value.length > MAX_CHARS) {
                    commentTextarea.value = commentTextarea.value.slice(0, MAX_CHARS);
                }
            });
        }

        // Submit
        if (commentSubmitBtn && commentTextarea) {
            commentSubmitBtn.addEventListener('click', async () => {
                const text = commentTextarea.value.trim();
                if (!text) {
                    Toast.error('Please write something before posting');
                    commentTextarea.focus();
                    return;
                }

                commentSubmitBtn.disabled = true;
                commentSubmitBtn.textContent = 'Posting…';

                const result = await CommentManager.add(productId, text);
                if (result.success) {
                    commentTextarea.value = '';
                    if (commentCharCount) commentCharCount.textContent = `${MAX_CHARS} characters remaining`;
                    Toast.success('Comment posted!');
                    await loadComments();
                } else {
                    Toast.error(result.message || 'Failed to post comment');
                }

                commentSubmitBtn.disabled = false;
                commentSubmitBtn.textContent = 'Post Comment';
            });
        }
    }

    // ─── Cart Drawer Logic ─────────────────────────────────────────────
    const cartBtn       = document.getElementById('cartBtn');
    const cartClose     = document.getElementById('cartClose');
    const cartOverlay   = document.getElementById('cartOverlay');
    const cartDrawer    = document.getElementById('cartDrawer');
    const cartItems     = document.getElementById('cartItems');
    const cartEmpty     = document.getElementById('cartEmpty');
    const cartFooter    = document.getElementById('cartFooter');
    const cartTotal     = document.getElementById('cartTotal');
    const cartCountEl   = document.getElementById('cartCount');

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartDrawer?.classList.contains('active')) closeCart();
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
            const prod = ProductManager.getById(item.productId);
            if (!prod) return '';
            return `
                <div class="cart-item" data-product-id="${item.productId}">
                    <div class="cart-item-image">
                        <img src="${escapeHtml(prod.image)}" alt="${escapeHtml(prod.name)}">
                    </div>
                    <div class="cart-item-details">
                        <span class="cart-item-name">${escapeHtml(prod.name)}</span>
                        <span class="cart-item-price">${formatPrice(prod.price)}</span>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button class="quantity-btn decrease" data-product-id="${item.productId}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
                                </button>
                                <span class="quantity-value">${item.quantity}</span>
                                <button class="quantity-btn increase" data-product-id="${item.productId}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                                </button>
                            </div>
                            <button class="remove-btn" data-product-id="${item.productId}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
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
                const pid = btn.dataset.productId;
                const cart = CartManager.getCart();
                const item = cart.find(i => i.productId === pid);
                if (item) updateQuantityWithAnimation(pid, item.quantity - 1);
            });
        });
        document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.dataset.productId;
                const cart = CartManager.getCart();
                const item = cart.find(i => i.productId === pid);
                if (item) updateQuantityWithAnimation(pid, item.quantity + 1);
            });
        });
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                removeItemWithAnimation(btn.dataset.productId);
            });
        });
    }

    function updateQuantityWithAnimation(pid, newQty) {
        const cartItem = document.querySelector(`.cart-item[data-product-id="${pid}"]`);
        const qv = cartItem?.querySelector('.quantity-value');
        if (qv) {
            qv.classList.add('updating');
            setTimeout(async () => {
                if (newQty < 1) {
                    removeItemWithAnimation(pid);
                } else {
                    const result = await CartManager.updateQuantity(pid, newQty);
                    if (result.success) {
                        qv.textContent = newQty;
                        qv.classList.remove('updating');
                        updateCartTotal();
                        updateCartCount();
                    } else {
                        qv.classList.remove('updating');
                        Toast.error(result.message);
                    }
                }
            }, 150);
        }
    }

    function removeItemWithAnimation(pid) {
        const cartItem = document.querySelector(`.cart-item[data-product-id="${pid}"]`);
        if (cartItem) {
            cartItem.classList.add('removing');
            setTimeout(async () => {
                await CartManager.removeItem(pid);
                updateCartUI();
            }, 300);
        }
    }

    function updateCartTotal() {
        if (cartTotal) cartTotal.textContent = formatPrice(CartManager.getTotal());
    }

    function updateCartCount() {
        const count = CartManager.getCount();
        if (cartCountEl) {
            cartCountEl.textContent = count;
            if (count > 0) cartCountEl.classList.add('visible');
            else cartCountEl.classList.remove('visible');
        }
    }
});
