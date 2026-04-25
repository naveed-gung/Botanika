document.addEventListener('DOMContentLoaded', async () => {
    AOS.init({
        offset: 120,
        duration: 800,
        easing: 'ease-out-cubic',
        once: false,
        mirror: true
    });

    try {
        await BOTANIKA.ready();
        
        const user = UserManager.getCurrentUser();
        const landingNav = document.getElementById('landingNav');
        
        if (user && landingNav) {
            landingNav.innerHTML = `
                <a href="shop.html" class="nav-link">Shop</a>
                <a href="${user.isAdmin ? 'admin.html' : 'user.html'}" class="user-badge" style="display:flex; align-items:center; gap:0.5rem; text-decoration:none; color:var(--color-charcoal); font-weight:500;">
                    ${user.avatar 
                        ? `<img src="${escapeHtml(user.avatar)}" alt="" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">` 
                        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
                    <span>${escapeHtml(user.name)}</span>
                </a>
            `;
        }
    } catch (error) {
        console.error(error);
    }
    
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const landingNav = document.getElementById('landingNav');
    
    if (mobileMenuBtn && landingNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            landingNav.classList.toggle('active');
            document.body.style.overflow = landingNav.classList.contains('active') ? 'hidden' : '';
        });
        
        
        landingNav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                landingNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        
        document.addEventListener('click', (e) => {
            if (!landingNav.contains(e.target) && !mobileMenuBtn.contains(e.target) && landingNav.classList.contains('active')) {
                mobileMenuBtn.classList.remove('active');
                landingNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    const hero = document.querySelector('.hero');
    const botanicalIllustration = document.querySelector('.botanical-illustration');
    const floatingLeaves = document.querySelector('.floating-leaves');
    const delicateStems = document.querySelector('.delicate-stems');
    
    if (hero && botanicalIllustration) {
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const offsetX = (mouseX - centerX) / centerX;
            const offsetY = (mouseY - centerY) / centerY;
            
            if (floatingLeaves) {
                floatingLeaves.style.transform = `translate(${offsetX * 15}px, ${offsetY * 15}px)`;
            }
            
            if (delicateStems) {
                delicateStems.style.transform = `translate(${offsetX * 8}px, ${offsetY * 8}px)`;
            }
        });
        
        hero.addEventListener('mouseleave', () => {
            if (floatingLeaves) {
                floatingLeaves.style.transform = 'translate(0, 0)';
            }
            if (delicateStems) {
                delicateStems.style.transform = 'translate(0, 0)';
            }
        });
    }

    const ctaButtons = document.querySelectorAll('.hero-cta .btn');
    ctaButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
    });

    const plantIcons = document.querySelectorAll('.plant-icon');
    plantIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.2)';
            icon.style.opacity = '1';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)';
            icon.style.opacity = '0.5';
        });
    });

    function renderFeaturedProducts() {
        const grid = document.getElementById('featuredGrid');
        if (!grid) return;

        const products = ProductManager.getFeatured(3);
        
        if (products.length === 0) return;
        
        grid.innerHTML = products.map((product, index) => `
            <a href="shop.html" class="featured-card" data-aos="fade-up" data-aos-delay="${100 + (index * 100)}">
                <div class="featured-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <div class="featured-overlay">
                        <span>View in Shop</span>
                    </div>
                </div>
                <div class="featured-info">
                    <span class="featured-category">${product.category}</span>
                    <h3 class="featured-name">${product.name}</h3>
                    <span class="featured-price">${formatPrice(product.price)}</span>
                </div>
            </a>
        `).join('');
        
        AOS.refresh();
    }
    
    renderFeaturedProducts();

    const shopLink = document.querySelector('a[href="shop.html"]');
    if (shopLink) {
        shopLink.addEventListener('mouseenter', () => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = 'shop.html';
            document.head.appendChild(link);
        }, { once: true });
    }

    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const featured = document.getElementById('featured');
            if (featured) {
                featured.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});