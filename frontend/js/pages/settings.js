// Settings Page

const SettingsPage = {
    render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="container" style="padding-top: 24px; max-width: 800px;">
                <div class="card">
                    <div style="padding: 24px; border-bottom: 1px solid var(--border);">
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-cog"></i>
                            Settings
                        </h2>
                    </div>

                    <div style="padding: 24px;">
                        <!-- Account Settings Section -->
                        <div style="margin-bottom: 32px;">
                            <h3 style="font-size: 18px; margin-bottom: 16px; color: var(--text-primary);">
                                Account Settings
                            </h3>
                            
                            <div class="settings-item" onclick="ProfilePage.editProfile()">
                                <div class="settings-item-icon">
                                    <i class="fas fa-user-edit"></i>
                                </div>
                                <div class="settings-item-content">
                                    <div class="settings-item-title">Edit Profile</div>
                                    <div class="settings-item-description">Update your profile information</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-secondary);"></i>
                            </div>

                            <div class="settings-item" onclick="window.location.hash = '#/profile/' + Auth.currentUser.username">
                                <div class="settings-item-icon">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="settings-item-content">
                                    <div class="settings-item-title">View Profile</div>
                                    <div class="settings-item-description">See your profile page</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-secondary);"></i>
                            </div>
                        </div>

                        <!-- Appearance Section -->
                        <div style="margin-bottom: 32px;">
                            <h3 style="font-size: 18px; margin-bottom: 16px; color: var(--text-primary);">
                                Appearance
                            </h3>
                            
                            <div class="settings-item">
                                <div class="settings-item-icon">
                                    <i class="fas fa-moon"></i>
                                </div>
                                <div class="settings-item-content">
                                    <div class="settings-item-title">Dark Mode</div>
                                    <div class="settings-item-description">Switch between light and dark theme</div>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="theme-toggle" onchange="SettingsPage.toggleTheme(this.checked)">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <!-- Privacy Section -->
                        <div style="margin-bottom: 32px;">
                            <h3 style="font-size: 18px; margin-bottom: 16px; color: var(--text-primary);">
                                Privacy & Security
                            </h3>
                            
                            <div class="settings-item">
                                <div class="settings-item-icon">
                                    <i class="fas fa-lock"></i>
                                </div>
                                <div class="settings-item-content">
                                    <div class="settings-item-title">Private Account</div>
                                    <div class="settings-item-description">Control who can see your posts</div>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="privacy-toggle" onchange="SettingsPage.togglePrivacy(this.checked)">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <!-- Danger Zone -->
                        <div style="margin-bottom: 16px;">
                            <h3 style="font-size: 18px; margin-bottom: 16px; color: var(--error);">
                                <i class="fas fa-exclamation-triangle"></i>
                                Danger Zone
                            </h3>
                            
                            <div class="settings-item danger-item" onclick="SettingsPage.confirmDeleteAccount()">
                                <div class="settings-item-icon" style="color: var(--error);">
                                    <i class="fas fa-trash-alt"></i>
                                </div>
                                <div class="settings-item-content">
                                    <div class="settings-item-title" style="color: var(--error);">Delete Account</div>
                                    <div class="settings-item-description">Permanently delete your account and all data</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--error);"></i>
                            </div>

                            <div class="settings-item" onclick="Auth.logout()" style="border-bottom: none;">
                                <div class="settings-item-icon">
                                    <i class="fas fa-sign-out-alt"></i>
                                </div>
                                <div class="settings-item-content">
                                    <div class="settings-item-title">Logout</div>
                                    <div class="settings-item-description">Sign out of your account</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-secondary);"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadCurrentSettings();
    },

    async loadCurrentSettings() {
        try {
            // Load user privacy settings
            const user = await Auth.getCurrentUser();
            if (user) {
                const privacyToggle = document.getElementById('privacy-toggle');
                if (privacyToggle) {
                    privacyToggle.checked = user.isPrivate || false;
                }
            }

            // Load theme setting
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle && window.themeManager) {
                themeToggle.checked = window.themeManager.getCurrentTheme() === 'dark';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    },

    toggleTheme(isDark) {
        if (window.themeManager) {
            const newTheme = isDark ? 'dark' : 'light';
            window.themeManager.setTheme(newTheme);
            Toast.success(`Switched to ${newTheme} mode`);
        }
    },

    async togglePrivacy(isPrivate) {
        try {
            await api.updateProfile({ isPrivate });
            Toast.success(isPrivate ? 'Account is now private' : 'Account is now public');
            Auth.updateUser({ isPrivate });
        } catch (error) {
            console.error('Error updating privacy:', error);
            Toast.error('Failed to update privacy settings');
            // Revert toggle
            const privacyToggle = document.getElementById('privacy-toggle');
            if (privacyToggle) {
                privacyToggle.checked = !isPrivate;
            }
        }
    },

    confirmDeleteAccount() {
        // Close any existing modals
        Modal.close();

        // Show confirmation dialog
        const confirmContent = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: var(--error); margin-bottom: 16px;"></i>
                <h3 style="margin-bottom: 16px;">Delete Your Account?</h3>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">
                    This will permanently delete your account, all your posts, comments, and data.
                </p>
                <p style="color: var(--error); font-weight: 600;">
                    This action cannot be undone!
                </p>
            </div>
        `;

        Modal.show('Delete Account', confirmContent, [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onClick: () => Modal.close()
            },
            {
                text: 'Delete My Account',
                className: 'btn-danger',
                onClick: () => {
                    Modal.close();
                    // Show password confirmation
                    setTimeout(() => this.confirmDeleteWithPassword(), 100);
                }
            }
        ]);
    },

    confirmDeleteWithPassword() {
        const passwordContent = `
            <div style="padding: 20px;">
                <p style="margin-bottom: 16px; color: var(--text-secondary);">
                    Please enter your password to confirm account deletion:
                </p>
                <div class="form-group">
                    <input type="password" 
                           id="delete-password-input" 
                           class="form-input" 
                           placeholder="Enter your password"
                           style="width: 100%;">
                    <div class="form-error" id="delete-password-error"></div>
                </div>
            </div>
        `;

        Modal.show('Confirm Deletion', passwordContent, [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onClick: () => Modal.close()
            },
            {
                text: 'Confirm Delete',
                className: 'btn-danger',
                onClick: async () => {
                    const password = document.getElementById('delete-password-input').value;

                    if (!password) {
                        const errorEl = document.getElementById('delete-password-error');
                        errorEl.textContent = 'Password is required';
                        return;
                    }

                    const confirmBtn = document.querySelector('.modal-footer .btn-danger');
                    const originalText = confirmBtn.textContent;
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = 'Deleting...';

                    try {
                        // First verify password by attempting to login
                        const currentUser = Auth.currentUser;
                        await api.login({
                            emailOrUsername: currentUser.email,
                            password: password
                        });

                        // If login successful, password is correct, proceed with deletion
                        await api.deleteAccount();

                        Toast.success('Account deleted successfully');
                        Modal.close();

                        // Redirect to signup page
                        setTimeout(() => {
                            window.location.hash = '#/signup';
                        }, 1000);
                    } catch (error) {
                        console.error('Delete account error:', error);
                        const errorEl = document.getElementById('delete-password-error');
                        errorEl.textContent = 'Incorrect password';
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = originalText;
                    }
                },
                closeOnClick: false
            }
        ]);

        // Focus on password input
        setTimeout(() => {
            document.getElementById('delete-password-input')?.focus();
        }, 100);
    }
};
