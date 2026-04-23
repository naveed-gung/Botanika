const BOTANIKA = {
    STORAGE_KEYS: {
        CURRENT_USER: 'botanika_current_user',
        EMAIL_LINK_EMAIL: 'botanika_email_link_email'
    },

    COLLECTIONS: {
        USERS: 'users',
        PRODUCTS: 'products',
        CARTS: 'carts',
        ORDERS: 'orders'
    },

    DEFAULT_ADMIN: {
        name: 'Botanika Admin',
        email: 'admin@botanika.com',
        password: 'BotanikaAdmin!2026',
        isAdmin: true,
        avatar: ''
    },

    SAMPLE_PRODUCTS: [
        {
            id: 'prod_001',
            name: 'Monstera Deliciosa',
            category: 'Indoor Plants',
            price: 45.0,
            stock: 12,
            description: 'The iconic Swiss Cheese Plant with its distinctive split leaves. Perfect for adding tropical vibes to any room.',
            image: 'https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600&q=80',
            featured: true
        },
        {
            id: 'prod_002',
            name: 'Fiddle Leaf Fig',
            category: 'Indoor Plants',
            price: 65.0,
            stock: 8,
            description: 'Elegant violin-shaped leaves that make a bold architectural statement in modern spaces.',
            image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&q=80',
            featured: true
        },
        {
            id: 'prod_003',
            name: 'Snake Plant Laurentii',
            category: 'Indoor Plants',
            price: 28.0,
            stock: 20,
            description: 'Hardy and sculptural with striking yellow-edged leaves. Thrives on neglect and purifies air.',
            image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=600&q=80',
            featured: false
        },
        {
            id: 'prod_004',
            name: 'Botanical Print - Fern',
            category: 'Art Prints',
            price: 35.0,
            stock: 15,
            description: 'Vintage-inspired fern illustration on archival matte paper. Unframed, ready for your perfect frame.',
            image: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=600&q=80',
            featured: false
        },
        {
            id: 'prod_005',
            name: 'Pothos Golden',
            category: 'Indoor Plants',
            price: 18.0,
            stock: 25,
            description: 'Cascading vines with heart-shaped leaves splashed with golden variegation. Perfect for shelves.',
            image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&q=80',
            featured: false
        },
        {
            id: 'prod_006',
            name: 'Peace Lily',
            category: 'Indoor Plants',
            price: 32.0,
            stock: 10,
            description: 'Graceful white blooms and glossy leaves. An elegant air-purifying companion for low-light spaces.',
            image: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=600&q=80',
            featured: true
        }
    ]
};

const SessionStore = {
    get(key) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            return null;
        }
    },

    set(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    },

    remove(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            return false;
        }
    }
};

