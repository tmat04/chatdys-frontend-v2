class SharedHeader {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.authManager = null;
        this.auth0Client = null;
        this.init();
    }

    init() {
        this.createHeader();
        this.setupEventListeners();
        this.initAuth();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        
        // Map filenames to page identifiers
        const pageMap = {
            'index': 'home',
            'chatdys-main-homepage': 'home',
            'health-tracker': 'health-tracker',
            'community-forum': 'community-forum',
            'community': 'community',
            'resources': 'resources',
            'faq': 'faq',
            'support': 'support',
            'premium-signup': 'premium',
            'terms-of-service': 'terms',
            'privacy-policy': 'privacy',
            'profile': 'profile',
            'settings': 'settings',
            'history': 'history'
        };

        return pageMap[filename] || 'home';
    }

    getLogoPath() {
        // Determine the correct path to assets based on current page location
        const path = window.location.pathname;
        const isInSubfolder = path.includes('/pages/') || path.includes('/');
        
        if (isInSubfolder && !path.endsWith('chatdys-main-homepage.html')) {
            return '../assets/ChatDysWideLogoTransparent.png';
        }
        return 'assets/ChatDysWideLogoTransparent.png';
    }

    createHeader() {
        const logoPath = this.getLogoPath();
        
        const headerHTML = `
            <header class="header">
                <div class="logo-section" onclick="sharedHeader.goToHome()" style="cursor: pointer;">
                    <img src="${logoPath}" alt="ChatDys" class="logo-img">
                    <span class="beta-badge">Beta</span>
                </div>
                <div class="auth-section">
                    <!-- Auth Button (Auth0 integration) -->
                    <button class="sign-in-btn" id="authButton" onclick="sharedHeader.login()">Sign In</button>
                    
                    <!-- User Menu (shown when logged in) -->
                    <div class="user-menu" id="userMenu" style="display: none;">
                        <div class="user-info" onclick="sharedHeader.toggleUserDropdown()">
                            <img id="userAvatar" src="https://via.placeholder.com/32" alt="User" class="user-avatar-img">
                            <span id="userName">User</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="user-dropdown" id="userDropdown">
                            <div class="dropdown-header">
                                <img id="userAvatarLarge" src="https://via.placeholder.com/40" alt="User" class="user-avatar-large-img">
                                <div class="user-details">
                                    <div class="user-name-large" id="userNameLarge">User</div>
                                    <div class="user-email" id="userEmail">user@example.com</div>
                                    <div class="user-status">
                                        <span class="premium-badge" id="premiumBadge" style="display: none;">Premium</span>
                                        <span class="free-badge" id="freeBadge" style="display: none;">Free Plan</span>
                                    </div>
                                    <div class="question-count" id="questionCountDisplay" style="display: none;">
                                        <span id="questionsRemaining">5</span> questions remaining today
                                    </div>
                                </div>
                            </div>
                            <div class="dropdown-divider"></div>
                            
                            <!-- Account Management -->
                            <div class="dropdown-section">
                                <div class="dropdown-section-title">Account</div>
                                <a href="${this.getPagePath('profile.html')}" class="dropdown-item ${this.currentPage === 'profile' ? 'current-page' : ''}">
                                    <span class="dropdown-icon">👤</span>
                                    Profile
                                </a>
                                <a href="${this.getPagePath('settings.html')}" class="dropdown-item ${this.currentPage === 'settings' ? 'current-page' : ''}">
                                    <span class="dropdown-icon">⚙️</span>
                                    Settings
                                </a>
                                <button class="dropdown-item" id="subscriptionButton" onclick="sharedHeader.manageSubscription()">
                                    <span class="dropdown-icon">💳</span>
                                    <span id="subscriptionText">Manage Subscription</span>
                                </button>
                            </div>
                            
                            <div class="dropdown-divider"></div>
                            
                            <!-- Features -->
                            <div class="dropdown-section">
                                <div class="dropdown-section-title">Features</div>
                                <a href="${this.getPagePath('health-tracker.html')}" class="dropdown-item ${this.currentPage === 'health-tracker' ? 'current-page' : ''}">
                                    <span class="dropdown-icon">📊</span>
                                    Health Tracker
                                </a>
                                <a href="${this.getPagePath('community.html')}" class="dropdown-item ${this.currentPage === 'community' ? 'current-page' : ''}">
                                    <span class="dropdown-icon">👥</span>
                                    Community
                                </a>
                                <a href="${this.getPagePath('resources.html')}" class="dropdown-item ${this.currentPage === 'resources' ? 'current-page' : ''}">
                                    <span class="dropdown-icon">📚</span>
                                    Resources
                                </a>
                                <a href="${this.getPagePath('history.html')}" class="dropdown-item ${this.currentPage === 'history' ? 'current-page' : ''}" id="historyButton" style="display: none;">
                                    <span class="dropdown-icon">📜</span>
                                    Chat History
                                </a>
                            </div>
                            
                            <div class="dropdown-divider"></div>
                            
                            <!-- Upgrade/Premium -->
                            <div class="dropdown-section" id="upgradeSection">
                                <a href="${this.getPagePath('premium-signup.html')}" class="dropdown-item premium-upgrade ${this.currentPage === 'premium' ? 'current-page' : ''}">
                                    <span class="dropdown-icon">⭐</span>
                                    Upgrade to Premium
                                </a>
                            </div>
                            
                            <div class="dropdown-divider"></div>
                            
                            <!-- Support -->
                            <div class="dropdown-section">
                                <div class="dropdown-section-title">Support</div>
                                <button class="dropdown-item" onclick="openFeedbackModal()">
                                    <span class="dropdown-icon">💬</span>
                                    Send Feedback
                                </button>
                                <a href="${this.getPagePath('support.html')}" class="dropdown-item ${this.currentPage === 'support' ? 'current-page' : ''}">
                                    <span class="dropdown-icon">❓</span>
                                    Help & Support
                                </a>
                            </div>
                            
                            <div class="dropdown-divider"></div>
                            
                            <!-- Account Actions -->
                            <button class="dropdown-item logout-item" onclick="sharedHeader.logout()">
                                <span class="dropdown-icon">🚪</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;

        // Insert header at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }

    getPagePath(filename) {
        // Determine correct path based on current location
        const path = window.location.pathname;
        const isInSubfolder = path.includes('/pages/') || (path.includes('/') && !path.endsWith('chatdys-main-homepage.html'));
        
        if (isInSubfolder) {
            // We're in a subfolder, need to go up
            if (filename === 'chatdys-main-homepage.html') {
                return '../chatdys-main-homepage.html';
            }
            return filename; // Same level for pages in pages folder
        } else {
            // We're in root, need to go into pages folder
            if (filename === 'chatdys-main-homepage.html') {
                return 'chatdys-main-homepage.html';
            }
            return `pages/${filename}`;
        }
    }

    setupEventListeners() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            const userMenu = document.querySelector('.user-menu');
            const dropdown = document.getElementById('userDropdown');
            
            if (userMenu && dropdown && !userMenu.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    async initAuth() {
        // Try to use existing auth manager if available
        if (window.authManager && typeof window.authManager.init === 'function') {
            this.authManager = window.authManager;
            this.connectToAuthManager();
            return;
        }

        // If auth manager not available, check Auth0 session directly
        await this.checkAuth0Session();
    }

    async checkAuth0Session() {
        try {
            // Check if Auth0 SDK is loaded
            if (typeof auth0 === 'undefined' || !window.Config) {
                console.log('Auth0 SDK or Config not loaded, waiting...');
                setTimeout(() => this.checkAuth0Session(), 500);
                return;
            }

            // Initialize Auth0 client
            this.auth0Client = await auth0.createAuth0Client({
                domain: window.Config.AUTH0_DOMAIN,
                clientId: window.Config.AUTH0_CLIENT_ID,
                authorizationParams: {
                    redirect_uri: window.Config.AUTH0_REDIRECT_URI,
                    audience: window.Config.AUTH0_AUDIENCE,
                    scope: window.Config.AUTH0_SCOPE
                },
                cacheLocation: 'localstorage',
                useRefreshTokens: true
            });

            // Check if user is authenticated
            const isAuthenticated = await this.auth0Client.isAuthenticated();
            
            if (isAuthenticated) {
                // Get user info
                const user = await this.auth0Client.getUser();
                
                // Get token and fetch backend user data
                const token = await this.auth0Client.getTokenSilently();
                
                try {
                    const response = await fetch(`${window.Config.BACKEND_BASE_URL}${window.Config.API_ENDPOINTS.USER_SESSION}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const backendUser = await response.json();
                        // Merge Auth0 user with backend user data
                        const fullUser = { ...user, ...backendUser };
                        this.updateUserInfo(fullUser);
                    } else {
                        // Backend failed, but Auth0 session is valid
                        this.updateUserInfo(user);
                    }
                } catch (error) {
                    console.log('Backend fetch failed, using Auth0 data only:', error);
                    this.updateUserInfo(user);
                }
            } else {
                // Not authenticated
                this.updateUserInfo(null);
            }
        } catch (error) {
            console.error('Error checking Auth0 session:', error);
            this.updateUserInfo(null);
        }
    }

    connectToAuthManager() {
        if (!this.authManager) return;
        
        // Override auth manager's updateUI method to also update header
        const originalUpdateUI = this.authManager.updateUI.bind(this.authManager);
        this.authManager.updateUI = () => {
            originalUpdateUI();
            this.updateUserInfo(this.authManager.isAuthenticated ? this.authManager.user : null);
        };
        
        // Initial update
        this.updateUserInfo(this.authManager.isAuthenticated ? this.authManager.user : null);
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        const userMenu = document.querySelector('.user-menu');
        
        dropdown.classList.toggle('show');
        userMenu.classList.toggle('active');
    }

    async login() {
        if (this.authManager) {
            this.authManager.login();
        } else if (this.auth0Client) {
            // Use Auth0 client directly
            await this.auth0Client.loginWithRedirect({
                authorizationParams: {
                    redirect_uri: window.location.origin + '/chatdys-main-homepage.html'
                }
            });
        } else {
            // Redirect to homepage for login
            window.location.href = this.getPagePath('chatdys-main-homepage.html');
        }
    }

    async logout() {
        if (this.authManager) {
            this.authManager.logout();
        } else if (this.auth0Client) {
            // Use Auth0 client directly
            await this.auth0Client.logout({
                logoutParams: {
                    returnTo: window.location.origin + '/chatdys-main-homepage.html'
                }
            });
        } else {
            // Redirect to homepage
            window.location.href = this.getPagePath('chatdys-main-homepage.html');
        }
    }

    goToProfile() {
        window.location.href = this.getPagePath('profile.html');
    }

    goToSettings() {
        window.location.href = this.getPagePath('settings.html');
    }

    goToHistory() {
        // Check if user is premium before allowing access
        const user = this.authManager?.user;
        const isPremium = user?.is_premium || user?.subscription === 'premium';
        
        if (isPremium) {
            window.location.href = this.getPagePath('history.html');
        } else {
            // Redirect to premium signup page
            window.location.href = this.getPagePath('premium-signup.html');
        }
    }

    goToHome() {
        window.location.href = this.getPagePath('chatdys-main-homepage.html');
    }

    manageSubscription() {
        const user = this.authManager?.user;
        
        if (user?.is_premium) {
            // Premium user - show subscription management
            if (user.stripe_customer_portal_url) {
                window.open(user.stripe_customer_portal_url, '_blank');
            } else {
                // Fallback to premium page
                window.location.href = this.getPagePath('premium-signup.html');
            }
        } else {
            // Free user - redirect to upgrade page
            window.location.href = this.getPagePath('premium-signup.html');
        }
    }

    // Update user info when authenticated
    updateUserInfo(user) {
        const userAvatar = document.getElementById('userAvatar');
        const userAvatarLarge = document.getElementById('userAvatarLarge');
        const userName = document.getElementById('userName');
        const userNameLarge = document.getElementById('userNameLarge');
        const userEmail = document.getElementById('userEmail');
        const authButton = document.getElementById('authButton');
        const userMenu = document.getElementById('userMenu');
        const premiumBadge = document.getElementById('premiumBadge');
        const freeBadge = document.getElementById('freeBadge');
        const historyButton = document.getElementById('historyButton');
        const questionCountDisplay = document.getElementById('questionCountDisplay');
        const questionsRemaining = document.getElementById('questionsRemaining');
        const subscriptionButton = document.getElementById('subscriptionButton');
        const subscriptionText = document.getElementById('subscriptionText');
        const upgradeSection = document.getElementById('upgradeSection');

        if (user) {
            // Show user menu, hide auth button
            if (authButton) authButton.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';

            // Update user info
            if (user.picture) {
                if (userAvatar) userAvatar.src = user.picture;
                if (userAvatarLarge) userAvatarLarge.src = user.picture;
            }
            
            const displayName = user.name || user.nickname || user.email?.split('@')[0] || 'User';
            if (userName) userName.textContent = displayName;
            if (userNameLarge) userNameLarge.textContent = displayName;
            
            if (user.email && userEmail) {
                userEmail.textContent = user.email;
            }

            // Handle premium status
            const isPremium = user.is_premium || user.subscription === 'premium';
            
            if (premiumBadge) {
                premiumBadge.style.display = isPremium ? 'inline-block' : 'none';
            }
            
            if (freeBadge) {
                freeBadge.style.display = isPremium ? 'none' : 'inline-block';
            }

            // Show/hide history button based on premium status
            if (historyButton) {
                historyButton.style.display = isPremium ? 'block' : 'none';
            }

            // Update subscription button text
            if (subscriptionText) {
                subscriptionText.textContent = isPremium ? 'Manage Subscription' : 'Upgrade to Premium';
            }

            // Show/hide upgrade section
            if (upgradeSection) {
                upgradeSection.style.display = isPremium ? 'none' : 'block';
            }

            // Update question count for free users
            if (!isPremium && user.questions_asked !== undefined) {
                const limit = window.Config?.LIMITS?.FREE_DAILY_QUESTIONS || 5;
                const remaining = Math.max(0, limit - user.questions_asked);
                
                if (questionCountDisplay) {
                    questionCountDisplay.style.display = 'block';
                }
                
                if (questionsRemaining) {
                    questionsRemaining.textContent = remaining;
                }
            } else {
                if (questionCountDisplay) {
                    questionCountDisplay.style.display = 'none';
                }
            }
        } else {
            // Show auth button, hide user menu
            if (authButton) authButton.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }
}

// Initialize shared header when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.sharedHeader = new SharedHeader();
    });
} else {
    window.sharedHeader = new SharedHeader();
}