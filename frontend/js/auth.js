// Authentication Manager

const Auth = {
    currentUser: null,

    isAuthenticated() {
        return !!api.token;
    },

    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            const response = await api.getCurrentUser();
            this.currentUser = response.user;
            return this.currentUser;
        } catch (error) {
            console.error('Failed to get current user:', error);
            this.logout();
            return null;
        }
    },

    async requireAuth() {
        const user = await this.getCurrentUser();
        if (!user) {
            window.location.hash = '#/login';
            return false;
        }
        return true;
    },

    async init() {
        if (this.isAuthenticated()) {
            try {
                await this.getCurrentUser();
            } catch (error) {
                this.logout();
            }
        }
    },

    logout() {
        this.currentUser = null;
        api.setToken(null);
        window.location.hash = '#/login';
    },

    updateUser(userData) {
        if (this.currentUser) {
            this.currentUser = { ...this.currentUser, ...userData };
        }
    }
};
