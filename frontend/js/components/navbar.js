// Navbar Component

const Navbar = {
    currentUser: null,

    render(user) {
        this.currentUser = user;
        const navbar = document.getElementById('navbar');

        navbar.innerHTML = `
            <div class="navbar-content">
                <div class="navbar-logo" onclick="window.location.hash = '#/'">
                    Social Sync
                </div>
                
                <div class="navbar-search">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search" id="navbar-search-input">
                </div>
                
                <div class="navbar-actions">
                    <div class="nav-icon" onclick="window.location.hash = '#/'" title="Home">
                        <i class="fas fa-home"></i>
                    </div>
                    <div class="nav-icon" onclick="window.location.hash = '#/explore'" title="Explore">
                        <i class="fas fa-compass"></i>
                    </div>
                    <div class="nav-icon" onclick="window.location.hash = '#/upload'" title="Create">
                        <i class="far fa-plus-square"></i>
                    </div>
                    <div class="nav-icon" id="notifications-icon" title="Notifications">
                        <i class="far fa-heart"></i>
                        <span class="badge hidden" id="notifications-badge">0</span>
                    </div>
                    <img 
                        src="${escapeHtml(user.profilePicture.url)}" 
                        alt="${escapeHtml(user.username)}"
                        class="profile-pic-nav"
                        onclick="window.location.hash = '#/profile/${escapeHtml(user.username)}'"
                        onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"
                    />
                </div>
            </div>
        `;

        navbar.style.display = 'flex';
        this.setupSearch();
    },

    setupSearch() {
        const searchInput = document.getElementById('navbar-search-input');
        if (!searchInput) return;

        const performSearch = debounce(async (query) => {
            if (query.trim().length < 2) {
                this.hideSearchResults();
                return;
            }

            try {
                const response = await api.searchUsers(query);
                this.showSearchResults(response.users);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar-search')) {
                this.hideSearchResults();
            }
        });
    },

    showSearchResults(users) {
        let resultsContainer = document.getElementById('search-results');

        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'search-results';
            resultsContainer.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                margin-top: 8px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                max-height: 400px;
                overflow-y: auto;
                z-index: 1000;
            `;
            document.querySelector('.navbar-search').appendChild(resultsContainer);
        }

        if (users.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary);">No users found</div>';
            return;
        }

        resultsContainer.innerHTML = users.map(user => `
            <div class="search-result-item" style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" 
                 onmouseover="this.style.background='var(--background)'" 
                 onmouseout="this.style.background='transparent'"
                 onclick="window.location.hash = '#/profile/${escapeHtml(user.username)}'">
                <img src="${escapeHtml(user.profilePicture.url)}" 
                     alt="${escapeHtml(user.username)}"
                     style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;"
                     onerror="this.src='https://via.placeholder.com/44'">
                <div>
                    <div style="font-weight: 600; font-size: 14px;">${escapeHtml(user.username)}</div>
                    <div style="color: var(--text-secondary); font-size: 14px;">${escapeHtml(user.fullName)}</div>
                </div>
                ${user.isVerified ? '<i class="fas fa-check-circle" style="margin-left: auto; color: var(--primary);"></i>' : ''}
            </div>
        `).join('');
    },

    hideSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.remove();
        }
    },

    hide() {
        const navbar = document.getElementById('navbar');
        navbar.style.display = 'none';
    }
};
