document.addEventListener('DOMContentLoaded', async () => {
    const authContainer = document.querySelector('.auth-container');
    const registerPanel = document.getElementById('registerPanel');
    const loginPanel = document.getElementById('loginPanel');
    const showLoginBtn = document.getElementById('showLogin');
    const showRegisterBtn = document.getElementById('showRegister');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const registerGoogleBtn = document.getElementById('registerGoogleBtn');
    const loginGoogleBtn = document.getElementById('loginGoogleBtn');
    const registerMagicLinkBtn = document.getElementById('registerMagicLinkBtn');
    const loginMagicLinkBtn = document.getElementById('loginMagicLinkBtn');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const emailLinkBanner = document.getElementById('emailLinkBanner');
    const emailLinkCompleteForm = document.getElementById('emailLinkCompleteForm');
    const emailLinkConfirmEmail = document.getElementById('emailLinkConfirmEmail');

    try {
        await BOTANIKA.ready();
    } catch (error) {
        console.error(error);
        Toast.error('Firebase failed to start. Check your local config.');
        return;
    }

    const isEmailLinkFlow = UserManager.isEmailLinkSignIn(window.location.href);

    if (UserManager.isLoggedIn() && !isEmailLinkFlow) {
        redirectUser(UserManager.getCurrentUser());
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

    function redirectUser(user) {
        setTimeout(() => {
            if (user.isAdmin) {
                PageTransition.navigate('admin.html');
            } else {
                PageTransition.navigate('shop.html');
            }
        }, 1000);
    }

    function getStoredEmailLinkAddress() {
        return (window.localStorage.getItem(BOTANIKA.STORAGE_KEYS.EMAIL_LINK_EMAIL) || '').trim().toLowerCase();
    }

    function toggleEmailLinkBanner(visible) {
        if (!emailLinkBanner) {
            return;
        }

        emailLinkBanner.classList.toggle('hidden', !visible);
    }

    async function handleGoogleLogin() {
        const result = await UserManager.loginWithGoogle();

        if (result.success) {
            Toast.success(`Welcome, ${result.user.name}!`);
            redirectUser(result.user);
            return;
        }

        Toast.error(result.message);
    }

    async function handleMagicLink(email) {
        if (!email || !isValidEmail(email)) {
            Toast.error('Enter a valid email before requesting a sign-in link');
            return;
        }

        const result = await UserManager.sendEmailLink(email);

        if (result.success) {
            toggleEmailLinkBanner(true);
            if (emailLinkConfirmEmail) {
                emailLinkConfirmEmail.value = email.trim().toLowerCase();
                emailLinkConfirmEmail.dispatchEvent(new Event('blur'));
            }
            Toast.success('Magic link sent. Open it from your email to finish signing in.');
            return;
        }

        Toast.error(result.message);
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

    if (registerGoogleBtn) {
        registerGoogleBtn.addEventListener('click', handleGoogleLogin);
    }

    if (loginGoogleBtn) {
        loginGoogleBtn.addEventListener('click', handleGoogleLogin);
    }

    if (registerMagicLinkBtn) {
        registerMagicLinkBtn.addEventListener('click', () => {
            handleMagicLink(document.getElementById('regEmail').value.trim());
        });
    }

    if (loginMagicLinkBtn) {
        loginMagicLinkBtn.addEventListener('click', () => {
            handleMagicLink(document.getElementById('loginEmail').value.trim());
        });
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();

            if (!email || !isValidEmail(email)) {
                Toast.error('Enter your email first so we know where to send the reset link');
                return;
            }

            const result = await UserManager.requestPasswordReset(email);

            if (result.success) {
                Toast.success('Password reset email sent. Check your inbox.');
                return;
            }

            Toast.error(result.message);
        });
    }

    if (emailLinkCompleteForm) {
        emailLinkCompleteForm.addEventListener('submit', async e => {
            e.preventDefault();

            const email = emailLinkConfirmEmail.value.trim();

            if (!email || !isValidEmail(email)) {
                Toast.error('Please confirm the email address that received your sign-in link');
                return;
            }

            const result = await UserManager.completeEmailLinkSignIn(email, window.location.href);

            if (result.success) {
                Toast.success(`Welcome, ${result.user.name}!`);
                toggleEmailLinkBanner(false);
                redirectUser(result.user);
                return;
            }

            Toast.error(result.message);
        });
    }

    if (isEmailLinkFlow) {
        showLogin();
        toggleEmailLinkBanner(true);

        const storedEmail = getStoredEmailLinkAddress();
        if (emailLinkConfirmEmail && storedEmail) {
            emailLinkConfirmEmail.value = storedEmail;
            emailLinkConfirmEmail.dispatchEvent(new Event('blur'));
        }
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
                redirectUser(result.user);
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
                redirectUser(result.user);
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