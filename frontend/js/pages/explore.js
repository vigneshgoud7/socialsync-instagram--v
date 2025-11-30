// Explore Page

const ExplorePage = {
    async render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="container" style="padding-top: 24px;">
                <h2 style="margin-bottom: 24px;">Explore</h2>
                <div id="explore-grid" class="profile-grid"></div>
                <div id="explore-loading" style="text-align: center; padding: 32px;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                </div>
            </div>
        `;

        await this.loadExplorePosts();
    },

    async loadExplorePosts() {
        try {
            // For explore, we'll load the general feed
            const response = await api.getFeed(1, 30);
            const grid = document.getElementById('explore-grid');
            const loading = document.getElementById('explore-loading');

            if (response.posts.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 48px;">
                        <i class="fas fa-search" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                        <h3>No posts to explore yet</h3>
                        <p class="text-secondary">Create your first post or follow some users!</p>
                    </div>
                `;
            } else {
                grid.innerHTML = response.posts.map(post => `
                    <div class="profile-grid-item" onclick="alert('Post detail view - Post ID: ${post._id}')">
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

            loading.style.display = 'none';
        } catch (error) {
            console.error('Failed to load explore posts:', error);
            Toast.error('Failed to load posts');
        }
    }
};
