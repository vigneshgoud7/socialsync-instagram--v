// API Client

const API_BASE_URL = 'http://localhost:3000/api';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const config = {
                ...options,
                headers: this.getHeaders(options.isFormData),
                credentials: 'include'
            };

            if (options.isFormData) {
                delete config.isFormData;
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        this.setToken(data.token);
        return data;
    }

    async login(credentials) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                emailOrUsername: credentials.emailOrUsername,
                password: credentials.password
            })
        });
        this.setToken(data.token);
        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.setToken(null);
        }
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    // Users
    async searchUsers(query) {
        return await this.request(`/users/search?q=${encodeURIComponent(query)}`);
    }

    async getUserProfile(username) {
        return await this.request(`/users/${username}`);
    }

    async updateProfile(profileData) {
        return await this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async followUser(userId) {
        return await this.request(`/users/${userId}/follow`, { method: 'POST' });
    }

    async unfollowUser(userId) {
        return await this.request(`/users/${userId}/follow`, { method: 'DELETE' });
    }

    // Posts
    async createPost(postData) {
        const formData = new FormData();
        if (postData.images) {
            postData.images.forEach(image => formData.append('images', image));
        }
        if (postData.caption) formData.append('caption', postData.caption);
        if (postData.location) formData.append('location', postData.location);

        return await this.request('/posts', {
            method: 'POST',
            body: formData,
            isFormData: true
        });
    }

    async getFeed(page = 1, limit = 10) {
        return await this.request(`/posts/feed?page=${page}&limit=${limit}`);
    }

    async getPost(postId) {
        return await this.request(`/posts/${postId}`);
    }

    async getUserPosts(userId) {
        return await this.request(`/posts/user/${userId}`);
    }

    async deletePost(postId) {
        return await this.request(`/posts/${postId}`, { method: 'DELETE' });
    }

    async likePost(postId) {
        return await this.request(`/posts/${postId}/like`, { method: 'POST' });
    }

    async unlikePost(postId) {
        return await this.request(`/posts/${postId}/like`, { method: 'DELETE' });
    }

    async addComment(postId, text) {
        return await this.request(`/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }

    async deleteComment(postId, commentId) {
        return await this.request(`/posts/${postId}/comment/${commentId}`, { method: 'DELETE' });
    }

    async savePost(postId) {
        return await this.request(`/posts/${postId}/save`, { method: 'POST' });
    }

    async unsavePost(postId) {
        return await this.request(`/posts/${postId}/save`, { method: 'DELETE' });
    }

    async getSavedPosts() {
        return await this.request('/posts/saved/all');
    }
}

const api = new APIClient();
