// Hashtag Explore Page

const HashtagPage = {
    currentTag: null,

    async render(tag) {
        this.currentTag = tag;
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="container" style="padding-top: 24px; max-width: 935px;">
                <div class="hashtag-header">
                    <div class="hashtag-info">
                        <h1 class="hashtag-title">#${escapeHtml(tag)}</h1>
                        <div class="hashtag-stats" id="hashtag-stats">
                            <div class="spinner-small"></div>
                        </div>
                    </div>
                </div>
                
                <div class="posts-grid" id="hashtag-posts">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading posts...</p>
                    </div>
                </div>
            </div>
        `;

        await this.loadHashtagPosts();
    },

    async loadHashtagPosts() {
        try {
            const response = await api.getHashtagPosts(this.currentTag);
            const { posts, hashtag } = response;

            // Update stats
            const statsEl = document.getElementById('hashtag-stats');
            statsEl.innerHTML = `
                <span class="stat-item">
                    <strong>${hashtag.postCount || posts.length}</strong> posts
                </span>
            `;

            // Render posts grid
            this.renderPosts(posts);
        } catch (error) {
            console.error('Error loading hashtag posts:', error);
            this.renderError();
        }
    },

    renderPosts(posts) {
        const postsGrid = document.getElementById('hashtag-posts');

        if (!posts || posts.length === 0) {
            postsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hashtag" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                    <p class="text-secondary">No posts with this hashtag yet</p>
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
            </div>
        `).join('');
    },

    renderError() {
        const postsGrid = document.getElementById('hashtag-posts');
        postsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--error); margin-bottom: 16px;"></i>
                <p class="text-secondary">Failed to load posts</p>
                <button class="btn btn-primary" onclick="HashtagPage.loadHashtagPosts()">Retry</button>
            </div>
        `;
    }
};
