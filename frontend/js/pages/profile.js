// Profile Page

const ProfilePage = {
    currentTab: 'posts',
    user: null,

    async render(username) {
        const app = document.getElementById('app');

        // Debug: Log the username being passed
        console.log('ProfilePage.render called with username:', username);

        // Check if username is valid
        if (!username || username === 'undefined' || username.trim() === '') {
            console.error('Invalid username provided to ProfilePage.render');
            app.innerHTML = `
                <div class="container">
                    <div class="card" style="padding: 48px; text-align: center; margin-top: 64px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                        <h3>Invalid Profile</h3>
                        <p class="text-secondary">No username was provided.</p>
                        <button class="btn btn-primary" onclick="window.location.hash = '#/'">Go Home</button>
                    </div>
                </div>
            `;
            return;
        }

        app.innerHTML = `
            <div class="container" style="padding-top: 24px;">
                <div id="profile-loading" style="text-align: center; padding: 64px;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                    <p style="margin-top: 16px; color: var(--text-secondary);">Loading @${escapeHtml(username)}...</p>
                </div>
            </div>
        `;

        try {
            console.log('Fetching profile for:', username);
            const response = await api.getUserProfile(username);
            console.log('Profile response:', response);
            this.user = response.user;
            this.renderProfile(response.user, response.isFollowing, response.isOwnProfile, response.isBlocked || false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            app.innerHTML = `
                <div class="container">
                    <div class="card" style="padding: 48px; text-align: center; margin-top: 64px;">
                        <i class="fas fa-user-slash" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                        <h3>User Not Found</h3>
                        <p class="text-secondary">The user "@${escapeHtml(username)}" doesn't exist or has been deleted.</p>
                        <p style="margin-top: 12px; font-size: 14px; color: var(--error);">${escapeHtml(error.message)}</p>
                        <button class="btn btn-primary" onclick="window.location.hash = '#/'">Go Home</button>
                    </div>
                </div>
            `;
        }
    },

    renderProfile(user, isFollowing, isOwnProfile, isBlocked = false) {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="container" style="padding-top: 24px;">
                <div class="card" style="padding: 32px; margin-bottom: 24px;">
                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 48px; align-items: center;">
                        <img src="${escapeHtml(user.profilePicture.url)}" 
                             alt="${escapeHtml(user.username)}"
                             style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover;"
                             onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'">
                        
                        <div>
                            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                                <h2 style="margin: 0;">${escapeHtml(user.username)}</h2>
                                ${user.isVerified ? '<i class="fas fa-check-circle" style="color: var(--primary);"></i>' : ''}
                                
                                ${isOwnProfile ? `
                                    <button class="btn btn-secondary btn-sm" onclick="ProfilePage.editProfile()">
                                        Edit Profile
                                    </button>
                                    <button class="btn btn-secondary btn-icon btn-sm" onclick="Auth.logout()">
                                        <i class="fas fa-sign-out-alt"></i>
                                    </button>
                                ` : `
                                    <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm" 
                                            id="follow-btn"
                                            onclick="ProfilePage.toggleFollow('${user._id}', ${isFollowing})">
                                        ${isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <div style="position: relative; display: inline-block;">
                                        <button class="btn btn-secondary btn-icon btn-sm" onclick="ProfilePage.toggleMenu(event)">
                                            <i class="fas fa-ellipsis-h"></i>
                                        </button>
                                        <div id="profile-menu" style="display: none; position: absolute; top: 100%; right: 0; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 150px; margin-top: 8px; z-index: 100;">
                                            <button class="btn btn-secondary" style="width: 100%; text-align: left; border-radius: 0; border: none; color: ${isBlocked ? 'var(--success)' : 'var(--error)'}; font-weight: 600;" 
                                                    onclick="ProfilePage.toggleBlock('${user._id}', ${isBlocked})">
                                                ${isBlocked ? 'Unblock' : 'Block'}
                                            </button>
                                        </div>
                                    </div>
                                `}
                            </div>

                            <div style="display: flex; gap: 32px; margin-bottom: 20px;">
                                <div>
                                    <strong>${formatNumber(user.postsCount || user.posts?.length || 0)}</strong> 
                                    <span style="color: var(--text-secondary);">posts</span>
                                </div>
                                <div style="cursor: pointer;" onclick="ProfilePage.showFollowers('${user._id}')">
                                    <strong>${formatNumber(user.followersCount || user.followers?.length || 0)}</strong> 
                                    <span style="color: var(--text-secondary);">followers</span>
                                </div>
                                <div style="cursor: pointer;" onclick="ProfilePage.showFollowing('${user._id}')">
                                    <strong>${formatNumber(user.followingCount || user.following?.length || 0)}</strong> 
                                    <span style="color: var(--text-secondary);">following</span>
                                </div>
                            </div>

                            <div>
                                <strong>${escapeHtml(user.fullName)}</strong>
                                ${user.bio ? `<p style="margin: 4px 0;">${escapeHtml(user.bio)}</p>` : ''}
                                ${user.website ? `<a href="${escapeHtml(user.website)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary);">${escapeHtml(user.website)}</a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div style="display: flex; border-bottom: 1px solid var(--border);">
                        <button class="btn btn-secondary" 
                                style="flex: 1; border-radius: 0; border: none; border-bottom: ${this.currentTab === 'posts' ? '2px solid var(--text-primary)' : 'none'};"
                                onclick="ProfilePage.switchTab('posts')">
                            <i class="fas fa-th"></i> POSTS
                        </button>
                        ${isOwnProfile ? `
                            <button class="btn btn-secondary" 
                                    style="flex: 1; border-radius: 0; border: none; border-bottom: ${this.currentTab === 'saved' ? '2px solid var(--text-primary)' : 'none'};"
                                    onclick="ProfilePage.switchTab('saved')">
                                <i class="far fa-bookmark"></i> SAVED
                            </button>
                        ` : ''}
                    </div>

                    <div id="profile-content" style="padding: 24px;">
                        <div style="text-align: center; padding: 32px;">
                            <div class="spinner" style="margin: 0 auto;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadContent(isOwnProfile);
    },

    async loadContent(isOwnProfile) {
        const content = document.getElementById('profile-content');

        if (this.currentTab === 'posts') {
            try {
                const response = await api.getUserPosts(this.user._id);

                if (response.posts.length === 0) {
                    content.innerHTML = `
                        <div style="text-align: center; padding: 48px;">
                            <i class="fas fa-camera" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                            <h3>No Posts Yet</h3>
                            ${isOwnProfile ? '<p class="text-secondary">Share your first photo or video</p>' : ''}
                        </div>
                    `;
                } else {
                    content.innerHTML = `<div class="profile-grid"></div>`;
                    const grid = content.querySelector('.profile-grid');
                    grid.innerHTML = response.posts.map(post => `
                        <div class="profile-grid-item" onclick="PostDetailModal.open('${post._id}')">
                            <img src="${escapeHtml(post.images[0].url)}" 
                                 alt="Post"
                                 onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/d/d1/Image_not_available.png'">
                            <div class="profile-grid-overlay">
                                <span><i class="fas fa-heart"></i> ${formatNumber(post.likesCount)}</span>
                                <span><i class="fas fa-comment"></i> ${formatNumber(post.commentsCount)}</span>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                content.innerHTML = '<p class="text-error" style="text-align: center;">Failed to load posts</p>';
            }
        } else if (this.currentTab === 'saved') {
            try {
                const response = await api.getSavedPosts();

                if (response.posts.length === 0) {
                    content.innerHTML = `
                        <div style="text-align: center; padding: 48px;">
                            <i class="far fa-bookmark" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                            <h3>No Saved Posts</h3>
                            <p class="text-secondary">Save posts you want to see again</p>
                        </div>
                    `;
                } else {
                    content.innerHTML = `<div class="profile-grid"></div>`;
                    const grid = content.querySelector('.profile-grid');
                    grid.innerHTML = response.posts.map(post => `
                        <div class="profile-grid-item" onclick="PostDetailModal.open('${post._id}')">
                            <img src="${escapeHtml(post.images[0].url)}" 
                                 alt="Post"
                                 onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/d/d1/Image_not_available.png'">
                            <div class="profile-grid-overlay">
                                <span><i class="fas fa-heart"></i> ${formatNumber(post.likesCount)}</span>
                                <span><i class="fas fa-comment"></i> ${formatNumber(post.commentsCount)}</span>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                content.innerHTML = '<p class="text-error" style="text-align: center;">Failed to load saved posts</p>';
            }
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        const isOwnProfile = State.user && this.user && State.user._id === this.user._id;
        const isBlocked = this.isBlocked || false;
        this.renderProfile(this.user, false, isOwnProfile, isBlocked);
    },

    async toggleFollow(userId, isCurrentlyFollowing) {
        const btn = document.getElementById('follow-btn');
        if (!btn) return;

        try {
            btn.disabled = true;

            if (isCurrentlyFollowing) {
                await api.unfollowUser(userId);
                btn.textContent = 'Follow';
                btn.className = 'btn btn-primary btn-sm';
                Toast.success('Unfollowed successfully');
            } else {
                await api.followUser(userId);
                btn.textContent = 'Following';
                btn.className = 'btn btn-secondary btn-sm';
                Toast.success('Following successfully');
            }

            // Re-render to update follower count
            const username = this.user.username;
            setTimeout(() => this.render(username), 500);
        } catch (error) {
            Toast.error('Failed to update follow status');
            btn.disabled = false;
        }
    },

    toggleMenu(event) {
        event.stopPropagation();
        const menu = document.getElementById('profile-menu');
        const isVisible = menu.style.display === 'block';

        if (isVisible) {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'block';
            // Close menu when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeMenu() {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }, { once: true });
            }, 0);
        }
    },

    async toggleBlock(userId, isCurrentlyBlocked) {
        const menu = document.getElementById('profile-menu');
        if (menu) menu.style.display = 'none';

        try {
            if (isCurrentlyBlocked) {
                await api.unblockUser(userId);
                Toast.success('User unblocked successfully');
            } else {
                Modal.confirm(
                    'Block User',
                    'Are you sure you want to block this user? You will unfollow each other and their posts will be hidden from your feed.',
                    async () => {
                        try {
                            await api.blockUser(userId);
                            Toast.success('User blocked successfully');
                            // Reload profile
                            const username = this.user.username;
                            setTimeout(() => this.render(username), 500);
                        } catch (error) {
                            Toast.error('Failed to block user');
                        }
                    }
                );
                return;
            }

            // Re-render to update UI
            const username = this.user.username;
            setTimeout(() => this.render(username), 500);
        } catch (error) {
            Toast.error('Failed to update block status');
        }
    },

    editProfile() {
        const user = this.user;
        const content = `
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="position: relative; display: inline-block;">
                    <img id="edit-preview" 
                         src="${escapeHtml(user.profilePicture?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')}" 
                         style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);">
                    <label for="edit-file-input" 
                           style="position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        <i class="fas fa-camera"></i>
                    </label>
                    <input type="file" id="edit-file-input" accept="image/*" style="display: none;" onchange="ProfilePage.handleProfilePictureSelect(event)">
                </div>
                <p style="margin-top: 8px; font-size: 14px; color: var(--primary); cursor: pointer;" onclick="document.getElementById('edit-file-input').click()">Change Profile Photo</p>
            </div>

            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="edit-fullname" class="form-input" value="${escapeHtml(user.fullName)}">
            </div>
            <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea id="edit-bio" class="form-textarea" rows="3">${escapeHtml(user.bio || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Website</label>
                <input type="text" id="edit-website" class="form-input" value="${escapeHtml(user.website || '')}">
            </div>
            <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="edit-private" ${user.isPrivate ? 'checked' : ''}>
                <label for="edit-private" style="margin: 0;">Private Account</label>
            </div>
        `;

        this.selectedProfilePicture = null;

        Modal.show('Edit Profile', content, [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onClick: () => {
                    this.selectedProfilePicture = null;
                    Modal.close();
                }
            },
            {
                text: 'Save',
                className: 'btn-primary',
                onClick: async () => {
                    const fullName = document.getElementById('edit-fullname').value.trim();
                    const bio = document.getElementById('edit-bio').value.trim();
                    const website = document.getElementById('edit-website').value.trim();
                    const isPrivate = document.getElementById('edit-private').checked;

                    if (!fullName) {
                        Toast.error('Full Name is required');
                        return;
                    }

                    const saveBtn = document.querySelector('.modal-footer .btn-primary');
                    const originalText = saveBtn.textContent;
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';

                    try {
                        // Upload profile picture if selected
                        if (this.selectedProfilePicture) {
                            await api.updateProfilePicture(this.selectedProfilePicture);
                        }

                        // Update other details
                        await api.updateProfile({ fullName, bio, website, isPrivate });

                        Toast.success('Profile updated successfully');
                        Modal.close();
                        this.selectedProfilePicture = null;
                        this.render(user.username); // Reload profile
                    } catch (error) {
                        console.error('Update error:', error);
                        Toast.error(error.message || 'Failed to update profile');
                        saveBtn.disabled = false;
                        saveBtn.textContent = originalText;
                    }
                },
                closeOnClick: false
            }
        ]);
    },

    handleProfilePictureSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const validation = isValidImageFile(file);
        if (!validation.valid) {
            Toast.error(validation.error);
            return;
        }

        this.selectedProfilePicture = file;

        // Update preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('edit-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    async showFollowers(userId) {
        Modal.loading('Loading followers...');
        try {
            const response = await api.getFollowers(userId);
            this.renderUserList('Followers', response.followers);
        } catch (error) {
            Modal.alert('Error', 'Failed to load followers');
        }
    },

    async showFollowing(userId) {
        Modal.loading('Loading following...');
        try {
            const response = await api.getFollowing(userId);
            this.renderUserList('Following', response.following);
        } catch (error) {
            Modal.alert('Error', 'Failed to load following list');
        }
    },

    renderUserList(title, users) {
        if (users.length === 0) {
            Modal.show(title, '<p class="text-secondary" style="text-align: center; padding: 20px;">No users found.</p>', [{ text: 'Close' }]);
            return;
        }

        const content = `
            <div style="max-height: 400px; overflow-y: auto;">
                ${users.map(user => `
                    <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid var(--border);">
                        <img src="${escapeHtml(user.profilePicture?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')}" 
                             style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 12px;"
                             onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'">
                        <div style="flex: 1;">
                            <div style="font-weight: 600;">
                                <a href="#/profile/${user.username}" onclick="Modal.close()" style="color: inherit; text-decoration: none;">
                                    ${escapeHtml(user.username)}
                                </a>
                                ${user.isVerified ? '<i class="fas fa-check-circle" style="color: var(--primary); font-size: 12px;"></i>' : ''}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(user.fullName)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        Modal.show(title, content, [{ text: 'Close' }]);
    }
};