const FirebaseService = {
    app: null,
    auth: null,
    db: null,
    readyPromise: null,
    authBootstrapPromise: null,
    currentUser: SessionStore.get(BOTANIKA.STORAGE_KEYS.CURRENT_USER),
    cache: {
        users: [],
        products: [],
        carts: {},
        orders: []
    },
    subscriptions: [],
    listenersInitialized: false,

    init() {
        if (this.readyPromise) {
            return this.readyPromise;
        }

        this.readyPromise = (async () => {
            if (!window.firebase || !window.BOTANIKA_FIREBASE_CONFIG) {
                throw new Error('Firebase is not configured. Add js/firebase.config.js before js/app.js.');
            }

            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(window.BOTANIKA_FIREBASE_CONFIG);
            } else {
                this.app = firebase.app();
            }

            this.auth = firebase.auth();
            this.db = firebase.firestore();

            await this.waitForInitialAuthState();
            await this.refreshProducts();
            await this.syncCurrentUserFromAuth(this.auth.currentUser);
            await this.refreshScopedData();
            this.attachAuthListener();
            this.subscribeToRealtimeData();

            return this.cache;
        })();

        return this.readyPromise;
    },

    waitForInitialAuthState() {
        if (this.authBootstrapPromise) {
            return this.authBootstrapPromise;
        }

        this.authBootstrapPromise = new Promise(resolve => {
            const unsubscribe = this.auth.onAuthStateChanged(() => {
                unsubscribe();
                resolve();
            });
        });

        return this.authBootstrapPromise;
    },

    attachAuthListener() {
        this.auth.onAuthStateChanged(async authUser => {
            await this.syncCurrentUserFromAuth(authUser);
            await this.refreshScopedData();
            this.subscribeToRealtimeData();
        });
    },

    async refreshAll() {
        await Promise.all([
            this.refreshProducts(),
            this.refreshUsers(),
            this.refreshCarts(),
            this.refreshOrders()
        ]);
    },

    async refreshScopedData() {
        await Promise.all([
            this.refreshUsers(),
            this.refreshCarts(),
            this.refreshOrders()
        ]);
    },

    async refreshUsers() {
        const authUser = this.auth ? this.auth.currentUser : null;

        if (!authUser) {
            this.cache.users = [];
            return this.cache.users;
        }

        try {
            if (this.currentUser && this.currentUser.isAdmin) {
                const snapshot = await this.db.collection(BOTANIKA.COLLECTIONS.USERS).get();

                this.cache.users = snapshot.docs
                    .map(doc => this.normalizeRecord(doc))
                    .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));

                return this.cache.users;
            }

            const profileDoc = await this.db.collection(BOTANIKA.COLLECTIONS.USERS).doc(authUser.uid).get();
            this.cache.users = profileDoc.exists ? [this.normalizeRecord(profileDoc)] : [];
        } catch (error) {
            if (error && error.code === 'permission-denied') {
                this.cache.users = [];
                return this.cache.users;
            }

            throw error;
        }

        return this.cache.users;
    },

    async refreshProducts() {
        try {
            const snapshot = await this.db.collection(BOTANIKA.COLLECTIONS.PRODUCTS).get();

            this.cache.products = snapshot.docs
                .map(doc => this.normalizeRecord(doc))
                .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));
        } catch (error) {
            if (error && error.code === 'permission-denied') {
                this.cache.products = [];
                return this.cache.products;
            }

            throw error;
        }

        return this.cache.products;
    },

    async refreshCarts() {
        const authUser = this.auth ? this.auth.currentUser : null;
        const carts = {};

        if (!authUser) {
            this.cache.carts = carts;
            return this.cache.carts;
        }

        try {
            const snapshot = await this.db.collection(BOTANIKA.COLLECTIONS.CARTS).doc(authUser.uid).get();

            if (snapshot.exists) {
                const data = this.normalizeRecord(snapshot);
                carts[authUser.uid] = Array.isArray(data.items) ? data.items : [];
            }
        } catch (error) {
            if (!(error && error.code === 'permission-denied')) {
                throw error;
            }
        }

        this.cache.carts = carts;
        return this.cache.carts;
    },

    async refreshOrders() {
        const authUser = this.auth ? this.auth.currentUser : null;

        if (!authUser) {
            this.cache.orders = [];
            return this.cache.orders;
        }

        try {
            const query = this.currentUser && this.currentUser.isAdmin
                ? this.db.collection(BOTANIKA.COLLECTIONS.ORDERS)
                : this.db.collection(BOTANIKA.COLLECTIONS.ORDERS).where('userId', '==', authUser.uid);

            const snapshot = await query.get();

            this.cache.orders = snapshot.docs
                .map(doc => this.normalizeRecord(doc))
                .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
        } catch (error) {
            if (error && error.code === 'permission-denied') {
                this.cache.orders = [];
                return this.cache.orders;
            }

            throw error;
        }

        return this.cache.orders;
    },

    subscribeToRealtimeData() {
        const authUser = this.auth ? this.auth.currentUser : null;

        this.resetSubscriptions();

        this.listenersInitialized = true;

        this.subscriptions.push(
            this.db.collection(BOTANIKA.COLLECTIONS.PRODUCTS).onSnapshot(
                snapshot => {
                    this.cache.products = snapshot.docs
                        .map(doc => this.normalizeRecord(doc))
                        .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));

                    this.emit('botanika:products-updated', this.cache.products);
                },
                error => this.handleRealtimeError('products', error)
            )
        );

        if (!authUser) {
            this.cache.users = [];
            this.cache.carts = {};
            this.cache.orders = [];
            this.emit('botanika:users-updated', []);
            this.emit('botanika:carts-updated', this.cache.carts);
            this.emit('botanika:orders-updated', this.cache.orders);
            return;
        }

        this.subscriptions.push(
            this.db.collection(BOTANIKA.COLLECTIONS.CARTS).doc(authUser.uid).onSnapshot(
                snapshot => {
                    const carts = {};

                    if (snapshot.exists) {
                        const data = this.normalizeRecord(snapshot);
                        carts[authUser.uid] = Array.isArray(data.items) ? data.items : [];
                    }

                    this.cache.carts = carts;
                    this.emit('botanika:carts-updated', this.cache.carts);
                },
                error => this.handleRealtimeError('carts', error)
            )
        );

        if (this.currentUser && this.currentUser.isAdmin) {
            this.subscriptions.push(
                this.db.collection(BOTANIKA.COLLECTIONS.USERS).onSnapshot(
                    snapshot => {
                        this.cache.users = snapshot.docs
                            .map(doc => this.normalizeRecord(doc))
                            .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));

                        this.emit('botanika:users-updated', this.cache.users.map(user => this.toSafeUser(user)));
                    },
                    error => this.handleRealtimeError('users', error)
                )
            );

            this.subscriptions.push(
                this.db.collection(BOTANIKA.COLLECTIONS.ORDERS).onSnapshot(
                    snapshot => {
                        this.cache.orders = snapshot.docs
                            .map(doc => this.normalizeRecord(doc))
                            .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

                        this.emit('botanika:orders-updated', this.cache.orders);
                    },
                    error => this.handleRealtimeError('orders', error)
                )
            );

            return;
        }

        this.subscriptions.push(
            this.db.collection(BOTANIKA.COLLECTIONS.USERS).doc(authUser.uid).onSnapshot(
                snapshot => {
                    this.cache.users = snapshot.exists ? [this.normalizeRecord(snapshot)] : [];
                    this.emit('botanika:users-updated', this.cache.users.map(user => this.toSafeUser(user)));
                },
                error => this.handleRealtimeError('users', error)
            )
        );

        this.subscriptions.push(
            this.db.collection(BOTANIKA.COLLECTIONS.ORDERS).where('userId', '==', authUser.uid).onSnapshot(
                snapshot => {
                    this.cache.orders = snapshot.docs
                        .map(doc => this.normalizeRecord(doc))
                        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

                    this.emit('botanika:orders-updated', this.cache.orders);
                },
                error => this.handleRealtimeError('orders', error)
            )
        );
    },

    async syncCurrentUserFromAuth(authUser = this.auth ? this.auth.currentUser : null) {
        if (!authUser) {
            this.currentUser = null;
            SessionStore.remove(BOTANIKA.STORAGE_KEYS.CURRENT_USER);
            this.emit('botanika:user-changed', null);
            return null;
        }

        let profile = this.cache.users.find(user => user.id === authUser.uid);

        if (!profile) {
            const profileDoc = await this.db.collection(BOTANIKA.COLLECTIONS.USERS).doc(authUser.uid).get();

            if (!profileDoc.exists) {
                profile = await this.createProfileFromAuthUser(authUser);
            } else {
                profile = this.normalizeRecord(profileDoc);
            }
        }

        this.upsertCacheRecord('users', profile);

        const safeUser = this.toSafeUser(profile);
        this.currentUser = safeUser;
        SessionStore.set(BOTANIKA.STORAGE_KEYS.CURRENT_USER, safeUser);
        this.emit('botanika:user-changed', safeUser);
        return safeUser;
    },

    async createProfileFromAuthUser(authUser) {
        const email = (authUser.email || '').trim().toLowerCase();

        if (!email) {
            await this.auth.signOut();
            return null;
        }

        const fallbackName = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
        const formattedName = authUser.displayName || fallbackName.replace(/\b\w/g, character => character.toUpperCase()) || 'Botanika Customer';

        await this.createUserProfile(authUser.uid, {
            name: formattedName,
            email,
            isAdmin: false,
            avatar: authUser.photoURL || ''
        });

        return this.cache.users.find(user => user.id === authUser.uid) || null;
    },

    async findUserByEmail(email) {
        await this.init();

        const normalizedEmail = email.trim().toLowerCase();
        const cachedUser = this.cache.users.find(user => user.email === normalizedEmail);

        if (cachedUser) {
            return cachedUser;
        }

        const snapshot = await this.db
            .collection(BOTANIKA.COLLECTIONS.USERS)
            .where('email', '==', normalizedEmail)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const user = this.normalizeRecord(snapshot.docs[0]);
        this.upsertCacheRecord('users', user);
        return user;
    },

    async createUserProfile(userId, profile) {
        await this.db.collection(BOTANIKA.COLLECTIONS.USERS).doc(userId).set({
            ...profile,
            email: profile.email.trim().toLowerCase(),
            avatar: profile.avatar || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await this.refreshUsers();
        return this.cache.users.find(user => user.id === userId) || null;
    },

    async updateUserProfile(userId, updates) {
        await this.db.collection(BOTANIKA.COLLECTIONS.USERS).doc(userId).set({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await this.refreshUsers();

        if (this.currentUser && this.currentUser.id === userId) {
            await this.syncCurrentUserFromAuth(this.auth.currentUser);
        }

        return this.cache.users.find(user => user.id === userId) || null;
    },

    async deleteUserProfile(userId) {
        await this.db.collection(BOTANIKA.COLLECTIONS.USERS).doc(userId).delete();
        await this.db.collection(BOTANIKA.COLLECTIONS.CARTS).doc(userId).delete();
        delete this.cache.carts[userId];
        await this.refreshUsers();
        this.emit('botanika:users-updated', this.cache.users);
        this.emit('botanika:carts-updated', this.cache.carts);
    },

    async saveProduct(productId, productData, isNew = false) {
        const payload = {
            ...productData,
            featured: Boolean(productData.featured),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (isNew) {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }

        await this.db.collection(BOTANIKA.COLLECTIONS.PRODUCTS).doc(productId).set(payload, { merge: true });
        await this.refreshProducts();
        this.emit('botanika:products-updated', this.cache.products);
        return this.cache.products.find(product => product.id === productId) || null;
    },

    async deleteProduct(productId) {
        await this.db.collection(BOTANIKA.COLLECTIONS.PRODUCTS).doc(productId).delete();

        const cartIds = Object.keys(this.cache.carts);

        await Promise.all(cartIds.map(async userId => {
            const nextItems = (this.cache.carts[userId] || []).filter(item => item.productId !== productId);
            await this.saveCart(userId, nextItems);
        }));

        await this.refreshProducts();
        this.emit('botanika:products-updated', this.cache.products);
        return true;
    },

    async saveCart(userId, items) {
        await this.db.collection(BOTANIKA.COLLECTIONS.CARTS).doc(userId).set({
            items,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        this.cache.carts[userId] = items;
        this.emit('botanika:carts-updated', this.cache.carts);
        return items;
    },

    async placeOrder(userId, details) {
        const cart = this.cache.carts[userId] || [];

        if (!cart.length) {
            return { success: false, message: 'Your cart is empty' };
        }

        const orderItems = [];
        let subtotal = 0;

        for (const item of cart) {
            const product = this.cache.products.find(entry => entry.id === item.productId);

            if (!product) {
                return { success: false, message: 'A product in your cart no longer exists' };
            }

            if (product.stock < item.quantity) {
                return { success: false, message: `${product.name} does not have enough stock` };
            }

            const lineTotal = product.price * item.quantity;
            subtotal += lineTotal;

            orderItems.push({
                productId: product.id,
                name: product.name,
                image: product.image,
                price: product.price,
                quantity: item.quantity,
                lineTotal
            });
        }

        const orderId = generateId('order');
        const orderNumber = `BOT-${Date.now().toString().slice(-8)}`;
        const batch = this.db.batch();
        const orderRef = this.db.collection(BOTANIKA.COLLECTIONS.ORDERS).doc(orderId);

        batch.set(orderRef, {
            userId,
            orderNumber,
            status: 'confirmed',
            items: orderItems,
            subtotal,
            shipping: 0,
            total: subtotal,
            customerName: details.customerName,
            customerEmail: details.customerEmail,
            phone: details.phone || '',
            addressLine1: details.addressLine1,
            addressLine2: details.addressLine2 || '',
            city: details.city,
            postalCode: details.postalCode || '',
            note: details.note || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        orderItems.forEach(item => {
            const product = this.cache.products.find(entry => entry.id === item.productId);
            const productRef = this.db.collection(BOTANIKA.COLLECTIONS.PRODUCTS).doc(item.productId);

            batch.set(productRef, {
                stock: Math.max(0, product.stock - item.quantity),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        const cartRef = this.db.collection(BOTANIKA.COLLECTIONS.CARTS).doc(userId);
        batch.set(cartRef, {
            items: [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await batch.commit();
        await this.refreshProducts();
        await this.refreshCarts();
        await this.refreshOrders();

        this.emit('botanika:products-updated', this.cache.products);
        this.emit('botanika:carts-updated', this.cache.carts);
        this.emit('botanika:orders-updated', this.cache.orders);

        return {
            success: true,
            order: this.cache.orders.find(order => order.id === orderId) || {
                id: orderId,
                orderNumber,
                items: orderItems,
                total: subtotal,
                status: 'confirmed'
            }
        };
    },

    normalizeRecord(doc) {
        const raw = doc.data() || {};

        return {
            id: doc.id,
            ...this.normalizeValue(raw)
        };
    },

    normalizeValue(value) {
        if (value && typeof value.toDate === 'function') {
            return value.toDate().toISOString();
        }

        if (Array.isArray(value)) {
            return value.map(item => this.normalizeValue(item));
        }

        if (value && typeof value === 'object') {
            const normalized = {};

            Object.keys(value).forEach(key => {
                normalized[key] = this.normalizeValue(value[key]);
            });

            return normalized;
        }

        return value;
    },

    toSafeUser(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: Boolean(user.isAdmin),
            avatar: user.avatar || '',
            createdAt: user.createdAt || new Date().toISOString()
        };
    },

    upsertCacheRecord(key, record) {
        if (!record) {
            return;
        }

        const list = this.cache[key];
        const index = list.findIndex(item => item.id === record.id);

        if (index === -1) {
            list.push(record);
        } else {
            list[index] = record;
        }
    },

    emit(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    },

    resetSubscriptions() {
        this.subscriptions.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });

        this.subscriptions = [];
        this.listenersInitialized = false;
    },

    handleRealtimeError(channel, error) {
        if (error && error.code === 'permission-denied') {
            console.warn(`Botanika realtime ${channel} listener skipped due to Firestore permissions.`);
            return;
        }

        console.error(`Botanika realtime ${channel} listener failed.`, error);
    }
};

const UserManager = {
    init() {
        return FirebaseService.init();
    },

    getAll() {
        return FirebaseService.cache.users.map(user => FirebaseService.toSafeUser(user));
    },

    getCurrentUser() {
        return FirebaseService.currentUser || SessionStore.get(BOTANIKA.STORAGE_KEYS.CURRENT_USER);
    },

    isLoggedIn() {
        return Boolean(this.getCurrentUser());
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return Boolean(user && user.isAdmin);
    },

    async refreshCurrentUser() {
        await FirebaseService.syncCurrentUserFromAuth();
        return this.getCurrentUser();
    },

    async register(name, email, password, isAdmin = false) {
        await FirebaseService.init();

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await FirebaseService.findUserByEmail(normalizedEmail);

        if (existingUser) {
            return { success: false, message: 'Email already registered' };
        }

        try {
            const credentials = await FirebaseService.auth.createUserWithEmailAndPassword(normalizedEmail, password);

            await FirebaseService.createUserProfile(credentials.user.uid, {
                name: name.trim(),
                email: normalizedEmail,
                isAdmin,
                avatar: ''
            });

            await FirebaseService.syncCurrentUserFromAuth(credentials.user);

            return { success: true, user: this.getCurrentUser() };
        } catch (error) {
            return { success: false, message: this.getAuthErrorMessage(error) };
        }
    },

    async login(email, password) {
        await FirebaseService.init();

        try {
            const credentials = await FirebaseService.auth.signInWithEmailAndPassword(
                email.trim().toLowerCase(),
                password
            );

            const safeUser = await FirebaseService.syncCurrentUserFromAuth(credentials.user);

            if (!safeUser) {
                return { success: false, message: 'This account is no longer available' };
            }

            return { success: true, user: safeUser };
        } catch (error) {
            return { success: false, message: this.getAuthErrorMessage(error) };
        }
    },

    async loginWithGoogle() {
        await FirebaseService.init();

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const credentials = await FirebaseService.auth.signInWithPopup(provider);
            const safeUser = await FirebaseService.syncCurrentUserFromAuth(credentials.user);

            if (!safeUser) {
                return { success: false, message: 'Unable to load your Botanika profile' };
            }

            return { success: true, user: safeUser };
        } catch (error) {
            return { success: false, message: this.getAuthErrorMessage(error) };
        }
    },

    async sendEmailLink(email) {
        await FirebaseService.init();

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            return { success: false, message: 'Please enter a valid email address' };
        }

        try {
            await FirebaseService.auth.sendSignInLinkToEmail(normalizedEmail, {
                url: window.location.href.split('#')[0],
                handleCodeInApp: true
            });

            window.localStorage.setItem(BOTANIKA.STORAGE_KEYS.EMAIL_LINK_EMAIL, normalizedEmail);
            return { success: true };
        } catch (error) {
            return { success: false, message: this.getAuthErrorMessage(error) };
        }
    },

    isEmailLinkSignIn(url = window.location.href) {
        return FirebaseService.auth ? FirebaseService.auth.isSignInWithEmailLink(url) : false;
    },

    async completeEmailLinkSignIn(email = null, url = window.location.href) {
        await FirebaseService.init();

        const storedEmail = window.localStorage.getItem(BOTANIKA.STORAGE_KEYS.EMAIL_LINK_EMAIL) || '';
        const targetEmail = (email || storedEmail).trim().toLowerCase();

        if (!targetEmail) {
            return { success: false, message: 'Enter your email to finish the sign-in link flow' };
        }

        try {
            const credentials = await FirebaseService.auth.signInWithEmailLink(targetEmail, url);
            window.localStorage.removeItem(BOTANIKA.STORAGE_KEYS.EMAIL_LINK_EMAIL);

            const safeUser = await FirebaseService.syncCurrentUserFromAuth(credentials.user);

            if (!safeUser) {
                return { success: false, message: 'Unable to load your Botanika profile' };
            }

            return { success: true, user: safeUser };
        } catch (error) {
            return { success: false, message: this.getAuthErrorMessage(error) };
        }
    },

    async updateProfile(userId, updates) {
        await FirebaseService.init();
        const nextUser = await FirebaseService.updateUserProfile(userId, updates);
        FirebaseService.emit('botanika:users-updated', this.getAll());
        return { success: true, user: nextUser ? FirebaseService.toSafeUser(nextUser) : null };
    },

    async delete(userId) {
        await FirebaseService.init();
        const currentUser = this.getCurrentUser();

        if (currentUser && currentUser.id === userId) {
            return { success: false, message: 'You cannot delete your own account' };
        }

        await FirebaseService.deleteUserProfile(userId);
        return { success: true };
    },

    async logout() {
        await FirebaseService.init();
        await FirebaseService.auth.signOut();
        FirebaseService.currentUser = null;
        SessionStore.remove(BOTANIKA.STORAGE_KEYS.CURRENT_USER);
    },

    async requestPasswordReset(email = null) {
        await FirebaseService.init();
        const targetEmail = (email || (this.getCurrentUser() && this.getCurrentUser().email) || '').trim().toLowerCase();

        if (!targetEmail) {
            return { success: false, message: 'No email address available for password reset' };
        }

        try {
            await FirebaseService.auth.sendPasswordResetEmail(targetEmail);
            return { success: true };
        } catch (error) {
            return { success: false, message: this.getAuthErrorMessage(error) };
        }
    },

    getAuthErrorMessage(error) {
        const code = error && error.code ? error.code : '';

        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            return 'Incorrect email or password';
        }

        if (code === 'auth/email-already-in-use') {
            return 'Email already registered';
        }

        if (code === 'auth/invalid-email') {
            return 'Please enter a valid email address';
        }

        if (code === 'auth/weak-password') {
            return 'Password must be at least 6 characters';
        }

        if (code === 'auth/popup-closed-by-user') {
            return 'Google sign-in was cancelled before it finished';
        }

        if (code === 'auth/account-exists-with-different-credential') {
            return 'That email already uses a different sign-in method';
        }

        if (code === 'auth/operation-not-allowed') {
            return 'This sign-in method is not enabled in Firebase Auth';
        }

        if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
            return 'This sign-in link is invalid or has expired';
        }

        return 'Something went wrong. Please try again.';
    }
};

const ProductManager = {
    init() {
        return FirebaseService.init();
    },

    getAll() {
        return [...FirebaseService.cache.products];
    },

    getFeatured(limit = 3) {
        const featured = this.getAll().filter(product => product.featured);
        const source = featured.length ? featured : this.getAll();
        return source.slice(0, limit);
    },

    getById(id) {
        return this.getAll().find(product => product.id === id) || null;
    },

    async add(productData) {
        await FirebaseService.init();
        const productId = generateId('prod');
        const product = await FirebaseService.saveProduct(productId, productData, true);
        return { success: true, product };
    },

    async update(id, productData) {
        await FirebaseService.init();
        const existingProduct = this.getById(id);

        if (!existingProduct) {
            return { success: false, message: 'Product not found' };
        }

        const product = await FirebaseService.saveProduct(id, {
            ...existingProduct,
            ...productData
        });

        return { success: true, product };
    },

    async delete(id) {
        await FirebaseService.init();

        if (!this.getById(id)) {
            return { success: false, message: 'Product not found' };
        }

        await FirebaseService.deleteProduct(id);
        return { success: true };
    }
};

const CartManager = {
    getCart() {
        const user = UserManager.getCurrentUser();

        if (!user) {
            return [];
        }

        return FirebaseService.cache.carts[user.id] || [];
    },

    async saveCart(cart) {
        await FirebaseService.init();
        const user = UserManager.getCurrentUser();

        if (!user) {
            return false;
        }

        await FirebaseService.saveCart(user.id, cart);
        this.pulseCartIcon();
        return true;
    },

    async addItem(productId, quantity = 1) {
        const cart = [...this.getCart()];
        const product = ProductManager.getById(productId);

        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        if (product.stock < 1) {
            return { success: false, message: 'Product out of stock' };
        }

        const existingIndex = cart.findIndex(item => item.productId === productId);

        if (existingIndex !== -1) {
            const nextQuantity = cart[existingIndex].quantity + quantity;

            if (nextQuantity > product.stock) {
                return { success: false, message: 'Not enough stock available' };
            }

            cart[existingIndex].quantity = nextQuantity;
        } else {
            cart.push({
                productId,
                quantity: Math.min(quantity, product.stock)
            });
        }

        await this.saveCart(cart);
        return { success: true, cart };
    },

    async updateQuantity(productId, quantity) {
        const cart = [...this.getCart()];
        const product = ProductManager.getById(productId);

        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        const index = cart.findIndex(item => item.productId === productId);

        if (index === -1) {
            return { success: false, message: 'Item not in cart' };
        }

        if (quantity < 1) {
            cart.splice(index, 1);
        } else if (quantity > product.stock) {
            return { success: false, message: 'Not enough stock' };
        } else {
            cart[index].quantity = quantity;
        }

        await this.saveCart(cart);
        return { success: true, cart };
    },

    async removeItem(productId) {
        const nextCart = this.getCart().filter(item => item.productId !== productId);
        await this.saveCart(nextCart);
        return { success: true, cart: nextCart };
    },

    async clear() {
        await this.saveCart([]);
        return { success: true };
    },

    getTotal() {
        return this.getCart().reduce((total, item) => {
            const product = ProductManager.getById(item.productId);
            return product ? total + (product.price * item.quantity) : total;
        }, 0);
    },

    getCount() {
        return this.getCart().reduce((total, item) => total + item.quantity, 0);
    },

    pulseCartIcon() {
        const cartBtn = document.getElementById('cartBtn');

        if (!cartBtn) {
            return;
        }

        cartBtn.classList.add('pulse');
        setTimeout(() => cartBtn.classList.remove('pulse'), 600);
    }
};

const OrderManager = {
    init() {
        return FirebaseService.init();
    },

    getAll() {
        return [...FirebaseService.cache.orders];
    },

    getForCurrentUser() {
        const user = UserManager.getCurrentUser();

        if (!user) {
            return [];
        }

        return this.getAll().filter(order => order.userId === user.id);
    },

    getRecentForCurrentUser(limit = 5) {
        return this.getForCurrentUser().slice(0, limit);
    },

    async checkout(details) {
        await FirebaseService.init();
        const user = UserManager.getCurrentUser();

        if (!user) {
            return { success: false, message: 'Please sign in to complete checkout' };
        }

        return FirebaseService.placeOrder(user.id, {
            ...details,
            customerName: details.customerName || user.name,
            customerEmail: user.email
        });
    }
};

const Toast = {
    show(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');

        if (!container) {
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cursor = 'pointer';

        const iconSvg = type === 'success'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        toast.addEventListener('click', () => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('removing');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    success(message) {
        this.show(message, 'success');
    },

    info(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    }
};

const PageTransition = {
    init() {
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');

            if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript')) {
                return;
            }

            link.addEventListener('click', event => {
                event.preventDefault();
                this.navigate(href);
            });
        });
    },

    navigate(url) {
        const transition = document.querySelector('.page-transition');

        if (!transition) {
            window.location.href = url;
            return;
        }

        transition.classList.add('active');
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    }
};

const FlyingProduct = {
    animate(productElement, imageUrl) {
        const cartBtn = document.getElementById('cartBtn');
        const flyingEl = document.getElementById('flyingProduct');

        if (!cartBtn || !flyingEl) {
            return;
        }

        const productRect = productElement.getBoundingClientRect();
        const cartRect = cartBtn.getBoundingClientRect();

        flyingEl.innerHTML = `<img src="${imageUrl}" alt="">`;
        flyingEl.style.left = `${productRect.left + (productRect.width / 2) - 30}px`;
        flyingEl.style.top = `${productRect.top}px`;

        const endX = cartRect.left + (cartRect.width / 2) - 30;
        const endY = cartRect.top + (cartRect.height / 2) - 30;

        flyingEl.style.setProperty('--end-x', `${endX - parseFloat(flyingEl.style.left)}px`);
        flyingEl.style.setProperty('--end-y', `${endY - parseFloat(flyingEl.style.top)}px`);
        flyingEl.classList.add('animate');
        flyingEl.style.opacity = '1';

        setTimeout(() => {
            flyingEl.classList.remove('animate');
            flyingEl.style.opacity = '0';
            flyingEl.innerHTML = '';
        }, 700);
    }
};

function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderAvatarMarkup(user, className = '') {
    if (user && user.avatar) {
        return `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name || 'User')}" class="${className}">`;
    }

    return `
        <svg ${className ? `class="${className}"` : ''} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>
    `;
}

function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.setAttribute('data-aos', 'fade-up');
    footer.setAttribute('data-aos-duration', '1000');

    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-column footer-brand" data-aos="fade-up" data-aos-delay="100">
                <a href="index.html" class="footer-logo">
                    <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2C13.5 4.5 17 7 17 11C17 15 14.5 18 12 22M12 2C10.5 4.5 7 7 7 11C7 15 9.5 18 12 22M12 2V22M5 9C7.5 9.5 10 11 12 14M19 9C16.5 9.5 14 11 12 14"/>
                    </svg>
                    <span>BOTANIKA</span>
                </a>
                <p class="footer-tagline">Bringing nature to modern living</p>
                <div class="footer-leaf-deco"></div>
            </div>

            <div class="footer-column footer-nav" data-aos="fade-up" data-aos-delay="200">
                <h4>Explore</h4>
                <nav class="footer-links">
                    <a href="shop.html">Shop</a>
                    <a href="shop.html">Collections</a>
                    <a href="about.html">About Us</a>
                    <a href="care.html">Care Guides</a>
                    <a href="#">Contact</a>
                </nav>
            </div>

            <div class="footer-column footer-newsletter" data-aos="fade-up" data-aos-delay="300">
                <h4>Stay Rooted</h4>
                <p>Receive seasonal updates and botanical wisdom</p>
                <form class="newsletter-form" onsubmit="event.preventDefault(); Toast.success('Thank you for subscribing.');">
                    <input type="email" placeholder="your@email.com" required>
                    <button type="submit">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </form>
            </div>
        </div>

        <div class="footer-bottom">
            <p class="copyright">© 2026 Botanika. Cultivated with care.</p>
            <div class="footer-plant-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M12 3v18M8 7c0 3 2 5 4 6M16 7c0 3-2 5-4 6M6 12c2 0 4 1 6 3M18 12c-2 0-4 1-6 3"/>
                </svg>
            </div>
            <div class="social-icons">
                <a href="#" aria-label="Facebook">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                </a>
                <a href="#" aria-label="Instagram">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="18" cy="6" r="1" fill="currentColor"/>
                    </svg>
                </a>
                <a href="#" aria-label="Pinterest">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v8M9 18c1-2 2-4 3-6"/>
                    </svg>
                </a>
            </div>
        </div>
    `;

    return footer;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await FirebaseService.init();
    } catch (error) {
        console.error(error);
        Toast.error('Firebase configuration is missing or invalid.');
    }

    PageTransition.init();

    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const count = CartManager.getCount();
        cartCount.textContent = count;
        if (count > 0) {
            cartCount.classList.add('visible');
        }
    }

    const pageTransitionEl = document.querySelector('.page-transition');
    if (pageTransitionEl) {
        const footerPlaceholder = document.querySelector('.footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.replaceWith(createFooter());
        } else if (!document.querySelector('.landing-page') && !document.querySelector('.site-footer')) {
            pageTransitionEl.before(createFooter());
        }
    }

    if (typeof AOS !== 'undefined') {
        AOS.init({
            offset: 120,
            duration: 800,
            easing: 'ease-out-cubic',
            once: false,
            mirror: true
        });
    }
});

BOTANIKA.ready = () => FirebaseService.init();

window.BOTANIKA = BOTANIKA;
window.SessionStore = SessionStore;
window.FirebaseService = FirebaseService;
window.UserManager = UserManager;
window.ProductManager = ProductManager;
window.CartManager = CartManager;
window.OrderManager = OrderManager;
window.Toast = Toast;
window.PageTransition = PageTransition;
window.FlyingProduct = FlyingProduct;
window.formatPrice = formatPrice;
window.generateId = generateId;
window.debounce = debounce;
window.escapeHtml = escapeHtml;
window.createFooter = createFooter;
window.renderAvatarMarkup = renderAvatarMarkup;
