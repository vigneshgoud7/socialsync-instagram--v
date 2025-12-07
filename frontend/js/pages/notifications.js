// Notifications Page

const NotificationsPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="notifications-container">
                <div class="notifications-header">
                    <h1>Notifications</h1>
                </div>
                <div class="notifications-content">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading notifications...</p>
                    </div>
                </div>
            </div>
        `;

        await this.loadNotifications();
    },


    async loadNotifications() {
        try {
            const [notificationsResponse, suggestionsResponse] = await Promise.all([
                api.getNotifications(),
                api.getSuggestions()
            ]);

            const { notifications, requests, unreadCount } = notificationsResponse;
            const suggestions = suggestionsResponse.suggestions || [];

            // Mark notifications as read
            if (unreadCount > 0) {
                await api.markNotificationsRead();
                // Update navbar badge
                if (window.Navbar) {
                    Navbar.updateNotificationBadge();
                }
            }

            this.renderNotifications(notifications, requests, suggestions);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.renderError(error.message);
        }
    },

    renderNotifications(notifications, requests, suggestions) {
        const contentDiv = document.querySelector('.notifications-content');

        let html = '';

        // Follow Requests Section
        if (requests && requests.length > 0) {
            html += `
                <div class="notification-section">
                    <h3>Follow Requests</h3>
                    ${requests.map(user => this.renderFollowRequest(user)).join('')}
                </div>
            `;
        }

        // Suggestions Section (New)
        if (suggestions && suggestions.length > 0) {
            html += `
                <div class="notification-section">
                    <h3>Suggested for you</h3>
                    <div class="suggestions-scroller" style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 24px;">
                        ${suggestions.map(user => this.renderSuggestionCard(user)).join('')}
                    </div>
                </div>
            `;
        }

        // Recent Notifications Section
        if (notifications && notifications.length > 0) {
            html += `
                <div class="notification-section">
                    <h3>Recent</h3>
                    ${notifications.map(notif => this.renderNotification(notif)).join('')}
                </div>
            `;
        } else if ((!requests || requests.length === 0) && (!suggestions || suggestions.length === 0)) {
            html += `
                <div class="empty-state">
                    <i class="far fa-bell" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                    <p class="text-secondary">No notifications yet</p>
                </div>
            `;
        }

        contentDiv.innerHTML = html;
    },

    renderSuggestionCard(user) {
        return `
            <div class="suggestion-card" style="min-width: 150px; padding: 16px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <img 
                    src="${escapeHtml(user.profilePicture?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')}" 
                    alt="${escapeHtml(user.username)}"
                    style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; cursor: pointer;"
                    onclick="window.location.hash = '#/profile/${escapeHtml(user.username)}'"
                    onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"
                >
                <div style="width: 100%;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;" onclick="window.location.hash = '#/profile/${escapeHtml(user.username)}'">${escapeHtml(user.username)}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(user.fullName)}</div>
                    <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="NotificationsPage.followUser('${user._id}', this)">Follow</button>
                </div>
            </div>
        `;
    },

    async followUser(userId, btn) {
        try {
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = '...';

            await api.followUser(userId);

            btn.textContent = 'Requested';
            btn.className = 'btn btn-secondary btn-sm';
            Toast.success('Follow request sent');
        } catch (error) {
            btn.disabled = false;
            btn.textContent = 'Follow';
            Toast.error('Failed to follow user');
        }
    },

    renderFollowRequest(user) {
        return `
            <div class="notification-item follow-request" data-user-id="${user._id}">
                <img 
                    src="${escapeHtml(user.profilePicture?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')}" 
                    alt="${escapeHtml(user.username)}"
                    class="notification-avatar"
                    onclick="window.location.hash = '#/profile/${escapeHtml(user.username)}'"
                    onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"
                >
                <div class="notification-content">
                    <div class="notification-text">
                        <strong onclick="window.location.hash = '#/profile/${escapeHtml(user.username)}'" style="cursor: pointer;">
                            ${escapeHtml(user.username)}
                        </strong>
                        ${user.isVerified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                        <span class="text-secondary">wants to follow you</span>
                    </div>
                    <div class="notification-actions">
                        <button class="btn btn-primary btn-sm" onclick="NotificationsPage.acceptRequest('${user._id}')">Confirm</button>
                        <button class="btn btn-secondary btn-sm" onclick="NotificationsPage.deleteRequest('${user._id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderNotification(notif) {
        const timeAgo = this.getTimeAgo(notif.createdAt);
        let text = '';
        let action = '';

        switch (notif.type) {
            case 'follow':
                text = 'started following you';
                action = `onclick="window.location.hash = '#/profile/${escapeHtml(notif.sender.username)}'"`;
                break;
            case 'follow_request':
                text = 'requested to follow you';
                action = `onclick="window.location.hash = '#/profile/${escapeHtml(notif.sender.username)}'"`;
                break;
            case 'like':
                text = 'liked your post';
                action = notif.post ? `onclick="PostDetailModal.show('${notif.post._id}')"` : '';
                break;
            case 'comment':
                text = 'commented on your post';
                action = notif.post ? `onclick="PostDetailModal.show('${notif.post._id}')"` : '';
                break;
        }

        const postThumbnail = notif.post?.images?.[0]?.url
            ? `<img src="${escapeHtml(notif.post.images[0].url)}" alt="Post" class="notification-post-thumb" ${action}>`
            : '';

        return `
            <div class="notification-item ${notif.read ? '' : 'unread'}" ${action}>
                <img 
                    src="${escapeHtml(notif.sender?.profilePicture?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')}" 
                    alt="${escapeHtml(notif.sender?.username || 'User')}"
                    class="notification-avatar"
                    onclick="event.stopPropagation(); window.location.hash = '#/profile/${escapeHtml(notif.sender?.username)}'"
                    onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"
                >
                <div class="notification-content">
                    <div class="notification-text">
                        <strong onclick="event.stopPropagation(); window.location.hash = '#/profile/${escapeHtml(notif.sender?.username)}'" style="cursor: pointer;">
                            ${escapeHtml(notif.sender?.username || 'User')}
                        </strong>
                        ${notif.sender?.isVerified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                        <span class="text-secondary">${text}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                </div>
                ${postThumbnail}
            </div>
        `;
    },

    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return `${Math.floor(seconds / 604800)}w`;
    },

    async acceptRequest(userId) {
        try {
            await api.acceptFollowRequest(userId);
            Toast.success('Follow request accepted');
            // Remove from UI
            const element = document.querySelector(`.follow-request[data-user-id="${userId}"]`);
            if (element) {
                element.remove();
            }
            // Update navbar badge
            if (window.Navbar) {
                Navbar.updateNotificationBadge();
            }
        } catch (error) {
            Toast.error('Failed to accept request');
        }
    },

    async deleteRequest(userId) {
        try {
            await api.rejectFollowRequest(userId);
            Toast.success('Follow request deleted');
            // Remove from UI
            const element = document.querySelector(`.follow-request[data-user-id="${userId}"]`);
            if (element) {
                element.remove();
            }
            // Update navbar badge
            if (window.Navbar) {
                Navbar.updateNotificationBadge();
            }
        } catch (error) {
            Toast.error('Failed to delete request');
        }
    },

    renderError(message) {
        const contentDiv = document.querySelector('.notifications-content');
        contentDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger); margin-bottom: 16px;"></i>
                <p class="text-secondary">Failed to load notifications</p>
                <p class="text-secondary" style="font-size: 14px;">${escapeHtml(message)}</p>
                <button class="btn btn-primary" onclick="NotificationsPage.loadNotifications()">Retry</button>
            </div>
        `;
    }
};
