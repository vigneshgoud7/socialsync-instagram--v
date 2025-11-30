// Router - SPA Navigation

const Router = {
    routes: {},
    currentRoute: null,

    init() {
        this.routes = {
            '/': () => this.authRequired(HomePage.render.bind(HomePage)),
            '/login': () => LoginPage.render(),
            '/signup': () => SignupPage.render(),
            '/profile/:username': (params) => this.authRequired(() => ProfilePage.render(params.username)),
            '/upload': () => this.authRequired(UploadPage.render.bind(UploadPage)),
            '/explore': () => this.authRequired(ExplorePage.render.bind(ExplorePage))
        };

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        let matchedRoute = null;
        let params = {};

        for (const [pattern, handler] of Object.entries(this.routes)) {
            const regex = this.patternToRegex(pattern);
            const match = hash.match(regex);

            if (match) {
                matchedRoute = handler;
                const paramNames = this.getParamNames(pattern);
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });
                break;
            }
        }

        if (matchedRoute) {
            this.currentRoute = hash;
            await matchedRoute(params);
        } else {
            this.show404();
        }
    },

    patternToRegex(pattern) {
        const regexPattern = pattern
            .replace(/\//g, '\\/')
            .replace(/:([^\/]+)/g, '([^\\/]+)');
        return new RegExp(`^${regexPattern}$`);
    },

    getParamNames(pattern) {
        const matches = pattern.match(/:([^\/]+)/g);
        if (!matches) return [];
        return matches.map(match => match.slice(1));
    },

    async authRequired(handler) {
        const isAuth = await Auth.requireAuth();
        if (isAuth) {
            const user = await Auth.getCurrentUser();
            Navbar.render(user);
            await handler();
        } else {
            Navbar.hide();
        }
    },

    show404() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container">
                <div class="card" style="padding: 48px; text-align: center; margin-top: 64px;">
                    <h1 style="font-size: 64px; margin-bottom: 16px;">404</h1>
                    <h3>Page Not Found</h3>
                    <p class="text-secondary" style="margin: 16px 0 24px;">
                        The page you're looking for doesn't exist.
                    </p>
                    <a href="#/" class="btn btn-primary">Go Home</a>
                </div>
            </div>
        `;
    },

    navigate(path) {
        window.location.hash = `#${path}`;
    }
};
