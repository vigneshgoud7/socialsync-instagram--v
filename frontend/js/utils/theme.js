// Theme Management System

class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.theme);
        this.listenForSystemThemeChanges();
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Dispatch custom event for components to react to theme changes
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        return newTheme;
    }

    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }

    getCurrentTheme() {
        return this.theme;
    }

    listenForSystemThemeChanges() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!this.getStoredTheme()) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                }
            });
        }
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
window.themeManager = themeManager;
