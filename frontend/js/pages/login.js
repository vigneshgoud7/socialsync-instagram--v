// Login Page

const LoginPage = {
    render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">
                        <h1>Social Sync</h1>
                    </div>

                    <form id="login-form" class="auth-form">
                        <div class="form-group">
                            <input 
                                type="text" 
                                id="emailOrUsername" 
                                class="form-input" 
                                placeholder="Username or email"
                                required
                            />
                            <div class="form-error" id="emailOrUsername-error"></div>
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

                        <button type="submit" class="btn btn-primary btn-block" id="login-btn">
                            Log In
                        </button>
                    </form>

                    <div class="auth-divider">
                        <span>OR</span>
                    </div>

                    <div style="text-align: center; color: var(--text-secondary); font-size: 14px;">
                        Don't have an account? 
                        <a href="#/signup" style="color: var(--primary); font-weight: 600;">Sign up</a>
                    </div>
                </div>
            </div>
        `;

        this.setupFormHandlers();
        this.setupRealtimeValidation();
    },

    setupRealtimeValidation() {
        const emailOrUsernameInput = document.getElementById('emailOrUsername');

        // Check if email/username exists
        const validateEmailOrUsername = debounce(async (value) => {
            if (!value || value.length < 3) {
                return;
            }

            try {
                // Determine if it's an email or username
                const isEmail = isValidEmail(value);
                const field = isEmail ? 'email' : 'username';

                const response = await api.checkAvailability(field, value);

                // For login, we want to show error if email/username is NOT registered
                if (response.available) {
                    this.showError('emailOrUsername', `This ${field} is not registered. Please sign up first.`);
                } else {
                    this.clearError('emailOrUsername');
                }
            } catch (error) {
                console.error('Validation error:', error);
            }
        }, 600);

        emailOrUsernameInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.length >= 3) {
                validateEmailOrUsername(value);
            }
        });
    },

    setupFormHandlers() {
        const form = document.getElementById('login-form');
        const loginBtn = document.getElementById('login-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailOrUsername = document.getElementById('emailOrUsername').value.trim();
            const password = document.getElementById('password').value;

            // Clear previous errors
            document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));

            // Validate
            let hasError = false;

            if (!emailOrUsername) {
                this.showError('emailOrUsername', 'Username or email is required');
                hasError = true;
            }

            if (!password) {
                this.showError('password', 'Password is required');
                hasError = true;
            }

            if (hasError) return;

            // Check if email/username is registered
            try {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Checking...';

                const isEmail = isValidEmail(emailOrUsername);
                const field = isEmail ? 'email' : 'username';

                const availabilityResponse = await api.checkAvailability(field, emailOrUsername);

                if (availabilityResponse.available) {
                    // Email/username is NOT registered
                    this.showError('emailOrUsername', `This ${field} is not registered. Please sign up first.`);
                    Toast.error(`This ${field} is not registered`);
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Log In';
                    return;
                }
            } catch (error) {
                console.error('Validation error:', error);
                // Continue with login attempt even if validation fails
            }

            // Submit
            try {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Logging in...';

                const response = await api.login({
                    emailOrUsername,
                    password
                });

                Auth.currentUser = response.user;
                Toast.success('Welcome back!');

                // Redirect to home
                window.location.hash = '#/';
            } catch (error) {
                Toast.error(error.message || 'Login failed');
                this.showError('password', error.message || 'Invalid credentials');
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Log In';
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
