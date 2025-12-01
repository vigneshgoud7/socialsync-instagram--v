// Upload Page

const UploadPage = {
    selectedFiles: [],
    previewUrls: [],

    async render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="container-sm" style="padding-top: 24px;">
                <div class="card">
                    <div class="card-body" style="padding: 32px;">
                        <h2 style="margin-bottom: 24px;">Create New Post</h2>

                        <div id="upload-area" 
                             style="border: 2px dashed var(--border); border-radius: var(--radius-md); padding: 48px; text-align: center; cursor: pointer; transition: all 0.3s;"
                             ondragover="UploadPage.handleDragOver(event)"
                             ondragleave="UploadPage.handleDragLeave(event)"
                             ondrop="UploadPage.handleDrop(event)"
                             onclick="document.getElementById('file-input').click()">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                            <h3>Drag photos here</h3>
                            <p class="text-secondary">or click to select from your computer</p>
                            <input 
                                type="file" 
                                id="file-input" 
                                accept="image/*" 
                                multiple 
                                style="display: none;"
                                onchange="UploadPage.handleFileSelect(event)">
                        </div>

                        <div id="preview-area" style="display: none; margin-top: 24px;">
                            <div id="preview-images" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px;"></div>

                            <div class="form-group">
                                <label class="form-label">Caption</label>
                                <textarea 
                                    id="caption" 
                                    class="form-textarea" 
                                    placeholder="Write a caption..."
                                    maxlength="2200"
                                ></textarea>
                                <div style="text-align: right; font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                    <span id="caption-count">0</span>/2200
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Location (optional)</label>
                                <input 
                                    type="text" 
                                    id="location" 
                                    class="form-input" 
                                    placeholder="Add location">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Tag People (optional)</label>
                                <div style="position: relative;">
                                    <input 
                                        type="text" 
                                        id="tag-input" 
                                        class="form-input" 
                                        placeholder="Search for people to tag"
                                        autocomplete="off"
                                        oninput="UploadPage.searchUsers(event)">
                                    <div id="tag-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md); max-height: 200px; overflow-y: auto; z-index: 100; margin-top: 4px;"></div>
                                </div>
                                <div id="tagged-users" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;"></div>
                            </div>

                            <div style="display: flex; gap: 12px; margin-top: 24px;">
                                <button class="btn btn-secondary" onclick="UploadPage.reset()">
                                    Cancel
                                </button>
                                <button class="btn btn-primary" onclick="UploadPage.uploadPost()" id="upload-btn">
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.selectedFiles = [];
        this.previewUrls = [];
        this.taggedUsers = [];
        this.searchTimeout = null;

        // Setup caption counter
        const captionEl = document.getElementById('caption');
        if (captionEl) {
            captionEl.addEventListener('input', (e) => {
                document.getElementById('caption-count').textContent = e.target.value.length;
            });
        }

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#tag-input') && !e.target.closest('#tag-suggestions')) {
                const suggestions = document.getElementById('tag-suggestions');
                if (suggestions) suggestions.style.display = 'none';
            }
        });
    },

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('upload-area');
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.background = 'var(--background)';
    },

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('upload-area');
        uploadArea.style.borderColor = 'var(--border)';
        uploadArea.style.background = 'transparent';
    },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('upload-area');
        uploadArea.style.borderColor = 'var(--border)';
        uploadArea.style.background = 'transparent';

        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    },

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    },

    async processFiles(files) {
        // Validate files
        const validFiles = [];
        for (const file of files) {
            const validation = isValidImageFile(file);
            if (!validation.valid) {
                Toast.error(validation.error);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        // Maximum 10 images
        if (validFiles.length > 10) {
            Toast.warning('You can upload a maximum of 10 images');
            validFiles.splice(10);
        }

        this.selectedFiles = validFiles;

        // Create previews
        this.previewUrls = await Promise.all(
            validFiles.map(file => createImagePreview(file))
        );

        this.showPreviews();
    },

    showPreviews() {
        const uploadArea = document.getElementById('upload-area');
        const previewArea = document.getElementById('preview-area');
        const previewImages = document.getElementById('preview-images');

        uploadArea.style.display = 'none';
        previewArea.style.display = 'block';

        previewImages.innerHTML = this.previewUrls.map((url, index) => `
            <div style="position: relative; aspect-ratio: 1; border-radius: var(--radius-md); overflow: hidden;">
                <img src="${url}" 
                     alt="Preview ${index + 1}"
                     style="width: 100%; height: 100%; object-fit: cover;">
                <button 
                    onclick="UploadPage.removeImage(${index})"
                    style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    removeImage(index) {
        this.selectedFiles.splice(index, 1);
        this.previewUrls.splice(index, 1);

        if (this.selectedFiles.length === 0) {
            this.reset();
        } else {
            this.showPreviews();
        }
    },

    async uploadPost() {
        if (this.selectedFiles.length === 0) {
            Toast.error('Please select at least one image');
            return;
        }

        const caption = document.getElementById('caption').value.trim();
        const location = document.getElementById('location').value.trim();
        const uploadBtn = document.getElementById('upload-btn');

        try {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            await api.createPost({
                images: this.selectedFiles,
                caption,
                location,
                taggedUsers: this.taggedUsers.map(u => u._id)
            });

            Toast.success('Post shared successfully!');
            window.location.hash = '#/';
        } catch (error) {
            console.error('Upload error:', error);
            Toast.error(error.message || 'Failed to create post');
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Share';
        }
    },

    reset() {
        this.selectedFiles = [];
        this.previewUrls = [];
        this.taggedUsers = [];
        document.getElementById('upload-area').style.display = 'block';
        document.getElementById('preview-area').style.display = 'none';
        document.getElementById('file-input').value = '';
        document.getElementById('caption').value = '';
        document.getElementById('location').value = '';
        document.getElementById('caption-count').textContent = '0';
        document.getElementById('tag-input').value = '';
        document.getElementById('tagged-users').innerHTML = '';
        document.getElementById('tag-suggestions').style.display = 'none';
    },

    async searchUsers(event) {
        const query = event.target.value.trim();
        const suggestions = document.getElementById('tag-suggestions');

        if (query.length < 2) {
            suggestions.style.display = 'none';
            return;
        }

        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            try {
                const response = await api.searchUsers(query);
                const users = response.users.filter(u => {
                    // Exclude already tagged users
                    return !this.taggedUsers.some(tagged => tagged._id === u._id);
                });

                if (users.length === 0) {
                    suggestions.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-secondary);">No users found</div>';
                    suggestions.style.display = 'block';
                    return;
                }

                suggestions.innerHTML = users.map(user => `
                    <div class="user-suggestion" 
                         style="display: flex; align-items: center; padding: 12px; cursor: pointer; transition: background 0.2s;"
                         onmouseover="this.style.background='var(--background)'"
                         onmouseout="this.style.background='transparent'"
                         onclick="UploadPage.selectUser('${user._id}', '${escapeHtml(user.username)}', '${escapeHtml(user.fullName)}', '${escapeHtml(user.profilePicture?.url || '')}')">
                        <img src="${escapeHtml(user.profilePicture?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')}" 
                             style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 12px;"
                             onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'">
                        <div>
                            <div style="font-weight: 600;">${escapeHtml(user.username)}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(user.fullName)}</div>
                        </div>
                    </div>
                `).join('');
                suggestions.style.display = 'block';
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);
    },

    selectUser(id, username, fullName, profileUrl) {
        // Add to tagged users
        this.taggedUsers.push({ _id: id, username, fullName, profilePicture: { url: profileUrl } });

        // Update UI
        this.renderTaggedUsers();

        // Clear input and suggestions
        document.getElementById('tag-input').value = '';
        document.getElementById('tag-suggestions').style.display = 'none';
    },

    removeTaggedUser(id) {
        this.taggedUsers = this.taggedUsers.filter(u => u._id !== id);
        this.renderTaggedUsers();
    },

    renderTaggedUsers() {
        const container = document.getElementById('tagged-users');
        if (this.taggedUsers.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.taggedUsers.map(user => `
            <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--background); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 6px 10px;">
                <span style="font-size: 14px;">@${escapeHtml(user.username)}</span>
                <button onclick="UploadPage.removeTaggedUser('${user._id}')" 
                        style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 12px;"></i>
                </button>
            </div>
        `).join('');
    }
};
