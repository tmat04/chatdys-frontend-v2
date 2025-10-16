class AuthManager {
    constructor() {
        this.auth0Client = null;
        this.user = null;
        this.isAuthenticated = false;
        this.apiBaseUrl = Config.BACKEND_BASE_URL;
        this.onboardingModal = null;
        this.tokenRefreshInterval = null;
    }

    async init() {
        try {
            console.log('🔐 Initializing Auth0...');
            console.log('📍 Domain:', Config.AUTH0_DOMAIN);
            console.log('📍 Client ID:', Config.AUTH0_CLIENT_ID);
            console.log('📍 Audience:', Config.AUTH0_AUDIENCE);
            
            // Initialize Auth0
            this.auth0Client = await auth0.createAuth0Client({
                domain: Config.AUTH0_DOMAIN,
                clientId: Config.AUTH0_CLIENT_ID,
                authorizationParams: {
                    redirect_uri: Config.AUTH0_REDIRECT_URI,
                    audience: Config.AUTH0_AUDIENCE,
                    scope: Config.AUTH0_SCOPE
                },
                cacheLocation: 'localstorage',  // Persist tokens across page refreshes
                useRefreshTokens: true  // Enable refresh tokens for long-lived sessions
            });

            console.log('✅ Auth0 client created successfully');

            // Check if user is authenticated
            this.isAuthenticated = await this.auth0Client.isAuthenticated();
            console.log('🔍 Is authenticated:', this.isAuthenticated);

            if (this.isAuthenticated) {
                this.user = await this.auth0Client.getUser();
                console.log('👤 User from Auth0:', this.user);
                await this.handleAuthenticatedUser();
            }

            // Handle redirect callback
            if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
                console.log('🔄 Handling Auth0 redirect callback...');
                await this.handleRedirectCallback();
            }

            this.updateUI();
        } catch (error) {
            console.error('❌ Auth initialization error:', error);
            this.showErrorToast('Authentication initialization failed. Please refresh the page.');
        }
    }

    async handleRedirectCallback() {
        try {
            await this.auth0Client.handleRedirectCallback();
            this.isAuthenticated = await this.auth0Client.isAuthenticated();
            
            if (this.isAuthenticated) {
                this.user = await this.auth0Client.getUser();
                console.log('✅ User authenticated via callback:', this.user);
                await this.handleAuthenticatedUser();
            }

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('❌ Redirect callback error:', error);
            this.showErrorToast('Login failed. Please try again.');
        }
    }

    async handleAuthenticatedUser() {
        try {
            console.log('🔄 Handling authenticated user...');
            
            // IMPORTANT: Don't fail the entire auth flow if backend is down
            // Keep user logged in with Auth0 data even if backend fails
            
            try {
                // Get user session data from backend
                const sessionData = await this.getUserSession();
                
                if (sessionData) {
                    console.log('✅ Got user session from backend:', sessionData);
                    // Merge backend data with Auth0 user data
                    this.user = { ...this.user, ...sessionData };
                    
                    // Check if profile is completed
                    if (!sessionData.profile_completed && !sessionData.onboarding_completed) {
                        // Show onboarding modal for first-time users
                        this.showOnboardingModal();
                    } else {
                        // Update question count and other UI elements
                        this.updateQuestionCount(sessionData.daily_question_count || 0);
                    }
                } else {
                    console.log('⚠️ No session data from backend, user might be new');
                    // User might be new, try to create session
                    const newSession = await this.createUserSession();
                    if (newSession) {
                        this.user = { ...this.user, ...newSession };
                    }
                    this.showOnboardingModal();
                }
            } catch (backendError) {
                console.warn('⚠️ Backend communication failed, but user is still logged in via Auth0:', backendError);
                // User stays logged in with Auth0 data
                // Show a warning but don't break the auth flow
                this.showWarningToast('Some features may be limited. Backend connection issue.');
            }
            
            // Sync to HubSpot if enabled
            if (Config.FEATURES.HUBSPOT_INTEGRATION) {
                this.syncToHubSpot().catch(err => console.warn('HubSpot sync failed:', err));
            }
            
        } catch (error) {
            console.error('❌ Error handling authenticated user:', error);
            // Don't throw - keep user logged in
        }
    }

    async getUserSession() {
        try {
            const token = await this.getToken();
            if (!token) {
                console.warn('⚠️ No token available for getUserSession');
                return null;
            }

            console.log('📡 Fetching user session from backend...');
            const response = await fetch(`${this.apiBaseUrl}${Config.API_ENDPOINTS.USER_SESSION}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ User session retrieved successfully');
                return data;
            } else {
                console.warn('⚠️ Backend returned non-OK status:', response.status);
                return null;
            }
        } catch (error) {
            console.error('❌ Error getting user session:', error);
            return null;
        }
    }

    async createUserSession() {
        try {
            const token = await this.getToken();
            if (!token) {
                console.warn('⚠️ No token available for createUserSession');
                return null;
            }

            console.log('📡 Creating user session in backend...');
            const response = await fetch(`${this.apiBaseUrl}${Config.API_ENDPOINTS.USER_SESSION}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.user.email,
                    name: this.user.name,
                    auth0_user_id: this.user.sub
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ User session created successfully');
                return data;
            } else {
                console.warn('⚠️ Failed to create user session:', response.status);
                return null;
            }
        } catch (error) {
            console.error('❌ Error creating user session:', error);
            return null;
        }
    }

    async syncToHubSpot() {
        try {
            if (!this.user || !this.user.email) {
                console.log('⚠️ No user data for HubSpot sync');
                return;
            }

            const token = await this.getToken();
            if (!token) return;

            console.log('📡 Syncing user to HubSpot CRM...');
            
            const hubspotData = {
                email: this.user.email,
                firstname: this.user.given_name || this.user.name?.split(' ')[0] || '',
                lastname: this.user.family_name || this.user.name?.split(' ').slice(1).join(' ') || '',
                phone: this.user.phone_number || '',
                lifecyclestage: this.user.is_premium ? 'customer' : 'lead',
                hs_lead_status: this.user.profile_completed ? 'OPEN' : 'NEW',
                chatdys_user_id: this.user.id || this.user.sub,
                chatdys_signup_date: new Date().toISOString(),
                chatdys_is_premium: this.user.is_premium ? 'true' : 'false',
                chatdys_question_count: this.user.question_count || 0
            };

            const response = await fetch(`${this.apiBaseUrl}/api/hubspot/sync-contact`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(hubspotData)
            });

            if (response.ok) {
                console.log('✅ User synced to HubSpot successfully');
            } else {
                console.warn('⚠️ HubSpot sync failed:', response.status);
            }
        } catch (error) {
            console.error('❌ HubSpot sync error:', error);
            // Don't throw - this is not critical
        }
    }

    showOnboardingModal() {
        // Create onboarding modal if it doesn't exist
        if (!this.onboardingModal) {
            this.createOnboardingModal();
        }
        
        // Show the modal
        this.onboardingModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    hideOnboardingModal() {
        if (this.onboardingModal) {
            this.onboardingModal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    createOnboardingModal() {
        const modalHTML = `
            <div id="onboardingModal" class="onboarding-modal">
                <div class="onboarding-content">
                    <div class="onboarding-header">
                        <img src="assets/ChatDysWideLogoTransparent.png" alt="ChatDys" class="onboarding-logo">
                        <h2>Welcome to ChatDys!</h2>
                        <p>Help us personalize your experience by sharing some information about your health conditions.</p>
                    </div>

                    <div class="privacy-notice">
                        <h4>Information Use & Privacy</h4>
                        <p>The information you provide helps us personalize your ChatDys experience and connect you with relevant health resources. Your data is used to improve our AI responses and may be shared with our CRM system for support purposes. We are committed to protecting your privacy and will never sell your personal information to third parties.</p>
                    </div>

                    <form id="onboardingForm" class="onboarding-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName">First Name *</label>
                                <input type="text" id="firstName" name="first_name" required value="${this.user?.given_name || ''}">
                            </div>
                            <div class="form-group">
                                <label for="lastName">Last Name *</label>
                                <input type="text" id="lastName" name="last_name" required value="${this.user?.family_name || ''}">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="phoneNumber">Phone Number</label>
                            <input type="tel" id="phoneNumber" name="phone_number" placeholder="(555) 123-4567">
                        </div>

                        <div class="form-group">
                            <label for="location">Location</label>
                            <input type="text" id="location" name="location" placeholder="City, State/Country">
                        </div>

                        <div class="form-group">
                            <label>Health Conditions *</label>
                            <p class="form-help">Select all that apply to you:</p>
                            <div class="conditions-grid" id="conditionsGrid">
                                ${this.getConditionsHTML()}
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="howHeard">How did you hear about ChatDys?</label>
                            <select id="howHeard" name="how_heard_about_us">
                                <option value="">Select an option</option>
                                ${this.getHowHeardOptions()}
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="authManager.skipOnboarding()">Skip for now</button>
                            <button type="submit" class="btn-primary" id="submitOnboarding">Complete Profile</button>
                        </div>
                    </form>

                    <div id="onboardingError" class="error-message" style="display: none;"></div>
                    <div id="onboardingLoading" class="loading-message" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>Completing your profile...</p>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.onboardingModal = document.getElementById('onboardingModal');

        // Add event listeners
        document.getElementById('onboardingForm').addEventListener('submit', (e) => this.handleOnboardingSubmit(e));
    }

    getConditionsHTML() {
        const conditions = [
            // Long-Covid and Related
            'Long-Covid / Post-Covid Syndrome',
            'Post-Viral Syndrome',
            'Myalgic Encephalomyelitis (ME)',
            'Chronic Fatigue Syndrome (CFS)',
            'ME/CFS',
            
            // Dysautonomia Conditions
            'POTS (Postural Orthostatic Tachycardia Syndrome)',
            'Neurocardiogenic Syncope',
            'Orthostatic Hypotension',
            'Inappropriate Sinus Tachycardia',
            'Other Dysautonomia Condition',
            
            // Common Comorbidities
            'Ehlers-Danlos Syndrome',
            'Mast Cell Activation Syndrome (MCAS)',
            'Small Fiber Neuropathy',
            'Fibromyalgia',
            'Gastroparesis',
            'Autoimmune Conditions',
            
            // Neurological
            'Brain Fog / Cognitive Dysfunction',
            'Migraine / Headache Disorders',
            'Neuropathy',
            
            // Respiratory/Cardiac
            'Exercise Intolerance',
            'Shortness of Breath / Dyspnea',
            'Palpitations / Tachycardia',
            
            // Other
            'Chronic Pain',
            'Sleep Disorders',
            'Anxiety / Depression',
            'Other (please specify in preferences)'
        ];

        return conditions.map(condition => `
            <label class="condition-checkbox">
                <input type="checkbox" name="conditions" value="${condition}">
                <span>${condition}</span>
            </label>
        `).join('');
    }

    getHowHeardOptions() {
        const options = [
            'Social Media (Facebook, Instagram, Twitter)',
            'Reddit',
            'Support Group',
            'Healthcare Provider',
            'Friend or Family',
            'Search Engine (Google, Bing)',
            'Online Article or Blog',
            'Other'
        ];

        return options.map(option => `<option value="${option}">${option}</option>`).join('');
    }

    async handleOnboardingSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitButton = document.getElementById('submitOnboarding');
        const errorDiv = document.getElementById('onboardingError');
        const loadingDiv = document.getElementById('onboardingLoading');
        
        try {
            // Show loading
            submitButton.disabled = true;
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            
            // Get form data
            const formData = new FormData(form);
            const selectedConditions = Array.from(form.querySelectorAll('input[name="conditions"]:checked'))
                .map(cb => cb.value);
            
            // Prepare profile data
            const profileData = {
                age: null,  // You can add age field if needed
                conditions: selectedConditions,
                symptoms: [],  // Can be collected in a future step
                medications: [],  // Can be collected in a future step
                preferences: {
                    first_name: formData.get('first_name'),
                    last_name: formData.get('last_name'),
                    phone_number: formData.get('phone_number'),
                    location: formData.get('location'),
                    how_heard_about_us: formData.get('how_heard_about_us')
                }
            };
            
            // Send to backend
            const token = await this.getToken();
            const response = await fetch(`${this.apiBaseUrl}${Config.API_ENDPOINTS.COMPLETE_PROFILE}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to complete profile');
            }
            
            const result = await response.json();
            
            // Update user data
            this.user.profile_completed = true;
            this.user.onboarding_completed = true;
            this.user.conditions = selectedConditions;
            this.user.preferences = profileData.preferences;
            
            // Sync to HubSpot with updated info
            if (Config.FEATURES.HUBSPOT_INTEGRATION) {
                await this.syncToHubSpot();
            }
            
            // Hide modal
            this.hideOnboardingModal();
            
            // Show success message
            this.showSuccessToast('Profile completed successfully! Welcome to ChatDys.');
            
            // Update UI
            this.updateUI();
            
        } catch (error) {
            console.error('Onboarding error:', error);
            errorDiv.textContent = 'Failed to complete profile. Please try again.';
            errorDiv.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            loadingDiv.style.display = 'none';
        }
    }

    async skipOnboarding() {
        // Mark as skipped but don't complete profile
        this.hideOnboardingModal();
        this.showInfoToast('You can complete your profile later in Settings.');
    }

    showErrorToast(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showWarningToast(message) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning-toast';
        warningDiv.textContent = message;
        warningDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(warningDiv);
        
        setTimeout(() => {
            warningDiv.remove();
        }, 5000);
    }

    showInfoToast(message) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'info-toast';
        infoDiv.textContent = message;
        infoDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(infoDiv);
        
        setTimeout(() => {
            infoDiv.remove();
        }, 3000);
    }

    showSuccessToast(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-toast';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4ECDC4;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    async login() {
        try {
            console.log('🔐 Initiating login...');
            await this.auth0Client.loginWithRedirect();
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showErrorToast('Login failed. Please try again.');
        }
    }

    async logout() {
        try {
            console.log('🔐 Logging out...');
            await this.auth0Client.logout({
                logoutParams: {
                    returnTo: window.location.origin
                }
            });
        } catch (error) {
            console.error('❌ Logout error:', error);
            this.showErrorToast('Logout failed. Please try again.');
        }
    }

    async getToken() {
        try {
            const token = await this.auth0Client.getTokenSilently({
                cacheMode: 'on',
                timeoutInSeconds: 60
            });
            return token;
        } catch (error) {
            console.error('❌ Token error:', error);
            
            // If token is expired or invalid, try to re-authenticate
            if (error.error === 'login_required' || error.error === 'consent_required') {
                console.log('🔄 Token expired, redirecting to login...');
                await this.login();
            } else if (error.error === 'timeout') {
                console.warn('⚠️ Token fetch timeout, retrying...');
                // Retry once
                try {
                    return await this.auth0Client.getTokenSilently({ cacheMode: 'off' });
                } catch (retryError) {
                    console.error('❌ Token retry failed:', retryError);
                }
            }
            
            return null;
        }
    }

    async sendMessage(question) {
        try {
            // Check if user can ask questions
            if (!this.canAskQuestions()) {
                throw new Error('Daily question limit reached. Upgrade to Premium for unlimited questions.');
            }

            const token = await this.getToken();
            if (!token) {
                throw new Error('Authentication required. Please log in again.');
            }

            const response = await fetch(`${this.apiBaseUrl}${Config.API_ENDPOINTS.QUERY}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to send message');
            }

            const result = await response.json();
            
            // Increment question count for free users
            if (!this.user?.is_premium) {
                await this.incrementQuestionCount();
            }

            return result;
        } catch (error) {
            console.error('❌ Send message error:', error);
            throw error;
        }
    }

    async incrementQuestionCount() {
        try {
            const token = await this.getToken();
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}${Config.API_ENDPOINTS.INCREMENT_QUESTION}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.updateQuestionCount(result.daily_question_count);
            }
        } catch (error) {
            console.error('❌ Increment question error:', error);
        }
    }

    canAskQuestions() {
        if (this.user?.is_premium) {
            return true;
        }
        
        const dailyCount = this.user?.daily_question_count || 0;
        return dailyCount < Config.LIMITS.FREE_DAILY_QUESTIONS;
    }

    updateQuestionCount(count) {
        if (this.user) {
            this.user.daily_question_count = count;
        }

        // Update UI elements
        const questionCountElement = document.getElementById('questionCount');
        const maxQuestionsElement = document.getElementById('maxQuestions');
        const usageInfo = document.getElementById('usageInfo');
        const premiumUpgrade = document.getElementById('premiumUpgrade');

        if (questionCountElement && maxQuestionsElement) {
            const remaining = Math.max(0, Config.LIMITS.FREE_DAILY_QUESTIONS - count);
            questionCountElement.textContent = remaining;
            maxQuestionsElement.textContent = Config.LIMITS.FREE_DAILY_QUESTIONS;
        }

        // Show/hide usage info and upgrade prompts
        if (this.user?.is_premium) {
            if (usageInfo) usageInfo.classList.remove('show');
            if (premiumUpgrade) premiumUpgrade.classList.remove('show');
        } else {
            if (usageInfo) usageInfo.classList.add('show');
            if (count >= Config.LIMITS.FREE_DAILY_QUESTIONS && premiumUpgrade) {
                premiumUpgrade.classList.add('show');
            }
        }
    }

    updateUI() {
        // Update main page UI
        const authButton = document.getElementById('authButton');
        const userMenu = document.getElementById('userMenu');
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');

        if (this.isAuthenticated && this.user) {
            // Hide auth button, show user menu
            if (authButton) authButton.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';

            // Enable chat interface
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.placeholder = 'Ask ChatDys about your health conditions...';
            }
            if (sendButton) sendButton.disabled = false;

            // Update user info in dropdown
            this.updateUserDropdown();
            
            // Update question count
            this.updateQuestionCount(this.user.daily_question_count || 0);

        } else {
            // Show auth button, hide user menu
            if (authButton) authButton.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';

            // Disable chat interface
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = 'Please sign in to start chatting...';
            }
            if (sendButton) sendButton.disabled = true;
        }

        // Update shared header if available
        if (window.sharedHeader) {
            window.sharedHeader.updateUserInfo(this.isAuthenticated ? this.user : null);
        }
    }

    updateUserDropdown() {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        const premiumBadge = document.getElementById('premiumBadge');
        const historyButton = document.getElementById('historyButton');

        if (this.user) {
            const displayName = this.user.name || this.user.nickname || this.user.email?.split('@')[0] || 'User';
            
            if (userName) userName.textContent = displayName;
            if (userEmail) userEmail.textContent = this.user.email || '';
            if (userAvatar && this.user.picture) userAvatar.src = this.user.picture;
            
            // Show premium badge if user is premium
            if (premiumBadge) {
                premiumBadge.style.display = this.user.is_premium ? 'inline-block' : 'none';
            }
            
            // Show history button for premium users
            if (historyButton) {
                historyButton.style.display = this.user.is_premium ? 'block' : 'none';
            }
        }
    }

    isAuthenticatedUser() {
        return this.isAuthenticated;
    }

    getUser() {
        return this.user;
    }
}

// Initialize auth manager
const authManager = new AuthManager();
window.authManager = authManager;

// Export for global access
window.AuthManager = AuthManager;

console.log('✅ AuthManager loaded successfully');