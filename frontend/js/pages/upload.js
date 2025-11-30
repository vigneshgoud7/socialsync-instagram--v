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

        // Setup caption counter
        const captionEl = document.getElementById('caption');
        if (captionEl) {
            captionEl.addEventListener('input', (e) => {
                document.getElementById('caption-count').textContent = e.target.value.length;
            });
        }
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
                location
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
        document.getElementById('upload-area').style.display = 'block';
        document.getElementById('preview-area').style.display = 'none';
        document.getElementById('file-input').value = '';
        document.getElementById('caption').value = '';
        document.getElementById('location').value = '';
        document.getElementById('caption-count').textContent = '0';
    }
};
