document.addEventListener('DOMContentLoaded', async () => {
    const authContainer = document.querySelector('.auth-container');
    const registerPanel = document.getElementById('registerPanel');
    const loginPanel = document.getElementById('loginPanel');
    const showLoginBtn = document.getElementById('showLogin');
    const showRegisterBtn = document.getElementById('showRegister');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    try {
        await BOTANIKA.ready();
    } catch (error) {
        console.error(error);
        Toast.error('Firebase failed to start. Check your local config.');
        return;
    }

    if (UserManager.isLoggedIn()) {
        window.location.href = 'shop.html';
        return;
    }
    
    function showLogin() {
        authContainer.classList.add('show-login');
        loginForm.querySelector('input').focus();
    }
    
    function showRegister() {
        authContainer.classList.remove('show-login');
        registerForm.querySelector('input').focus();
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', showLogin);
    }
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', showRegister);
    }
    
    if (window.location.hash === '#login') {
        showLogin();
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const isAdmin = false;

            if (!name || name.length < 2) {
                Toast.error('Please enter a valid name');
                return;
            }

            if (!email || !isValidEmail(email)) {
                Toast.error('Please enter a valid email address');
                return;
            }

            if (!password || password.length < 6) {
                Toast.error('Password must be at least 6 characters');
                return;
            }

            if (password !== confirmPassword) {
                Toast.error('Passwords do not match');
                return;
            }

            const result = await UserManager.register(name, email, password, isAdmin);

            if (result.success) {
                Toast.success('Account created successfully!');
                setTimeout(() => {
                    PageTransition.navigate('shop.html');
                }, 1000);
            } else {
                Toast.error(result.message);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!email || !isValidEmail(email)) {
                Toast.error('Please enter a valid email address');
                return;
            }

            if (!password) {
                Toast.error('Please enter your password');
                return;
            }

            const result = await UserManager.login(email, password);

            if (result.success) {
                Toast.success(`Welcome back, ${result.user.name}!`);
                setTimeout(() => {
                    if (result.user.isAdmin) {
                        PageTransition.navigate('admin.html');
                    } else {
                        PageTransition.navigate('shop.html');
                    }
                }, 1000);
            } else {
                Toast.error(result.message);
            }
        });
    }
    
    const formGroups = document.querySelectorAll('.form-group');
    
    formGroups.forEach(group => {
        const input = group.querySelector('input, textarea');
        
        if (input) {
            input.addEventListener('focus', () => {
                group.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                group.classList.remove('focused');
                if (input.value) {
                    group.classList.add('has-value');
                } else {
                    group.classList.remove('has-value');
                }
            });
            
            if (input.value) {
                group.classList.add('has-value');
            }
        }
    });
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    const firstInput = document.querySelector('.auth-form input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 500);
    }
});