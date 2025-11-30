// Main Application Entry Point

class App {
    async init() {
        console.log('🚀 Social Sync - Initializing...');

        try {
            await Auth.init();
            Router.init();
            console.log('✅ Application ready!');
        } catch (error) {
            console.error('❌ Application initialization failed:', error);

            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="container">
                    <div class="card" style="padding: 48px; text-align: center; margin-top: 64px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: var(--error); margin-bottom: 16px;"></i>
                        <h3>Application Error</h3>
                        <p class="text-secondary" style="margin: 16px 0 24px;">
                            Failed to initialize the application. Please refresh the page.
                        </p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            Refresh Page
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}
