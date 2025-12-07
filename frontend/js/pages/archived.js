// Archived Posts Page

const ArchivedPage = {
    async render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="container" style="padding-top: 24px; max-width: 935px;">
                <div class="page-header">
                    <h1 style="display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-archive"></i>
                        Archived Posts
                    </h1>
                    <p class="text-secondary">Only you can see your archived posts</p>
                </div>
                
                <div class="posts-grid" id="archived-posts">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading archived posts...</p>
                    </div>
                </div>
            </div>
        `;

        await this.loadArchivedPosts();
    },

    async loadArchivedPosts() {
        try {
            const response = await api.getArchivedPosts();
            const { posts } = response;
            this.renderPosts(posts);
        } catch (error) {
            console.error('Error loading archived posts:', error);
            this.renderError();
        }
    },

    renderPosts(posts) {
        const postsGrid = document.getElementById('archived-posts');

        if (!posts || posts.length === 0) {
            postsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-archive" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                    <p class="text-secondary">No archived posts</p>
                    <p class="text-secondary" style="font-size: 14px; margin-top: 8px;">
                        Posts you archive will appear here
                    </p>
                </div>
            `;
            return;
        }

        postsGrid.className = 'posts-grid grid grid-3';
        postsGrid.innerHTML = posts.map(post => `
            <div class="post-grid-item" onclick="PostDetailModal.show('${post._id}')">
                <img src="${escapeHtml(post.images[0].url)}" alt="Post" loading="lazy">
                <div class="post-grid-overlay">
                    <div class="post-grid-stats">
                        <span><i class="fas fa-heart"></i> ${post.likes.length}</span>
                        <span><i class="fas fa-comment"></i> ${post.comments.length}</span>
                    </div>
                </div>
                <div class="archived-badge">
                    <i class="fas fa-archive"></i> Archived
                </div>
            </div>
        `).join('');
    },

    renderError() {
        const postsGrid = document.getElementById('archived-posts');
        postsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--error); margin-bottom: 16px;"></i>
                <p class="text-secondary">Failed to load archived posts</p>
                <button class="btn btn-primary" onclick="ArchivedPage.loadArchivedPosts()">Retry</button>
            </div>
        `;
    }
};
