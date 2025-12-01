// Comment Modal Component

const CommentModal = {
    render(post) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = `comment-modal-${post._id}`;

        modal.innerHTML = `
            <div class="modal-content comment-modal-content" onclick="event.stopPropagation()">
                <div class="comment-modal-header">
                    <h3>Comments</h3>
                    <button class="modal-close" onclick="CommentModal.close('${post._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="comment-modal-post-preview">
                    <img src="${escapeHtml(post.images[0].url)}" 
                         alt="Post preview"
                         onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/d/d1/Image_not_available.png'">
                    <div class="post-preview-info">
                        <div class="post-author">
                            <img src="${escapeHtml(post.user.profilePicture.url)}" 
                                 alt="${escapeHtml(post.user.username)}"
                                 onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'">
                            <strong>${escapeHtml(post.user.username)}</strong>
                        </div>
                        ${post.caption ? `<p class="post-caption">${parseTextWithLinks(escapeHtml(post.caption))}</p>` : ''}
                    </div>
                </div>

                <div class="comment-modal-list" id="comment-list-${post._id}">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>

                <div class="comment-modal-input">
                    <input type="text" 
                           placeholder="Add a comment..." 
                           id="modal-comment-input-${post._id}"
                           onkeypress="if(event.key === 'Enter') CommentModal.addComment('${post._id}', this.value)">
                    <button onclick="CommentModal.addComment('${post._id}', document.getElementById('modal-comment-input-${post._id}').value)">
                        Post
                    </button>
                </div>
            </div>
        `;

        modal.onclick = () => CommentModal.close(post._id);

        return modal;
    },

    async open(postId) {
        try {
            // Fetch the full post with comments
            const response = await api.getPost(postId);
            const post = response.post;

            // Create and show modal
            const modal = this.render(post);
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            // Load comments
            await this.loadComments(post);

            // Focus input
            setTimeout(() => {
                const input = document.getElementById(`modal-comment-input-${postId}`);
                if (input) input.focus();
            }, 100);
        } catch (error) {
            console.error('Error opening comment modal:', error);
            Toast.error('Failed to load comments');
        }
    },

    async loadComments(post) {
        const listEl = document.getElementById(`comment-list-${post._id}`);
        if (!listEl) return;

        if (!post.comments || post.comments.length === 0) {
            listEl.innerHTML = `
                <div class="no-comments">
                    <i class="far fa-comment" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                    <p style="color: var(--text-secondary);">No comments yet.</p>
                    <p style="color: var(--text-secondary); font-size: 14px;">Be the first to comment!</p>
                </div>
            `;
            return;
        }

        const currentUser = await Auth.getCurrentUser();

        listEl.innerHTML = post.comments.map(comment => `
            <div class="comment-item" data-comment-id="${comment._id}">
                <img src="${escapeHtml(comment.user.profilePicture?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')}" 
                     alt="${escapeHtml(comment.user.username)}"
                     class="comment-avatar"
                     onclick="window.location.hash = '#/profile/${escapeHtml(comment.user.username)}'"
                     onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'">
                <div class="comment-content">
                    <div class="comment-header">
                        <strong onclick="window.location.hash = '#/profile/${escapeHtml(comment.user.username)}'" 
                                style="cursor: pointer;">
                            ${escapeHtml(comment.user.username)}
                        </strong>
                        <span class="comment-time">${formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p class="comment-text">${parseTextWithLinks(escapeHtml(comment.text))}</p>
                </div>
                ${currentUser._id === comment.user._id || currentUser._id === post.user._id ? `
                    <button class="comment-delete-btn" onclick="CommentModal.deleteComment('${post._id}', '${comment._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
    },

    async addComment(postId, text) {
        if (!text || text.trim().length === 0) {
            return;
        }

        try {
            await api.addComment(postId, text.trim());

            // Clear input
            const input = document.getElementById(`modal-comment-input-${postId}`);
            if (input) {
                input.value = '';
            }

            // Reload comments
            const response = await api.getPost(postId);
            await this.loadComments(response.post);

            // Update the post card comment count if visible
            this.updatePostCardCommentCount(postId, response.post.commentsCount);

            Toast.success('Comment added');
        } catch (error) {
            console.error('Error adding comment:', error);
            Toast.error(error.message || 'Failed to add comment');
        }
    },

    async deleteComment(postId, commentId) {
        Modal.confirm('Delete Comment', 'Are you sure you want to delete this comment?', async () => {
            try {
                await api.deleteComment(postId, commentId);

                // Reload comments
                const response = await api.getPost(postId);
                await this.loadComments(response.post);

                // Update the post card comment count if visible
                this.updatePostCardCommentCount(postId, response.post.commentsCount);

                Toast.success('Comment deleted');
            } catch (error) {
                console.error('Error deleting comment:', error);
                Toast.error('Failed to delete comment');
            }
        });
    },

    updatePostCardCommentCount(postId, count) {
        const card = document.querySelector(`[data-post-id="${postId}"]`);
        if (!card) return;

        const commentsLink = card.querySelector('.post-comments-link');
        if (count > 0) {
            if (commentsLink) {
                commentsLink.textContent = `View all ${count} ${count === 1 ? 'comment' : 'comments'}`;
            } else {
                // Add the link if it doesn't exist
                const postInfo = card.querySelector('.post-info');
                const timestamp = postInfo.querySelector('.post-timestamp');
                if (timestamp) {
                    const newLink = document.createElement('div');
                    newLink.className = 'post-comments-link';
                    newLink.style.cssText = 'color: var(--text-secondary); cursor: pointer; font-size: 14px; margin-top: 4px;';
                    newLink.textContent = `View all ${count} ${count === 1 ? 'comment' : 'comments'}`;
                    newLink.onclick = () => CommentModal.open(postId);
                    timestamp.parentNode.insertBefore(newLink, timestamp);
                }
            }
        } else if (commentsLink) {
            commentsLink.remove();
        }
    },

    close(postId) {
        const modal = document.getElementById(`comment-modal-${postId}`);
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }
};
