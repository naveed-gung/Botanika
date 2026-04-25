
document.addEventListener('DOMContentLoaded', async () => {
    
    
    
    
    
    
    const productForm = document.getElementById('productForm');
    const productId = document.getElementById('productId');
    const productName = document.getElementById('productName');
    const productCategory = document.getElementById('productCategory');
    const productPrice = document.getElementById('productPrice');
    const productStock = document.getElementById('productStock');
    const productDescription = document.getElementById('productDescription');
    const productImage = document.getElementById('productImage');
    const productFeatured = document.getElementById('productFeatured');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const cancelBtn = document.getElementById('cancelBtn');
    
    
    const imageDropZone = document.getElementById('imageDropZone');
    const dropPlaceholder = document.getElementById('dropPlaceholder');
    const dropText = document.getElementById('dropText');
    const dropHint = document.getElementById('dropHint');
    const imagePreviewContent = document.getElementById('imagePreviewContent');
    const previewImg = document.getElementById('previewImg');
    const clearImageBtn = document.getElementById('clearImageBtn');
    const deviceImageInput = document.getElementById('deviceImageInput');
    const urlInputWrapper = document.getElementById('urlInputWrapper');
    
    
    const productsList = document.getElementById('productsList');
    const productCount = document.getElementById('productCount');
    const adminEmpty = document.getElementById('adminEmpty');
    const inventorySearch = document.getElementById('inventorySearch');
    const inventoryCategoryFilter = document.getElementById('inventoryCategoryFilter');
    const inventoryFilterGroup = document.getElementById('inventoryFilterGroup');
    const inventoryResults = document.getElementById('inventoryResults');
    const usersList = document.getElementById('usersList');
    
    
    const dashboardUserName = document.getElementById('dashboardUserName');
    const totalRevenue = document.getElementById('totalRevenue');
    const totalProducts = document.getElementById('totalProducts');
    const totalUsers = document.getElementById('totalUsers');
    const totalStock = document.getElementById('totalStock');
    const stockStatus = document.getElementById('stockStatus');
    const outOfStock = document.getElementById('outOfStock');
    const lowStock = document.getElementById('lowStock');
    const categoryCount = document.getElementById('categoryCount');
    const avgPrice = document.getElementById('avgPrice');
    const taxEstimate = document.getElementById('taxEstimate');
    
    
    const deleteModal = document.getElementById('deleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    
    const adminUserName = document.getElementById('adminUserName');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    
    
    let editingProductId = null;
    let deletingProductId = null;
    let deletingUserId = null;
    let currentUploadTab = 'url';
    let uploadedImageData = null;
    let currentUser = null;
    const inventoryFilters = {
        search: '',
        category: 'all',
        stock: 'all'
    };

    // Profile panel refs
    const profileAvatar     = document.getElementById('profileAvatar');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImageTrigger = document.getElementById('profileImageTrigger');
    const profileNameInput  = document.getElementById('profileNameInput');
    const profileEmailInput = document.getElementById('profileEmailInput');
    const profilePhoneInput = document.getElementById('profilePhoneInput');
    const profilePasswordInput = document.getElementById('profilePasswordInput');
    const saveProfileBtn    = document.getElementById('saveProfileBtn');
    const removeAvatarBtn   = document.getElementById('removeAvatarBtn');

    try {
        await BOTANIKA.ready();
    } catch (error) {
        console.error(error);
        Toast.error('Firebase failed to start. Check your local config.');
        return;
    }

    currentUser = UserManager.getCurrentUser();

    if (!currentUser || !currentUser.isAdmin) {
        Toast.error('Access denied. Admin privileges required.');
        setTimeout(() => {
            PageTransition.navigate('shop.html');
        }, 1500);
        return;
    }
    
    
    
    
    
    async function init() {
        if (adminUserName) {
            adminUserName.textContent = currentUser.name;
        }
        if (dashboardUserName) {
            dashboardUserName.textContent = currentUser.name;
        }

        try {
            const seedSummary = await FirebaseService.ensureDemoDataset();

            if (seedSummary.createdProducts || seedSummary.createdUsers || seedSummary.createdOrders) {
                Toast.success(`Demo data ready: ${seedSummary.createdProducts} products, ${seedSummary.createdUsers} users, ${seedSummary.createdOrders} orders.`);
            }

            if (Array.isArray(seedSummary.warnings) && seedSummary.warnings.length) {
                Toast.error(seedSummary.warnings[0]);
            }
        } catch (error) {
            console.error(error);
            Toast.error('Demo data seed could not finish. Check Firebase Auth and Firestore rules.');
        }
        
        loadDashboardStats();
        loadProducts();
        loadUsers();
        loadAdminProfile();
        
        setupEventListeners();
        setupImageUpload();
        setupProfilePanel();
        bindRealtimeListeners();
    }
    
    function setupEventListeners() {
        
        if (productForm) {
            productForm.addEventListener('submit', handleFormSubmit);
        }
        
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', resetForm);
        }
        
        
        if (productImage) {
            productImage.addEventListener('input', debounce(handleUrlImagePreview, 500));
        }
        
        
        if (cancelDelete) {
            cancelDelete.addEventListener('click', closeDeleteModal);
        }
        
        if (confirmDelete) {
            confirmDelete.addEventListener('click', handleConfirmDelete);
        }
        
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    closeDeleteModal();
                }
            });
        }
        
        
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', handleLogout);
        }

        if (inventorySearch) {
            inventorySearch.addEventListener('input', event => {
                inventoryFilters.search = event.target.value.trim().toLowerCase();
                loadProducts();
            });
        }

        if (inventoryCategoryFilter) {
            inventoryCategoryFilter.addEventListener('change', event => {
                inventoryFilters.category = event.target.value;
                loadProducts();
            });
        }

        if (inventoryFilterGroup) {
            inventoryFilterGroup.addEventListener('click', event => {
                const chip = event.target.closest('.inventory-filter-chip');

                if (!chip) {
                    return;
                }

                inventoryFilters.stock = chip.dataset.filter || 'all';
                inventoryFilterGroup.querySelectorAll('.inventory-filter-chip').forEach(button => {
                    button.classList.toggle('active', button === chip);
                });
                loadProducts();
            });
        }
        
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deleteModal?.classList.contains('active')) {
                closeDeleteModal();
            }
        });
    }

    function bindRealtimeListeners() {
        document.addEventListener('botanika:products-updated', () => {
            loadDashboardStats();
            loadProducts();
        });

        document.addEventListener('botanika:users-updated', () => {
            loadDashboardStats();
            loadUsers();
        });

        document.addEventListener('botanika:user-changed', () => {
            const user = UserManager.getCurrentUser();

            if (!user || !user.isAdmin) {
                PageTransition.navigate('auth.html');
                return;
            }

            currentUser = user;
        });
    }
    
    
    
    
    
    function loadDashboardStats() {
        const products = ProductManager.getAll();
        const users = UserManager.getAll();
        
        
        const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
        const outOfStockCount = products.filter(p => p.stock === 0).length;
        const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
        const categories = [...new Set(products.map(p => p.category))];
        const averagePrice = products.length > 0 
            ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
            : 0;
        const taxEst = inventoryValue * 0.08;
        
        
        if (totalRevenue) totalRevenue.textContent = formatPrice(inventoryValue);
        if (totalProducts) totalProducts.textContent = products.length;
        if (totalUsers) totalUsers.textContent = users.length;
        if (totalStock) totalStock.textContent = totalStockUnits.toLocaleString();
        if (stockStatus) {
            if (outOfStockCount > 0) {
                stockStatus.textContent = `${outOfStockCount} items need restock`;
                stockStatus.className = 'stat-change negative';
            } else {
                stockStatus.textContent = 'units available';
                stockStatus.className = 'stat-change neutral';
            }
        }
        if (outOfStock) outOfStock.textContent = outOfStockCount;
        if (lowStock) lowStock.textContent = lowStockCount;
        if (categoryCount) categoryCount.textContent = categories.length;
        if (avgPrice) avgPrice.textContent = formatPrice(averagePrice);
        if (taxEstimate) taxEstimate.textContent = formatPrice(taxEst);
        
        
        const outOfStockCard = document.getElementById('outOfStockCard');
        const lowStockCard = document.getElementById('lowStockCard');
        
        if (outOfStockCard) {
            outOfStockCard.style.borderLeft = outOfStockCount > 0 
                ? '3px solid #e6a23c' 
                : 'none';
        }
        if (lowStockCard) {
            lowStockCard.style.borderLeft = lowStockCount > 0 
                ? '3px solid var(--color-terracotta)' 
                : 'none';
        }
    }
    
    
    
    
    
    function setupImageUpload() {
        const uploadTabs = document.querySelectorAll('.upload-tab');
        
        
        uploadTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                currentUploadTab = tabType;
                
                
                uploadTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                
                if (tabType === 'url') {
                    if (urlInputWrapper) urlInputWrapper.classList.remove('hidden');
                    if (imageDropZone) imageDropZone.classList.remove('active');
                    if (dropText) dropText.textContent = 'Image preview will appear here';
                    if (dropHint) dropHint.textContent = 'Enter URL above';
                } else {
                    if (urlInputWrapper) urlInputWrapper.classList.add('hidden');
                    if (imageDropZone) imageDropZone.classList.add('active');
                    if (dropText) dropText.textContent = 'Click or drag image here';
                    if (dropHint) dropHint.textContent = 'JPG, PNG, GIF, WebP (Max 1MB)';
                }
            });
        });
        
        
        if (imageDropZone) {
            imageDropZone.addEventListener('click', (e) => {
                if (currentUploadTab === 'device' && !e.target.closest('.clear-image-btn')) {
                    deviceImageInput?.click();
                }
            });
            
            
            imageDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (currentUploadTab === 'device') {
                    imageDropZone.classList.add('dragover');
                }
            });
            
            imageDropZone.addEventListener('dragleave', () => {
                imageDropZone.classList.remove('dragover');
            });
            
            imageDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                imageDropZone.classList.remove('dragover');
                
                if (currentUploadTab === 'device') {
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        handleDeviceImageUpload(files[0]);
                    }
                }
            });
        }
        
        
        if (deviceImageInput) {
            deviceImageInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleDeviceImageUpload(e.target.files[0]);
                }
            });
        }
        
        
        if (clearImageBtn) {
            clearImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clearImagePreview();
            });
        }
    }
    
    function handleUrlImagePreview() {
        const url = productImage?.value.trim();
        
        if (!url) {
            clearImagePreview();
            return;
        }
        
        
        const img = new Image();
        img.onload = () => {
            showImagePreview(url);
        };
        img.onerror = () => {
            clearImagePreview();
        };
        img.src = url;
    }
    
    function handleDeviceImageUpload(file) {
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Toast.error('Please upload a valid image file (JPG, PNG, GIF, WebP)');
            return;
        }
        
        
        if (file.size > 1024 * 1024) {
            Toast.error('Image size must be 1MB or less');
            return;
        }
        
        
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageData = e.target.result;
            showImagePreview(uploadedImageData);
            Toast.success('Image uploaded successfully');
        };
        reader.onerror = () => {
            Toast.error('Failed to read image file');
        };
        reader.readAsDataURL(file);
    }
    
    function showImagePreview(src) {
        if (previewImg) previewImg.src = src;
        if (imagePreviewContent) imagePreviewContent.style.display = 'block';
        if (dropPlaceholder) dropPlaceholder.style.display = 'none';
    }
    
    function clearImagePreview() {
        uploadedImageData = null;
        if (previewImg) previewImg.src = '';
        if (imagePreviewContent) imagePreviewContent.style.display = 'none';
        if (dropPlaceholder) dropPlaceholder.style.display = 'flex';
        if (deviceImageInput) deviceImageInput.value = '';
        if (currentUploadTab === 'url' && productImage) {
            productImage.value = '';
        }
    }
    
    
    
    
    
    function loadProducts() {
        const products = ProductManager.getAll();
        const filteredProducts = applyInventoryFilters(products);

        populateCategoryFilter(products);
        
        
        if (productCount) {
            productCount.textContent = `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`;
        }

        if (inventoryResults) {
            inventoryResults.textContent = filteredProducts.length === products.length
                ? `Showing all ${products.length} product${products.length !== 1 ? 's' : ''}`
                : `Showing ${filteredProducts.length} of ${products.length} product${products.length !== 1 ? 's' : ''}`;
        }
        
        
        if (filteredProducts.length === 0) {
            if (productsList) productsList.style.display = 'none';
            if (adminEmpty) adminEmpty.style.display = 'flex';
            const emptyTitle = adminEmpty?.querySelector('h3');
            const emptyCopy = adminEmpty?.querySelector('p');

            if (products.length === 0) {
                if (emptyTitle) emptyTitle.textContent = 'No products yet';
                if (emptyCopy) emptyCopy.textContent = 'Start by adding your first product';
            } else {
                if (emptyTitle) emptyTitle.textContent = 'No matching products';
                if (emptyCopy) emptyCopy.textContent = 'Try a different search or filter combination.';
            }
            return;
        }
        
        if (productsList) productsList.style.display = 'grid';
        if (adminEmpty) adminEmpty.style.display = 'none';
        
        renderProducts(filteredProducts);
    }

    function populateCategoryFilter(products) {
        if (!inventoryCategoryFilter) {
            return;
        }

        const categories = [...new Set(products.map(product => product.category).filter(Boolean))].sort((left, right) => left.localeCompare(right));
        const options = ['<option value="all">All categories</option>']
            .concat(categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`));

        inventoryCategoryFilter.innerHTML = options.join('');
        inventoryCategoryFilter.value = categories.includes(inventoryFilters.category) ? inventoryFilters.category : 'all';

        if (inventoryCategoryFilter.value === 'all') {
            inventoryFilters.category = 'all';
        }
    }

    function applyInventoryFilters(products) {
        return products.filter(product => {
            const searchTarget = `${product.name} ${product.category} ${product.description}`.toLowerCase();
            const matchesSearch = !inventoryFilters.search || searchTarget.includes(inventoryFilters.search);
            const matchesCategory = inventoryFilters.category === 'all' || product.category === inventoryFilters.category;

            let matchesStock = true;

            if (inventoryFilters.stock === 'featured') {
                matchesStock = Boolean(product.featured);
            }

            if (inventoryFilters.stock === 'low-stock') {
                matchesStock = product.stock > 0 && product.stock <= 5;
            }

            if (inventoryFilters.stock === 'out-of-stock') {
                matchesStock = product.stock === 0;
            }

            return matchesSearch && matchesCategory && matchesStock;
        });
    }
    
    function renderProducts(products) {
        if (!productsList) return;
        
        productsList.innerHTML = products.map(product => `
            <div class="admin-product-card" data-product-id="${product.id}">
                <div class="admin-product-image">
                    <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23E6DFD3%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238A9A5B%22 font-size=%2210%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                    ${product.featured ? '<span class="featured-chip">Featured</span>' : ''}
                </div>
                <div class="admin-product-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    <div class="admin-product-meta">
                        <span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                            ${formatPrice(product.price)}
                        </span>
                        <span class="${product.stock === 0 ? 'out-of-stock' : product.stock <= 5 ? 'low-stock' : ''}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            </svg>
                            ${product.stock === 0 ? 'Out of stock' : product.stock + ' in stock'}
                        </span>
                    </div>
                    <div class="admin-product-actions">
                        <button class="edit-btn" data-product-id="${product.id}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                        </button>
                        <button class="delete-btn" data-product-id="${product.id}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        attachProductListeners();
    }
    
    function attachProductListeners() {
        
        document.querySelectorAll('.admin-product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.admin-product-actions')) return;
                const productId = card.dataset.productId;
                PageTransition.navigate(`plant-detail.html?id=${productId}`);
            });
            card.style.cursor = 'pointer';
        });
        
        document.querySelectorAll('.admin-product-card .edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                editProduct(productId);
            });
        });
        
        
        document.querySelectorAll('.admin-product-card .delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                openDeleteModal(productId, 'product');
            });
        });
    }
    
    
    
    
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        
        let imageSource = '';
        if (currentUploadTab === 'device' && uploadedImageData) {
            imageSource = uploadedImageData;
        } else {
            imageSource = productImage.value.trim();
        }
        
        const formData = {
            name: productName.value.trim(),
            category: productCategory.value.trim(),
            price: parseFloat(productPrice.value),
            stock: parseInt(productStock.value),
            description: productDescription.value.trim(),
            image: imageSource,
            featured: Boolean(productFeatured && productFeatured.checked)
        };
        
        
        if (!formData.name || formData.name.length < 2) {
            Toast.error('Please enter a valid product name');
            productName.focus();
            return;
        }
        
        if (!formData.category) {
            Toast.error('Please enter a category');
            productCategory.focus();
            return;
        }
        
        if (isNaN(formData.price) || formData.price < 0) {
            Toast.error('Please enter a valid price');
            productPrice.focus();
            return;
        }
        
        if (isNaN(formData.stock) || formData.stock < 0) {
            Toast.error('Please enter a valid stock quantity');
            productStock.focus();
            return;
        }
        
        if (!formData.description) {
            Toast.error('Please enter a description');
            productDescription.focus();
            return;
        }
        
        if (!formData.image) {
            Toast.error('Please provide an image (URL or upload)');
            return;
        }
        
        
        if (currentUploadTab === 'url' && !isValidUrl(formData.image) && !formData.image.startsWith('data:image')) {
            Toast.error('Please enter a valid image URL');
            productImage.focus();
            return;
        }
        
        
        if (editingProductId) {
            const result = await ProductManager.update(editingProductId, formData);
            
            if (result.success) {
                Toast.success('Product updated successfully');
                resetForm();
                loadProducts();
                loadDashboardStats();
            } else {
                Toast.error(result.message);
            }
        } else {
            const result = await ProductManager.add(formData);
            
            if (result.success) {
                Toast.success('Product added successfully');
                resetForm();
                loadProducts();
                loadDashboardStats();
            } else {
                Toast.error(result.message);
            }
        }
    }
    
    function editProduct(id) {
        const product = ProductManager.getById(id);
        
        if (!product) {
            Toast.error('Product not found');
            return;
        }
        
        editingProductId = id;
        
        
        if (formTitle) formTitle.textContent = 'Edit Product';
        if (formSubtitle) formSubtitle.textContent = 'Update the product details';
        if (submitBtnText) submitBtnText.textContent = 'Update Product';
        if (submitBtn) {
            submitBtn.querySelector('svg').innerHTML = '<path d="M20 6L9 17l-5-5"/>';
        }
        if (cancelBtn) cancelBtn.style.display = 'flex';
        
        
        if (productId) productId.value = product.id;
        if (productName) productName.value = product.name;
        if (productCategory) productCategory.value = product.category;
        if (productPrice) productPrice.value = product.price;
        if (productStock) productStock.value = product.stock;
        if (productDescription) productDescription.value = product.description;
        if (productFeatured) productFeatured.checked = Boolean(product.featured);
        
        
        if (product.image.startsWith('data:image')) {
            
            uploadedImageData = product.image;
            currentUploadTab = 'device';
            
            document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.upload-tab[data-tab="device"]')?.classList.add('active');
            
            if (urlInputWrapper) urlInputWrapper.classList.add('hidden');
            if (imageDropZone) imageDropZone.classList.add('active');
            if (productImage) productImage.value = '';
        } else {
            
            if (productImage) productImage.value = product.image;
            currentUploadTab = 'url';
            
            document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.upload-tab[data-tab="url"]')?.classList.add('active');
            
            if (urlInputWrapper) urlInputWrapper.classList.remove('hidden');
            if (imageDropZone) imageDropZone.classList.remove('active');
        }
        
        showImagePreview(product.image);
        
        
        document.querySelectorAll('.product-form .form-group').forEach(group => {
            group.classList.add('editing');
        });
        
        
        document.querySelector('.product-form-card')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        productName.focus();
    }
    
    function resetForm() {
        editingProductId = null;
        
        
        if (formTitle) formTitle.textContent = 'Add New Product';
        if (formSubtitle) formSubtitle.textContent = 'Fill in the details below';
        if (submitBtnText) submitBtnText.textContent = 'Add Product';
        if (submitBtn) {
            submitBtn.querySelector('svg').innerHTML = '<path d="M12 5v14M5 12h14"/>';
        }
        if (cancelBtn) cancelBtn.style.display = 'none';
        
        
        if (productForm) productForm.reset();
        if (productId) productId.value = '';
        if (productFeatured) productFeatured.checked = false;
        
        
        clearImagePreview();
        
        
        currentUploadTab = 'url';
        document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.upload-tab[data-tab="url"]')?.classList.add('active');
        if (urlInputWrapper) urlInputWrapper.classList.remove('hidden');
        if (imageDropZone) imageDropZone.classList.remove('active');
        if (dropText) dropText.textContent = 'Image preview will appear here';
        if (dropHint) dropHint.textContent = 'Enter URL above';
        
        
        document.querySelectorAll('.product-form .form-group').forEach(group => {
            group.classList.remove('editing');
        });
    }
    
    
    
    
    
    function loadUsers() {
        const users = UserManager.getAll();
        renderUsers(users);
    }
    
    function renderUsers(users) {
        if (!usersList) return;
        
        usersList.innerHTML = users.map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-avatar-thumb">
                    ${renderAvatarMarkup(user, 'user-avatar-img')}
                </div>
                <div class="user-info">
                    <span class="user-name">${escapeHtml(user.name)}</span>
                    <span class="user-email">${escapeHtml(user.email)}</span>
                </div>
                <span class="user-role ${user.isAdmin ? 'admin' : 'user'}">
                    ${user.isAdmin ? 'Admin' : 'User'}
                </span>
                ${user.id !== currentUser.id ? `
                    <button class="delete-user-btn" data-user-id="${user.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `).join('');
        
        
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.userId;
                openDeleteModal(userId, 'user');
            });
        });
    }
    
    
    
    
    
    function openDeleteModal(id, type) {
        if (type === 'product') {
            deletingProductId = id;
            deletingUserId = null;
        } else {
            deletingUserId = id;
            deletingProductId = null;
        }
        
        
        const modalContent = deleteModal?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.querySelector('h3').textContent = type === 'product' ? 'Delete Product?' : 'Delete User?';
            modalContent.querySelector('p').textContent = 'This action cannot be undone.';
        }
        
        if (deleteModal) deleteModal.classList.add('active');
    }
    
    function closeDeleteModal() {
        if (deleteModal) deleteModal.classList.remove('active');
        deletingProductId = null;
        deletingUserId = null;
    }
    
    async function handleConfirmDelete() {
        if (deletingProductId) {
            const result = await ProductManager.delete(deletingProductId);
            
            if (result.success) {
                Toast.success('Product deleted successfully');
                loadProducts();
                loadDashboardStats();
            } else {
                Toast.error('Failed to delete product');
            }
        } else if (deletingUserId) {
            const result = await UserManager.delete(deletingUserId);
            
            if (result.success) {
                Toast.success('User deleted successfully');
                loadUsers();
                loadDashboardStats();
            } else {
                Toast.error(result.message || 'Failed to delete user');
            }
        }
        
        closeDeleteModal();
    }
    
    
    
    
    
    async function handleLogout() {
        await UserManager.logout();
        Toast.success('You have been logged out');
        setTimeout(() => {
            PageTransition.navigate('index.html');
        }, 1000);
    }





    // ─── Admin Profile Panel ───────────────────────────────────────────────────

    function loadAdminProfile() {
        if (!currentUser) return;
        if (profileNameInput)  profileNameInput.value  = currentUser.name  || '';
        if (profileEmailInput) profileEmailInput.value = currentUser.email || '';
        if (profilePhoneInput) profilePhoneInput.value = currentUser.phone || '';
        renderAdminAvatar();
    }

    function renderAdminAvatar() {
        if (!profileAvatar) return;
        profileAvatar.innerHTML = renderAvatarMarkup(currentUser, 'avatar-image');
        // Show/hide Remove Photo button
        if (removeAvatarBtn) {
            removeAvatarBtn.style.display = currentUser && currentUser.avatar ? 'inline-flex' : 'none';
        }
    }

    function setupProfilePanel() {
        if (profileImageTrigger && profileImageInput) {
            profileImageTrigger.addEventListener('click', () => profileImageInput.click());
            profileImageInput.addEventListener('change', handleAdminAvatarChange);
        }
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', handleAdminSaveProfile);
        }
        if (removeAvatarBtn) {
            removeAvatarBtn.addEventListener('click', async () => {
                const result = await UserManager.updateProfile(currentUser.id, { avatar: '' });
                if (!result.success) { Toast.error('Failed to remove photo'); return; }
                currentUser = UserManager.getCurrentUser();
                renderAdminAvatar();
                Toast.success('Profile photo removed');
            });
        }
    }

    async function handleAdminAvatarChange(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Toast.error('Please choose an image file');
            event.target.value = '';
            return;
        }
        if (file.size > 1024 * 1024) {
            Toast.error('Image size must be 1 MB or less');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async loadEvent => {
            const avatar = loadEvent.target && typeof loadEvent.target.result === 'string'
                ? loadEvent.target.result : '';
            if (!avatar) { Toast.error('Failed to read image'); return; }

            const result = await UserManager.updateProfile(currentUser.id, { avatar });
            if (!result.success) { Toast.error('Failed to update profile photo'); return; }

            currentUser = UserManager.getCurrentUser();
            renderAdminAvatar();
            Toast.success('Profile photo updated');
        };
        reader.onerror = () => Toast.error('Failed to read image');
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    async function handleAdminSaveProfile() {
        const name     = profileNameInput  ? profileNameInput.value.trim()  : '';
        const email    = profileEmailInput ? profileEmailInput.value.trim() : '';
        const phone    = profilePhoneInput ? profilePhoneInput.value.trim() : '';
        const password = profilePasswordInput ? profilePasswordInput.value  : '';

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
            Toast.error('Failed to update profile');
            return;
        }

        try {
            const authUser = firebase.auth().currentUser;
            if (authUser) {
                if (email && email !== authUser.email) await authUser.updateEmail(email);
                if (password) await authUser.updatePassword(password);
            }
        } catch (err) {
            Toast.error('Profile saved, but auth update failed: ' + err.message);
        }

        currentUser = UserManager.getCurrentUser();
        if (adminUserName) adminUserName.textContent = currentUser.name;
        if (dashboardUserName) dashboardUserName.textContent = currentUser.name;
        if (profilePasswordInput) profilePasswordInput.value = '';
        Toast.success('Profile updated');
    }
    
    
    
    
    
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    
    
    
    
    init().catch(error => {
        console.error(error);
        Toast.error('Admin dashboard failed to finish loading.');
    });
});
