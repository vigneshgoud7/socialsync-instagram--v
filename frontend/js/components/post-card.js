// Post Card Component

const PostCard = {
    render(post, isLiked = false, isSaved = false) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.postId = post._id;

        const currentSlide = 0;
        const totalImages = post.images.length;

        card.innerHTML = `
            <div class="post-header">
                <div class="post-author" onclick="window.location.hash = '#/profile/${escapeHtml(post.user.username)}'">
                    <img src="${escapeHtml(post.user.profilePicture.url)}" 
                         alt="${escapeHtml(post.user.username)}"
                         class="post-avatar"
                         onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'">
                    <div>
                        <div style="font-weight: 600; font-size: 14px;">
                            ${escapeHtml(post.user.username)}
                            ${post.user.isVerified ? '<i class="fas fa-check-circle" style="color: var(--primary); margin-left: 4px;"></i>' : ''}
                        </div>
                        ${post.location ? `<div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(post.location)}</div>` : ''}
                    </div>
                </div>
                <button class="action-btn" onclick="PostCard.showOptions('${post._id}', '${post.user._id}')">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>

            <div class="post-image-container">
                ${totalImages > 1 ? `
                    <button class="post-image-nav prev" onclick="PostCard.prevImage('${post._id}')" style="${currentSlide === 0 ? 'display: none;' : ''}">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                ` : ''}
                <div class="post-images" data-current="${currentSlide}">
                    ${post.images.map((img, index) => `
                        <img src="${escapeHtml(img.url)}" 
                             alt="Post image" 
                             class="post-image ${index === 0 ? 'active' : ''}"
                             style="display: ${index === 0 ? 'block' : 'none'};"
                             onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/d/d1/Image_not_available.png'">
                    `).join('')}
                </div>
                ${totalImages > 1 ? `
                    <button class="post-image-nav next" onclick="PostCard.nextImage('${post._id}')">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <div class="post-indicators">
                        ${post.images.map((_, index) => `
                            <div class="indicator ${index === 0 ? 'active' : ''}"></div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="post-actions">
                <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="PostCard.toggleLike('${post._id}', this)">
                    <i class="fa${isLiked ? 's' : 'r'} fa-heart"></i>
                </button>
                <button class="action-btn" onclick="PostCard.focusComment('${post._id}')">
                    <i class="far fa-comment"></i>
                </button>
                <button class="action-btn" onclick="ShareModal.open('${post._id}')">
                    <i class="far fa-paper-plane"></i>
                </button>
                <div class="post-actions-right">
                    <button class="action-btn ${isSaved ? 'saved' : ''}" onclick="PostCard.toggleSave('${post._id}', this)">
                        <i class="fa${isSaved ? 's' : 'r'} fa-bookmark"></i>
                    </button>
                </div>
            </div>

            <div class="post-info">
                <div class="post-likes" id="likes-${post._id}">
                    <strong>${formatNumber(post.likesCount || post.likes?.length || 0)} likes</strong>
                </div>
                ${post.taggedUsers && post.taggedUsers.length > 0 ? `
                    <div style="margin-top: 4px; font-size: 14px;">
                        <span style="color: var(--text-secondary);">with</span>
                        ${post.taggedUsers.map((user, index) => `
                            <a href="#/profile/${escapeHtml(user.username)}" 
                               style="color: var(--text-primary); font-weight: 600; text-decoration: none;"
                               onmouseover="this.style.textDecoration='underline'"
                               onmouseout="this.style.textDecoration='none'">
                                ${escapeHtml(user.username)}
                            </a>${index < post.taggedUsers.length - 1 ? ', ' : ''}
                        `).join('')}
                    </div>
                ` : ''}
                ${post.caption ? `
                    <div class="post-caption">
                        <strong>${escapeHtml(post.user.username)}</strong>
                        ${parseTextWithLinks(escapeHtml(post.caption))}
                    </div>
                ` : ''}
                ${post.commentsCount > 0 ? `
                    <div class="post-comments-link" style="color: var(--text-secondary); cursor: pointer; font-size: 14px; margin-top: 4px;"
                         onclick="CommentModal.open('${post._id}')">
                        View all ${post.commentsCount} comments
                    </div>
                ` : ''}
                <div class="post-timestamp">
                    ${formatTimeAgo(post.createdAt)}
                </div>
            </div>

            <div class="post-add-comment">
                <input type="text" 
                       placeholder="Add a comment..." 
                       id="comment-input-${post._id}"
                       onkeypress="if(event.key === 'Enter') PostCard.addComment('${post._id}', this.value)">
                <button onclick="PostCard.addComment('${post._id}', document.getElementById('comment-input-${post._id}').value)"
                        style="font-weight: 600;">
                    Post
                </button>
            </div>
        `;

        return card;
    },

    nextImage(postId) {
        const card = document.querySelector(`[data-post-id="${postId}"]`);
        const container = card.querySelector('.post-images');
        const images = container.querySelectorAll('.post-image');
        const indicators = card.querySelectorAll('.indicator');
        const current = parseInt(container.dataset.current);
        const next = current + 1;

        if (next < images.length) {
            images[current].style.display = 'none';
            images[next].style.display = 'block';
            indicators[current].classList.remove('active');
            indicators[next].classList.add('active');
            container.dataset.current = next;

            card.querySelector('.prev').style.display = 'flex';
            if (next === images.length - 1) {
                card.querySelector('.next').style.display = 'none';
            }
        }
    },

    prevImage(postId) {
        const card = document.querySelector(`[data-post-id="${postId}"]`);
        const container = card.querySelector('.post-images');
        const images = container.querySelectorAll('.post-image');
        const indicators = card.querySelectorAll('.indicator');
        const current = parseInt(container.dataset.current);
        const prev = current - 1;

        if (prev >= 0) {
            images[current].style.display = 'none';
            images[prev].style.display = 'block';
            indicators[current].classList.remove('active');
            indicators[prev].classList.add('active');
            container.dataset.current = prev;

            card.querySelector('.next').style.display = 'flex';
            if (prev === 0) {
                card.querySelector('.prev').style.display = 'none';
            }
        }
    },

    async toggleLike(postId, button) {
        try {
            const isLiked = button.classList.contains('liked');
            const icon = button.querySelector('i');

            if (isLiked) {
                await api.unlikePost(postId);
                button.classList.remove('liked');
                icon.className = 'far fa-heart';
            } else {
                await api.likePost(postId);
                button.classList.add('liked');
                icon.className = 'fas fa-heart';
            }

            const response = await api.getPost(postId);
            const likesEl = document.getElementById(`likes-${postId}`);
            if (likesEl) {
                likesEl.innerHTML = `<strong>${formatNumber(response.post.likesCount)} likes</strong>`;
            }
        } catch (error) {
            Toast.error('Failed to update like status');
        }
    },

    async toggleSave(postId, button) {
        try {
            const isSaved = button.classList.contains('saved');
            const icon = button.querySelector('i');

            if (isSaved) {
                await api.unsavePost(postId);
                button.classList.remove('saved');
                icon.className = 'far fa-bookmark';
                Toast.success('Post removed from saved');
            } else {
                await api.savePost(postId);
                button.classList.add('saved');
                icon.className = 'fas fa-bookmark';
                Toast.success('Post saved');
            }
        } catch (error) {
            Toast.error('Failed to save post');
        }
    },

    focusComment(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        if (input) {
            input.focus();
        }
    },

    async addComment(postId, text) {
        if (!text || text.trim().length === 0) {
            return;
        }

        try {
            await api.addComment(postId, text.trim());
            const input = document.getElementById(`comment-input-${postId}`);
            if (input) {
                input.value = '';
            }

            // Fetch updated post to get new comment count
            const response = await api.getPost(postId);
            const post = response.post;

            // Update comment count display
            const card = document.querySelector(`[data-post-id="${postId}"]`);
            if (card) {
                const postInfo = card.querySelector('.post-info');
                let commentsLink = postInfo.querySelector('.post-comments-link');

                if (post.commentsCount > 0) {
                    if (commentsLink) {
                        commentsLink.textContent = `View all ${post.commentsCount} ${post.commentsCount === 1 ? 'comment' : 'comments'}`;
                    } else {
                        // Create the comments link if it doesn't exist
                        const timestamp = postInfo.querySelector('.post-timestamp');
                        if (timestamp) {
                            commentsLink = document.createElement('div');
                            commentsLink.className = 'post-comments-link';
                            commentsLink.style.cssText = 'color: var(--text-secondary); cursor: pointer; font-size: 14px; margin-top: 4px;';
                            commentsLink.textContent = `View all ${post.commentsCount} ${post.commentsCount === 1 ? 'comment' : 'comments'}`;
                            commentsLink.onclick = () => CommentModal.open(postId);
                            timestamp.parentNode.insertBefore(commentsLink, timestamp);
                        }
                    }
                }
            }

            Toast.success('Comment added');
        } catch (error) {
            Toast.error(error.message || 'Failed to add comment');
        }
    },

    async showOptions(postId, postUserId) {
        const currentUser = await Auth.getCurrentUser();
        const isOwnPost = currentUser._id === postUserId;

        const options = isOwnPost
            ? ['Delete', 'Edit', 'Cancel']
            : ['Report', 'Cancel'];

        Modal.showOptions(options, async (option) => {
            if (option === 'Delete') {
                Modal.confirm('Delete Post', 'Are you sure you want to delete this post?', async () => {
                    try {
                        await api.deletePost(postId);
                        const card = document.querySelector(`[data-post-id="${postId}"]`);
                        if (card) {
                            card.remove();
                        }
                        Toast.success('Post deleted');
                    } catch (error) {
                        Toast.error('Failed to delete post');
                    }
                });
            }
        });
    }
};
