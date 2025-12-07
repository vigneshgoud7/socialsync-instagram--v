// Navbar Component

const Navbar = {
    currentUser: null,

    render(user) {
        this.currentUser = user;
        const navbar = document.getElementById('navbar');

        navbar.innerHTML = `
            <div class="navbar-content">
                <div class="navbar-logo" onclick="window.location.hash = '#/'">
                    Social Sync
                </div>
                
                <div class="navbar-search">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search" id="navbar-search-input">
                </div>
                
                <div class="navbar-actions">
                    <div class="nav-icon" onclick="window.location.hash = '#/'" title="Home">
                        <i class="fas fa-home"></i>
                    </div>
                    <div class="nav-icon" onclick="window.location.hash = '#/explore'" title="Explore">
                        <i class="fas fa-compass"></i>
                    </div>
                    <div class="nav-icon" onclick="window.location.hash = '#/upload'" title="Create">
                        <i class="far fa-plus-square"></i>
                    </div>
                    <div class="nav-icon" id="notifications-icon" onclick="window.location.hash = '#/notifications'" title="Notifications">
                        <i class="far fa-heart"></i>
                        <span class="badge hidden" id="notifications-badge">0</span>
                    </div>
                    <div class="nav-icon" onclick="window.location.hash = '#/settings'" title="Settings">
                        <i class="fas fa-cog"></i>
                    </div>
                    <img 
                        src="${escapeHtml(user.profilePicture.url)}" 
                        alt="${escapeHtml(user.username)}"
                        class="profile-pic-nav"
                        onclick="window.location.hash = '#/profile/${escapeHtml(user.username)}'"
                        onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"
                    />
                </div>
            </div>
        `;

        navbar.style.display = 'flex';
        this.setupSearch();
        this.updateNotificationBadge();
    },

    async updateNotificationBadge() {
        try {
            const response = await api.getNotifications();
            const requestsCount = response.requests?.length || 0;
            const unreadCount = response.unreadCount || 0;
            const totalCount = requestsCount + unreadCount;

            const badge = document.getElementById('notifications-badge');

            if (badge) {
                if (totalCount > 0) {
                    badge.textContent = totalCount > 99 ? '99+' : totalCount;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    },

    setupSearch() {
        const searchInput = document.getElementById('navbar-search-input');
        if (!searchInput) return;

        const performSearch = debounce(async (query) => {
            if (query.trim().length < 2) {
                this.hideSearchResults();
                return;
            }

            try {
                const response = await api.searchUsers(query);
                this.showSearchResults(response.users);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar-search')) {
                this.hideSearchResults();
            }
        });
    },

    showSearchResults(users) {
        let resultsContainer = document.getElementById('search-results');

        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'search-results';
            resultsContainer.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                margin-top: 8px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                max-height: 400px;
                overflow-y: auto;
                z-index: 1000;
            `;
            document.querySelector('.navbar-search').appendChild(resultsContainer);
        }

        if (users.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary);">No users found</div>';
            return;
        }

        resultsContainer.innerHTML = users.map(user => `
            <div class="search-result-item" style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" 
                 onmouseover="this.style.background='var(--background)'" 
                 onmouseout="this.style.background='transparent'"
                 onclick="window.location.hash = '#/profile/${escapeHtml(user.username)}'">
                <img src="${escapeHtml(user.profilePicture.url)}" 
                     alt="${escapeHtml(user.username)}"
                     style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;"
                     onerror="this.src='https://via.placeholder.com/44'">
                <div>
                    <div style="font-weight: 600; font-size: 14px;">${escapeHtml(user.username)}</div>
                    <div style="color: var(--text-secondary); font-size: 14px;">${escapeHtml(user.fullName)}</div>
                </div>
                ${user.isVerified ? '<i class="fas fa-check-circle" style="margin-left: auto; color: var(--primary);"></i>' : ''}
            </div>
        `).join('');
    },

    hideSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.remove();
        }
    },

    async showFollowRequests() {
        Modal.loading('Loading follow requests...');

        try {
            const response = await api.getFollowRequests();
            const requests = response.requests || [];

            if (requests.length === 0) {
                Modal.show('Follow Requests', '<p class="text-secondary" style="text-align: center; padding: 20px;">No pending follow requests</p>', [{ text: 'Close' }]);
                return;
            }

            const content = `
                <div style="max-height: 400px; overflow-y: auto;">
                    ${requests.map(user => `
                        <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid var(--border);">
                            <img src="${escapeHtml(user.profilePicture?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')}" 
                                 style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; margin-right: 12px;"
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
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-primary btn-sm" onclick="Navbar.acceptRequest('${user._id}')">Accept</button>
                                <button class="btn btn-secondary btn-sm" onclick="Navbar.rejectRequest('${user._id}')">Reject</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            Modal.show('Follow Requests', content, [{ text: 'Close' }]);
        } catch (error) {
            Modal.alert('Error', 'Failed to load follow requests');
        }
    },

    async acceptRequest(userId) {
        try {
            await api.acceptFollowRequest(userId);
            Toast.success('Follow request accepted');
            this.showFollowRequests(); // Refresh the list
            this.updateNotificationBadge();
        } catch (error) {
            Toast.error('Failed to accept request');
        }
    },

    async rejectRequest(userId) {
        try {
            await api.rejectFollowRequest(userId);
            Toast.success('Follow request rejected');
            this.showFollowRequests(); // Refresh the list
            this.updateNotificationBadge();
        } catch (error) {
            Toast.error('Failed to reject request');
        }
    },

    hide() {
        const navbar = document.getElementById('navbar');
        navbar.style.display = 'none';
    }
};
