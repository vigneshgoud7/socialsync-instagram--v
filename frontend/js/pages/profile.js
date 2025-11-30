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
            this.renderProfile(response.user, response.isFollowing, response.isOwnProfile);
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

    renderProfile(user, isFollowing, isOwnProfile) {
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
                        <div class="profile-grid-item" onclick="alert('Post detail - ID: ${post._id}')">
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
                        <div class="profile-grid-item" onclick="alert('Post detail - ID: ${post._id}')">
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
        this.renderProfile(this.user, false, isOwnProfile);
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

    editProfile() {
        Modal.alert('Edit Profile', 'Profile editing feature coming soon!');
    },

    showFollowers(userId) {
        Modal.alert('Followers', 'Followers list feature coming soon!');
    },

    showFollowing(userId) {
        Modal.alert('Following', 'Following list feature coming soon!');
    }
};
