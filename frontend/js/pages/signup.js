// Signup Page

const SignupPage = {
    render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">
                        <h1>Social Sync</h1>
                        <p style="color: var(--text-secondary); font-size: 17px; font-weight: 600; margin-top: 8px; text-align: center;">
                            Sign up to see photos and videos from your friends.
                        </p>
                    </div>

                    <form id="signup-form" class="auth-form" style="margin-top: 24px;">
                        <div class="form-group">
                            <input 
                                type="email" 
                                id="email" 
                                class="form-input" 
                                placeholder="Email"
                                required
                            />
                            <div class="form-error" id="email-error"></div>
                        </div>

                        <div class="form-group">
                            <input 
                                type="text" 
                                id="fullName" 
                                class="form-input" 
                                placeholder="Full Name"
                                required
                            />
                            <div class="form-error" id="fullName-error"></div>
                        </div>

                        <div class="form-group">
                            <input 
                                type="text" 
                                id="username" 
                                class="form-input" 
                                placeholder="Username"
                                required
                            />
                            <div class="form-error" id="username-error"></div>
                        </div>

                        <div class="form-group">
                            <input 
                                type="password" 
                                id="password" 
                                class="form-input" 
                                placeholder="Password"
                                required
                            />
                            <div class="form-error" id="password-error"></div>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block" id="signup-btn">
                            Sign Up
                        </button>

                        <p style="color: var(--text-secondary); font-size: 12px; text-align: center; margin-top: 16px;">
                            By signing up, you agree to our Terms, Data Policy and Cookies Policy.
                        </p>
                    </form>

                    <div class="auth-divider">
                        <span>OR</span>
                    </div>

                    <div style="text-align: center; color: var(--text-secondary); font-size: 14px;">
                        Have an account? 
                        <a href="#/login" style="color: var(--primary); font-weight: 600;">Log in</a>
                    </div>
                </div>
            </div>
        `;

        this.setupFormHandlers();
        this.setupRealtimeValidation();
    },

    setupRealtimeValidation() {
        const emailInput = document.getElementById('email');
        const usernameInput = document.getElementById('username');

        // Email validation
        const validateEmail = debounce(async (email) => {
            if (!email || !isValidEmail(email)) {
                return;
            }

            try {
                const response = await api.checkAvailability('email', email);
                if (!response.available) {
                    this.showError('email', response.message);
                } else {
                    this.clearError('email');
                }
            } catch (error) {
                console.error('Email validation error:', error);
            }
        }, 500);

        // Username validation
        const validateUsername = debounce(async (username) => {
            if (!username || !isValidUsername(username)) {
                return;
            }

            try {
                const response = await api.checkAvailability('username', username);
                if (!response.available) {
                    this.showError('username', response.message);
                } else {
                    this.clearError('username');
                }
            } catch (error) {
                console.error('Username validation error:', error);
            }
        }, 500);

        emailInput.addEventListener('input', (e) => {
            const email = e.target.value.trim();
            if (email && isValidEmail(email)) {
                validateEmail(email);
            }
        });

        usernameInput.addEventListener('input', (e) => {
            const username = e.target.value.trim();
            if (username && isValidUsername(username)) {
                validateUsername(username);
            }
        });
    },

    setupFormHandlers() {
        const form = document.getElementById('signup-form');
        const signupBtn = document.getElementById('signup-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const fullName = document.getElementById('fullName').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Clear previous errors
            document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));

            // Validate
            let hasError = false;

            if (!email || !isValidEmail(email)) {
                this.showError('email', 'Please enter a valid email address');
                hasError = true;
            }

            if (!fullName || fullName.length < 1) {
                this.showError('fullName', 'Full name is required');
                hasError = true;
            }

            if (!username || !isValidUsername(username)) {
                this.showError('username', 'Username must be 3-30 characters and contain only letters, numbers, dots and underscores');
                hasError = true;
            }

            if (!password || password.length < 6) {
                this.showError('password', 'Password must be at least 6 characters');
                hasError = true;
            }

            if (hasError) return;

            // Check if email or username is already taken
            try {
                signupBtn.disabled = true;
                signupBtn.textContent = 'Checking availability...';

                // Check email
                const emailCheck = await api.checkAvailability('email', email);
                if (!emailCheck.available) {
                    this.showError('email', 'Email already registered');
                    Toast.error('Email already registered');
                    signupBtn.disabled = false;
                    signupBtn.textContent = 'Sign Up';
                    return;
                }

                // Check username
                const usernameCheck = await api.checkAvailability('username', username);
                if (!usernameCheck.available) {
                    this.showError('username', 'Username already taken');
                    Toast.error('Username already taken');
                    signupBtn.disabled = false;
                    signupBtn.textContent = 'Sign Up';
                    return;
                }
            } catch (error) {
                console.error('Availability check error:', error);
                // Continue with registration attempt even if check fails
            }


            // Submit
            try {
                signupBtn.disabled = true;
                signupBtn.textContent = 'Signing up...';

                const response = await api.register({
                    email,
                    fullName,
                    username,
                    password
                });

                Auth.currentUser = response.user;
                Toast.success('Welcome to Instagram!');

                // Redirect to home
                window.location.hash = '#/';
            } catch (error) {
                Toast.error(error.message || 'Signup failed');

                // Try to show specific field errors
                if (error.message.includes('email')) {
                    this.showError('email', error.message);
                } else if (error.message.includes('username')) {
                    this.showError('username', error.message);
                } else {
                    this.showError('password', error.message);
                }
            } finally {
                signupBtn.disabled = false;
                signupBtn.textContent = 'Sign Up';
            }
        });
    },

    showError(fieldId, message) {
        const errorEl = document.getElementById(`${fieldId}-error`);
        const inputEl = document.getElementById(fieldId);

        if (errorEl) {
            errorEl.textContent = message;
        }
        if (inputEl) {
            inputEl.classList.add('error');
        }
    },

    clearError(fieldId) {
        const errorEl = document.getElementById(`${fieldId}-error`);
        const inputEl = document.getElementById(fieldId);

        if (errorEl) {
            errorEl.textContent = '';
        }
        if (inputEl) {
            inputEl.classList.remove('error');
        }
    }
};
