// Share Modal Component

const ShareModal = {
    render(post) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = `share-modal-${post._id}`;

        // Generate share URL (assuming the app is at localhost:5500 or similar)
        const shareUrl = `${window.location.origin}${window.location.pathname}#/post/${post._id}`;

        modal.innerHTML = `
            <div class="modal-content share-modal-content" onclick="event.stopPropagation()">
                <div class="share-modal-header">
                    <h3>Share Post</h3>
                    <button class="modal-close" onclick="ShareModal.close('${post._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="share-modal-body">
                    <div class="share-post-preview">
                        <img src="${escapeHtml(post.images[0].url)}" 
                             alt="Post preview"
                             onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/d/d1/Image_not_available.png'">
                        <div class="share-post-info">
                            <strong>${escapeHtml(post.user.username)}</strong>
                            ${post.caption ? `<p>${escapeHtml(post.caption.substring(0, 100))}${post.caption.length > 100 ? '...' : ''}</p>` : ''}
                        </div>
                    </div>

                    <div class="share-options">
                        <button class="share-option-btn copy-link" onclick="ShareModal.copyLink('${post._id}', '${shareUrl.replace(/'/g, "\\'")}')">
                            <div class="share-icon">
                                <i class="fas fa-link"></i>
                            </div>
                            <span>Copy Link</span>
                        </button>

                        <button class="share-option-btn" onclick="ShareModal.shareToFacebook('${shareUrl.replace(/'/g, "\\'")}')">
                            <div class="share-icon facebook">
                                <i class="fab fa-facebook-f"></i>
                            </div>
                            <span>Facebook</span>
                        </button>

                        <button class="share-option-btn" onclick="ShareModal.shareToTwitter('${shareUrl.replace(/'/g, "\\'")}', '${escapeHtml(post.caption || 'Check out this post!').replace(/'/g, "\\'")}')">
                            <div class="share-icon twitter">
                                <i class="fab fa-twitter"></i>
                            </div>
                            <span>Twitter</span>
                        </button>

                        <button class="share-option-btn" onclick="ShareModal.shareToWhatsApp('${shareUrl.replace(/'/g, "\\'")}', '${escapeHtml(post.caption || 'Check out this post!').replace(/'/g, "\\'")}')">
                            <div class="share-icon whatsapp">
                                <i class="fab fa-whatsapp"></i>
                            </div>
                            <span>WhatsApp</span>
                        </button>

                        <button class="share-option-btn" onclick="ShareModal.shareToLinkedIn('${shareUrl.replace(/'/g, "\\'")}')">
                            <div class="share-icon linkedin">
                                <i class="fab fa-linkedin-in"></i>
                            </div>
                            <span>LinkedIn</span>
                        </button>

                        <button class="share-option-btn" onclick="ShareModal.shareToReddit('${shareUrl.replace(/'/g, "\\'")}', '${escapeHtml(post.caption || 'Check out this post!').replace(/'/g, "\\'")}')">
                            <div class="share-icon reddit">
                                <i class="fab fa-reddit-alien"></i>
                            </div>
                            <span>Reddit</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.onclick = () => ShareModal.close(post._id);

        return modal;
    },

    async open(postId) {
        try {
            // Fetch the post
            const response = await api.getPost(postId);
            const post = response.post;

            // Create and show modal
            const modal = this.render(post);
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error opening share modal:', error);
            Toast.error('Failed to load post');
        }
    },

    async copyLink(postId, url) {
        try {
            await navigator.clipboard.writeText(url);
            Toast.success('Link copied to clipboard!');

            // Visual feedback
            const btn = event.target.closest('.share-option-btn');
            if (btn) {
                btn.classList.add('copied');
                setTimeout(() => btn.classList.remove('copied'), 2000);
            }
        } catch (error) {
            console.error('Error copying link:', error);
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                Toast.success('Link copied to clipboard!');
            } catch (err) {
                Toast.error('Failed to copy link');
            }
            document.body.removeChild(textarea);
        }
    },

    shareToFacebook(url) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    },

    shareToTwitter(url, text) {
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    },

    shareToWhatsApp(url, text) {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        window.open(whatsappUrl, '_blank');
    },

    shareToLinkedIn(url) {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(linkedinUrl, '_blank', 'width=600,height=400');
    },

    shareToReddit(url, title) {
        const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        window.open(redditUrl, '_blank', 'width=600,height=400');
    },

    close(postId) {
        const modal = document.getElementById(`share-modal-${postId}`);
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }
};
