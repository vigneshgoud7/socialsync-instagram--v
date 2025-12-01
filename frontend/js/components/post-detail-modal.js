// Post Detail Modal Component

const PostDetailModal = {
    render(post, isLiked = false, isSaved = false) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = `post-detail-modal-${post._id}`;

        modal.innerHTML = `
            <div class="modal-content post-detail-modal-content" onclick="event.stopPropagation()">
                <div class="post-detail-header">
                    <h3>Post</h3>
                    <button class="modal-close" onclick="PostDetailModal.close('${post._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="post-detail-body" id="post-detail-body-${post._id}">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            </div>
        `;

        modal.onclick = () => PostDetailModal.close(post._id);

        return modal;
    },

    async open(postId) {
        try {
            // Fetch the full post
            const response = await api.getPost(postId);
            const post = response.post;
            const isLiked = response.isLiked || false;

            // Check if post is saved
            const currentUser = await Auth.getCurrentUser();
            const isSaved = currentUser.savedPosts?.includes(postId) || false;

            // Create and show modal
            const modal = this.render(post, isLiked, isSaved);
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            // Load the post card into the modal
            await this.loadPost(post, isLiked, isSaved);
        } catch (error) {
            console.error('Error opening post detail:', error);
            Toast.error('Failed to load post');
        }
    },

    async loadPost(post, isLiked, isSaved) {
        const bodyEl = document.getElementById(`post-detail-body-${post._id}`);
        if (!bodyEl) return;

        // Create a post card and insert it
        const postCard = PostCard.render(post, isLiked, isSaved);
        postCard.style.margin = '0';
        postCard.style.border = 'none';
        postCard.style.borderRadius = '0';

        // Clear loading spinner and add post card
        bodyEl.innerHTML = '';
        bodyEl.appendChild(postCard);
    },

    close(postId) {
        const modal = document.getElementById(`post-detail-modal-${postId}`);
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }
};
