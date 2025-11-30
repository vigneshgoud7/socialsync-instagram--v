// Home Page - Feed

const HomePage = {
    currentPage: 1,
    isLoading: false,
    hasMore: true,
    cleanupScroll: null,

    async render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="container-sm" style="padding-top: 24px;">
                <div id="feed-container"></div>
                <div id="feed-loading" style="display: none; text-align: center; padding: 32px;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                </div>
                <div id="feed-end" style="display: none; text-align: center; padding: 32px; color: var(--text-secondary);">
                    You're all caught up!
                </div>
            </div>
        `;

        this.currentPage = 1;
        this.hasMore = true;
        await this.loadPosts();

        this.cleanupScroll = setupInfiniteScroll(() => this.loadMore());
    },

    async loadPosts() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        const loadingEl = document.getElementById('feed-loading');
        if (loadingEl) loadingEl.style.display = 'block';

        try {
            const response = await api.getFeed(this.currentPage, 10);
            const container = document.getElementById('feed-container');

            if (response.posts.length === 0 && this.currentPage === 1) {
                container.innerHTML = `
                    <div class="card" style="padding: 48px; text-align: center; margin-top: 32px;">
                        <i class="fas fa-camera" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                        <h3>Welcome to Social Sync!</h3>
                        <p class="text-secondary" style="margin: 16px 0 24px;">
                            Start following people to see their posts in your feed.
                        </p>
                        <button class="btn btn-primary" onclick="window.location.hash = '#/explore'">
                            Explore
                        </button>
                    </div>
                `;
                this.hasMore = false;
            } else {
                response.posts.forEach(post => {
                    const currentUser = Auth.currentUser;
                    const isLiked = post.likes.includes(currentUser._id);
                    const isSaved = currentUser.savedPosts?.includes(post._id) || false;
                    const postCard = PostCard.render(post, isLiked, isSaved);
                    container.appendChild(postCard);
                });

                this.hasMore = response.hasMore;

                if (!this.hasMore) {
                    document.getElementById('feed-end').style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Failed to load feed:', error);
            Toast.error('Failed to load posts');
        } finally {
            this.isLoading = false;
            if (loadingEl) loadingEl.style.display = 'none';
        }
    },

    async loadMore() {
        if (this.hasMore && !this.isLoading) {
            this.currentPage++;
            await this.loadPosts();
        }
    },

    cleanup() {
        if (this.cleanupScroll) {
            this.cleanupScroll();
            this.cleanupScroll = null;
        }
    }
};
