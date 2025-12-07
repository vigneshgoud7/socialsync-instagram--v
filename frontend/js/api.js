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

    async checkAvailability(field, value) {
        const queryParam = field === 'email' ? `email=${encodeURIComponent(value)}` : `username=${encodeURIComponent(value)}`;
        return await this.request(`/auth/check-availability?${queryParam}`);
    }


    // Users
    async searchUsers(query) {
        return await this.request(`/users/search?q=${encodeURIComponent(query)}`);
    }

    async getSuggestions() {
        return await this.request('/users/suggestions');
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

    async updateProfilePicture(file) {
        const formData = new FormData();
        formData.append('image', file);

        return await this.request('/users/profile-picture', {
            method: 'PUT',
            body: formData,
            isFormData: true
        });
    }

    async followUser(userId) {
        return await this.request(`/users/${userId}/follow`, { method: 'POST' });
    }

    async unfollowUser(userId) {
        return await this.request(`/users/${userId}/follow`, { method: 'DELETE' });
    }

    async getFollowers(userId) {
        return await this.request(`/users/${userId}/followers`);
    }

    async getFollowing(userId) {
        return await this.request(`/users/${userId}/following`);
    }

    async blockUser(userId) {
        return await this.request(`/users/${userId}/block`, { method: 'POST' });
    }

    async unblockUser(userId) {
        return await this.request(`/users/${userId}/block`, { method: 'DELETE' });
    }

    async getMutualFollowers(userId) {
        return await this.request(`/users/${userId}/mutual`);
    }

    async deleteAccount() {
        const response = await this.request('/users/account', { method: 'DELETE' });
        this.setToken(null);
        return response;
    }

    async getFollowRequests() {
        return await this.request('/users/follow-requests');
    }

    async acceptFollowRequest(userId) {
        return await this.request(`/users/${userId}/accept-request`, { method: 'POST' });
    }

    async rejectFollowRequest(userId) {
        return await this.request(`/users/${userId}/reject-request`, { method: 'DELETE' });
    }

    async getNotifications() {
        return await this.request('/users/notifications/all');
    }

    async markNotificationsRead() {
        return await this.request('/users/notifications/mark-read', { method: 'POST' });
    }


    // Posts
    async createPost(postData) {
        const formData = new FormData();
        if (postData.images) {
            postData.images.forEach(image => formData.append('images', image));
        }
        if (postData.caption) formData.append('caption', postData.caption);
        if (postData.location) formData.append('location', postData.location);
        if (postData.taggedUsers && postData.taggedUsers.length > 0) {
            formData.append('taggedUsers', JSON.stringify(postData.taggedUsers));
        }

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

    async archivePost(postId) {
        return await this.request(`/posts/${postId}/archive`, { method: 'POST' });
    }

    async unarchivePost(postId) {
        return await this.request(`/posts/${postId}/archive`, { method: 'DELETE' });
    }

    async getArchivedPosts() {
        return await this.request('/posts/archived/all');
    }

    async sharePost(postId) {
        return await this.request(`/posts/${postId}/share`, { method: 'POST' });
    }

    // Hashtags & Trending
    async getHashtagPosts(tag) {
        return await this.request(`/posts/hashtag/${tag}`);
    }

    async getTrendingHashtags(limit = 10) {
        return await this.request(`/posts/trending/hashtags?limit=${limit}`);
    }

    // Analytics
    async trackPostView(postId) {
        return await this.request(`/analytics/${postId}/view`, { method: 'POST' });
    }

    async getPostAnalytics(postId) {
        return await this.request(`/analytics/${postId}/analytics`);
    }

    async getProfileAnalytics() {
        return await this.request('/users/analytics/profile');
    }
}

const api = new APIClient();
