
document.addEventListener('DOMContentLoaded', async () => {
    const navUserName = document.getElementById('navUserName');
    const userLogoutBtn = document.getElementById('userLogoutBtn');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const welcomeAvatar = document.getElementById('welcomeAvatar');
    const currentDate = document.getElementById('currentDate');
    const cartItemsCount = document.getElementById('cartItemsCount');
    const cartTotalValue = document.getElementById('cartTotalValue');
    const availablePlants = document.getElementById('availablePlants');
    const memberSince = document.getElementById('memberSince');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileType = document.getElementById('profileType');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImageTrigger = document.getElementById('profileImageTrigger');
    const profileNameInput = document.getElementById('profileNameInput');
    const profileEmailInput = document.getElementById('profileEmailInput');
    const profilePhoneInput = document.getElementById('profilePhoneInput');
    const profilePasswordInput = document.getElementById('profilePasswordInput');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const passwordResetBtn = document.getElementById('passwordResetBtn');
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');
    const cartSummaryContent = document.getElementById('cartSummaryContent');
    const cartSummaryEmpty = document.getElementById('cartSummaryEmpty');
    const cartSummaryFooter = document.getElementById('cartSummaryFooter');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartAction = document.getElementById('clearCartAction');
    const clearCartModal = document.getElementById('clearCartModal');
    const cancelClearCart = document.getElementById('cancelClearCart');
    const confirmClearCart = document.getElementById('confirmClearCart');
    const orderHistoryEmpty = document.getElementById('orderHistoryEmpty');
    const orderHistoryList = document.getElementById('orderHistoryList');
    const orderCountBadge = document.getElementById('orderCountBadge');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckoutModal = document.getElementById('closeCheckoutModal');
    const cancelCheckout = document.getElementById('cancelCheckout');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutSummary = document.getElementById('checkoutSummary');
    const checkoutName = document.getElementById('checkoutName');
    const checkoutPhone = document.getElementById('checkoutPhone');
    const checkoutAddress1 = document.getElementById('checkoutAddress1');
    const checkoutAddress2 = document.getElementById('checkoutAddress2');
    const checkoutCity = document.getElementById('checkoutCity');
    const checkoutPostalCode = document.getElementById('checkoutPostalCode');
    const checkoutNote = document.getElementById('checkoutNote');
    const confirmCheckout = document.getElementById('confirmCheckout');

    try {
        await BOTANIKA.ready();
    } catch (error) {
        console.error(error);
        Toast.error('Firebase failed to start. Check your local config.');
        return;
    }

    let currentUser = UserManager.getCurrentUser();

    if (!currentUser) {
        Toast.error('Please sign in to access your account');
        setTimeout(() => {
            PageTransition.navigate('auth.html');
        }, 1500);
        return;
    }

    if (currentUser.isAdmin) {
        PageTransition.navigate('admin.html');
        return;
    }

    function renderAvatar() {
        if (welcomeAvatar) {
            welcomeAvatar.innerHTML = renderAvatarMarkup(currentUser, 'avatar-image');
        }

        if (profileAvatar) {
            profileAvatar.innerHTML = renderAvatarMarkup(currentUser, 'avatar-image');
        }

        // Show/hide the Remove Photo button based on whether avatar exists
        if (removeAvatarBtn) {
            removeAvatarBtn.style.display = currentUser && currentUser.avatar ? 'inline-flex' : 'none';
        }
    }

    function formatOrderDate(value) {
        if (!value) {
            return 'Pending timestamp';
        }

        return new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function loadStats() {
        const cart = CartManager.getCart();
        const products = ProductManager.getAll();
        const orders = OrderManager.getForCurrentUser();
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = CartManager.getTotal();

        if (cartItemsCount) cartItemsCount.textContent = itemCount;
        if (cartTotalValue) cartTotalValue.textContent = formatPrice(total);
        if (availablePlants) availablePlants.textContent = products.filter(product => product.stock > 0).length;

        if (memberSince && currentUser.createdAt) {
            const date = new Date(currentUser.createdAt);
            memberSince.textContent = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        if (orderCountBadge) {
            orderCountBadge.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;
        }
    }

    function loadProfile() {
        if (navUserName) navUserName.textContent = currentUser.name;
        if (welcomeUserName) welcomeUserName.textContent = currentUser.name;
        if (profileName) profileName.textContent = currentUser.name;
        if (profileEmail) profileEmail.textContent = currentUser.email;
        if (profileType) profileType.textContent = currentUser.isAdmin ? 'Administrator' : 'Customer';
        if (profileNameInput) profileNameInput.value = currentUser.name || '';
        if (profileEmailInput) profileEmailInput.value = currentUser.email || '';
        if (profilePhoneInput) profilePhoneInput.value = currentUser.phone || '';
        if (checkoutName) checkoutName.value = currentUser.name || '';
        renderAvatar();
    }

    function loadCartSummary() {
        const cart = CartManager.getCart();

        if (cart.length === 0) {
            if (cartSummaryContent) cartSummaryContent.style.display = 'none';
            if (cartSummaryEmpty) cartSummaryEmpty.style.display = 'flex';
            if (cartSummaryFooter) cartSummaryFooter.style.display = 'none';
            updateCheckoutSummary();
            return;
        }

        if (cartSummaryContent) cartSummaryContent.style.display = 'block';
        if (cartSummaryEmpty) cartSummaryEmpty.style.display = 'none';
        if (cartSummaryFooter) cartSummaryFooter.style.display = 'block';

        let total = 0;
        const html = cart.map(item => {
            const product = ProductManager.getById(item.productId);

            if (!product) {
                return '';
            }

            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            return `
                <div class="cart-summary-item">
                    <div class="cart-item-image">
                        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23E6DFD3%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
                    </div>
                    <div class="cart-item-details">
                        <span class="cart-item-name">${escapeHtml(product.name)}</span>
                        <div class="cart-item-meta">
                            <span>Qty: ${item.quantity}</span>
                            <span class="cart-item-price">${formatPrice(itemTotal)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (cartSummaryContent) cartSummaryContent.innerHTML = html;
        if (cartSubtotal) cartSubtotal.textContent = formatPrice(total);
        updateCheckoutSummary();
    }

    function loadOrders() {
        const orders = OrderManager.getRecentForCurrentUser(6);

        if (!orders.length) {
            if (orderHistoryEmpty) orderHistoryEmpty.style.display = 'flex';
            if (orderHistoryList) orderHistoryList.style.display = 'none';
            return;
        }

        if (orderHistoryEmpty) orderHistoryEmpty.style.display = 'none';
        if (orderHistoryList) {
            orderHistoryList.style.display = 'grid';
            orderHistoryList.innerHTML = orders.map(order => {
                const itemSummary = (order.items || []).slice(0, 2).map(item => escapeHtml(item.name)).join(', ');
                const extraCount = Math.max(0, (order.items || []).length - 2);

                return `
                    <article class="order-history-item">
                        <div class="order-history-top">
                            <div>
                                <strong>${escapeHtml(order.orderNumber || order.id)}</strong>
                                <span>${formatOrderDate(order.createdAt)}</span>
                            </div>
                            <span class="order-status-chip">${escapeHtml(order.status || 'confirmed')}</span>
                        </div>
                        <p class="order-history-summary">${itemSummary}${extraCount ? ` + ${extraCount} more` : ''}</p>
                        <div class="order-history-bottom">
                            <span>${(order.items || []).length} item${(order.items || []).length !== 1 ? 's' : ''}</span>
                            <strong>${formatPrice(order.total || 0)}</strong>
                        </div>
                    </article>
                `;
            }).join('');
        }
    }

    function updateCheckoutSummary() {
        if (!checkoutSummary) {
            return;
        }

        const cart = CartManager.getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = CartManager.getTotal();

        checkoutSummary.innerHTML = `
            <div class="checkout-summary-card">
                <span class="checkout-summary-label">Customer</span>
                <strong>${escapeHtml(currentUser.email)}</strong>
            </div>
            <div class="checkout-summary-card">
                <span class="checkout-summary-label">Items</span>
                <strong>${count}</strong>
            </div>
            <div class="checkout-summary-card">
                <span class="checkout-summary-label">Total</span>
                <strong>${formatPrice(total)}</strong>
            </div>
        `;
    }

    function refreshDashboard() {
        currentUser = UserManager.getCurrentUser();
        loadProfile();
        loadStats();
        loadCartSummary();
        loadOrders();
    }

    function openClearCartModal() {
        if (CartManager.getCart().length === 0) {
            Toast.error('Your cart is already empty');
            return;
        }

        if (clearCartModal) clearCartModal.classList.add('active');
    }

    function closeClearCartModal() {
        if (clearCartModal) clearCartModal.classList.remove('active');
    }

    function openCheckoutModal(forceOpen = false) {
        if (!forceOpen && CartManager.getCart().length === 0) {
            Toast.error('Your cart is empty');
            return;
        }

        updateCheckoutSummary();
        if (checkoutModal) checkoutModal.classList.add('active');
    }

    function closeCheckoutFlow() {
        if (checkoutModal) checkoutModal.classList.remove('active');
    }

    async function handleLogout() {
        await UserManager.logout();
        Toast.success('You have been logged out');
        setTimeout(() => {
            PageTransition.navigate('index.html');
        }, 1000);
    }

    async function handleClearCart() {
        await CartManager.clear();
        Toast.success('Cart cleared successfully');
        closeClearCartModal();
        refreshDashboard();
    }

    async function handleProfileImageChange(event) {
        const file = event.target.files && event.target.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            Toast.error('Please choose an image file');
            event.target.value = '';
            return;
        }

        if (file.size > 1024 * 1024) {
            Toast.error('Image size must be 1MB or less');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async loadEvent => {
            const avatar = loadEvent.target && typeof loadEvent.target.result === 'string'
                ? loadEvent.target.result
                : '';

            if (!avatar) {
                Toast.error('Failed to read the selected image');
                return;
            }

            const result = await UserManager.updateProfile(currentUser.id, { avatar });

            if (!result.success) {
                Toast.error('Failed to update your profile image');
                return;
            }

            currentUser = UserManager.getCurrentUser();
            refreshDashboard();
            Toast.success('Profile photo updated');
        };
        reader.onerror = () => {
            Toast.error('Failed to read the selected image');
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    async function handleSaveProfile() {
        const name = profileNameInput ? profileNameInput.value.trim() : '';
        const email = profileEmailInput ? profileEmailInput.value.trim() : '';
        const phone = profilePhoneInput ? profilePhoneInput.value.trim() : '';
        const password = profilePasswordInput ? profilePasswordInput.value : '';

        if (name.length < 2) {
            Toast.error('Please enter a valid name');
            profileNameInput?.focus();
            return;
        }

        const updates = { name };
        if (email) updates.email = email;
        if (phone) updates.phone = phone;

        const result = await UserManager.updateProfile(currentUser.id, updates);

        if (!result.success) {
            Toast.error('Failed to update your profile');
            return;
        }

        try {
            const authUser = firebase.auth().currentUser;
            if (authUser) {
                if (email && email !== authUser.email) {
                    await authUser.updateEmail(email);
                }
                if (password) {
                    await authUser.updatePassword(password);
                }
            }
        } catch (err) {
            Toast.error('Profile updated, but failed to update email/password: ' + err.message);
        }

        currentUser = UserManager.getCurrentUser();
        refreshDashboard();
        Toast.success('Profile updated');
        if (profilePasswordInput) profilePasswordInput.value = '';
    }

    async function handlePasswordReset() {
        const result = await UserManager.requestPasswordReset(currentUser.email);

        if (!result.success) {
            Toast.error(result.message || 'Unable to send password reset email');
            return;
        }

        Toast.success('Password reset email sent');
    }

    async function handleCheckoutSubmit(event) {
        event.preventDefault();

        const payload = {
            customerName: checkoutName ? checkoutName.value.trim() : '',
            phone: checkoutPhone ? checkoutPhone.value.trim() : '',
            addressLine1: checkoutAddress1 ? checkoutAddress1.value.trim() : '',
            addressLine2: checkoutAddress2 ? checkoutAddress2.value.trim() : '',
            city: checkoutCity ? checkoutCity.value.trim() : '',
            postalCode: checkoutPostalCode ? checkoutPostalCode.value.trim() : '',
            note: checkoutNote ? checkoutNote.value.trim() : ''
        };

        if (!payload.customerName || !payload.addressLine1 || !payload.city) {
            Toast.error('Please complete the required checkout fields');
            return;
        }

        if (confirmCheckout) confirmCheckout.disabled = true;
        const result = await OrderManager.checkout(payload);
        if (confirmCheckout) confirmCheckout.disabled = false;

        if (!result.success) {
            Toast.error(result.message || 'Unable to place your order');
            return;
        }

        if (checkoutForm) checkoutForm.reset();
        if (checkoutName) checkoutName.value = currentUser.name || '';

        closeCheckoutFlow();
        refreshDashboard();
        Toast.success(`Order ${result.order.orderNumber || result.order.id} placed successfully`);
    }

    if (userLogoutBtn) userLogoutBtn.addEventListener('click', handleLogout);
    if (clearCartAction) clearCartAction.addEventListener('click', openClearCartModal);
    if (cancelClearCart) cancelClearCart.addEventListener('click', closeClearCartModal);
    if (confirmClearCart) confirmClearCart.addEventListener('click', handleClearCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', () => openCheckoutModal(false));
    if (closeCheckoutModal) closeCheckoutModal.addEventListener('click', closeCheckoutFlow);
    if (cancelCheckout) cancelCheckout.addEventListener('click', closeCheckoutFlow);
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', handleSaveProfile);
    if (passwordResetBtn) passwordResetBtn.addEventListener('click', handlePasswordReset);

    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', async () => {
            const result = await UserManager.updateProfile(currentUser.id, { avatar: '' });
            if (!result.success) { Toast.error('Failed to remove photo'); return; }
            currentUser = UserManager.getCurrentUser();
            refreshDashboard();
            Toast.success('Profile photo removed');
        });
    }

    if (profileImageTrigger && profileImageInput) {
        profileImageTrigger.addEventListener('click', () => profileImageInput.click());
        profileImageInput.addEventListener('change', handleProfileImageChange);
    }

    if (clearCartModal) {
        clearCartModal.addEventListener('click', event => {
            if (event.target === clearCartModal) {
                closeClearCartModal();
            }
        });
    }

    if (checkoutModal) {
        checkoutModal.addEventListener('click', event => {
            if (event.target === checkoutModal) {
                closeCheckoutFlow();
            }
        });
    }

    document.addEventListener('botanika:carts-updated', refreshDashboard);
    document.addEventListener('botanika:orders-updated', refreshDashboard);
    document.addEventListener('botanika:products-updated', refreshDashboard);
    document.addEventListener('botanika:user-changed', () => {
        const user = UserManager.getCurrentUser();

        if (!user) {
            PageTransition.navigate('auth.html');
            return;
        }

        currentUser = user;
        refreshDashboard();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && clearCartModal?.classList.contains('active')) {
            closeClearCartModal();
        }

        if (event.key === 'Escape' && checkoutModal?.classList.contains('active')) {
            closeCheckoutFlow();
        }
    });

    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    refreshDashboard();

    if (window.location.hash === '#checkout' && CartManager.getCart().length > 0) {
        openCheckoutModal(true);
    }
});
