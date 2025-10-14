class AuthManager {
    constructor() {
        this.auth0Client = null;
        this.user = null;
        this.isAuthenticated = false;
        this.apiBaseUrl = Config.BACKEND_BASE_URL;
        this.onboardingModal = null;
    }

    async init() {
        try {
            // Initialize Auth0
            this.auth0Client = await auth0.createAuth0Client({
                domain: Config.AUTH0_DOMAIN,
                clientId: Config.AUTH0_CLIENT_ID,
                authorizationParams: {
                    redirect_uri: Config.AUTH0_REDIRECT_URI,
                    audience: Config.AUTH0_AUDIENCE,
                    scope: Config.AUTH0_SCOPE
                }
            });

            // Check if user is authenticated
            this.isAuthenticated = await this.auth0Client.isAuthenticated();

            if (this.isAuthenticated) {
                this.user = await this.auth0Client.getUser();
                await this.handleAuthenticatedUser();
            }

            // Handle redirect callback
            if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
                await this.handleRedirectCallback();
            }

            this.updateUI();
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    async handleRedirectCallback() {
        try {
            await this.auth0Client.handleRedirectCallback();
            this.isAuthenticated = await this.auth0Client.isAuthenticated();
            
            if (this.isAuthenticated) {
                this.user = await this.auth0Client.getUser();
                await this.handleAuthenticatedUser();
            }

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Redirect callback error:', error);
        }
    }

    async handleAuthenticatedUser() {
        try {
            // Get user session data from backend
            const sessionData = await this.getUserSession();
            
            if (sessionData) {
                // Merge backend data with Auth0 user data
                this.user = { ...this.user, ...sessionData };
                
                // Check if profile is completed
                if (!sessionData.profile_completed) {
                    // Show onboarding modal for first-time users
                    this.showOnboardingModal();
                } else {
                    // Update question count and other UI elements
                    this.updateQuestionCount(sessionData.daily_question_count || 0);
                }
            } else {
                // First time user - create session and show onboarding
                await this.createUserSession();
                this.showOnboardingModal();
            }
        } catch (error) {
            console.error('Error handling authenticated user:', error);
            // Still show onboarding if there's an error
            this.showOnboardingModal();
        }
    }

    async getUserSession() {
        try {
            const token = await this.getToken();
            const response = await fetch(`${this.apiBaseUrl}${Config.API_ENDPOINTS.USER_SESSION}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error getting user session:', error);
            return null;
        }
    }

    async createUserSession() {
        try {
            const token = await this.getToken();
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
                return await response.json();
            }
        } catch (error) {
            console.error('Error creating user session:', error);
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
            'Chest Pain / Palpitations',
            
            // Other
            'Sleep Disorders',
            'Multiple Chemical Sensitivity',
            'Other Chronic Condition',
            'Prefer not to say'
        ];

        return conditions.map(condition => `
            <label class="condition-checkbox">
                <input type="checkbox" name="conditions" value="${condition}">
                <span class="checkmark"></span>
                ${condition}
            </label>
        `).join('');
    }

    getHowHeardOptions() {
        const options = [
            'Search Engine (Google, Bing, etc.)',
            'Social Media (Facebook, Instagram, TikTok)',
            'Healthcare Provider Recommendation',
            'Long-Covid Support Group',
            'ME/CFS Support Group',
            'Dysautonomia Support Group',
            'Other Support Group or Forum',
            'Friend or Family Recommendation',
            'Medical Conference or Event',
            'Online Article or Blog',
            'YouTube or Video Platform',
            'Patient Advocacy Organization',
            'Other'
        ];

        return options.map(option => `<option value="${option}">${option}</option>`).join('');
    }

    async handleOnboardingSubmit(e) {
        e.preventDefault();
        
        const submitButton = document.getElementById('submitOnboarding');
        const errorDiv = document.getElementById('onboardingError');
        const loadingDiv = document.getElementById('onboardingLoading');
        
        // Show loading state
        submitButton.disabled = true;
        errorDiv.style.display = 'none';
        loadingDiv.style.display = 'block';

        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Get selected conditions
            const selectedConditions = Array.from(document.querySelectorAll('input[name="conditions"]:checked'))
                .map(cb => cb.value);
            
            if (selectedConditions.length === 0) {
                throw new Error('Please select at least one health condition.');
            }

            // Prepare submission data
            const submitData = {
                first_name: data.first_name,
                last_name: data.last_name,
                phone_number: data.phone_number || '',
                location: data.location || '',
                primary_condition: selectedConditions.join(', '),
                conditions: selectedConditions,
                how_heard_about_us: data.how_heard_about_us || ''
            };

            // Submit to backend
            const token = await this.getToken();
            const response = await fetch(`${this.apiBaseUrl}${Config.API_ENDPOINTS.PROFILE_COMPLETE}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to complete profile');
            }

            // Success - update user data and hide modal
            const result = await response.json();
            this.user = { ...this.user, ...result, profile_completed: true };
            this.hideOnboardingModal();
            this.updateUI();
            
            // Show success message
            this.showSuccessMessage('Profile completed successfully! Welcome to ChatDys.');

        } catch (error) {
            console.error('Onboarding error:', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            loadingDiv.style.display = 'none';
        }
    }

    async skipOnboarding() {
        try {
            // Mark profile as completed but with minimal data
            const token = await this.getToken();
            const response = await fetch(`${this.apiBaseUrl}${Config.API_ENDPOINTS.PROFILE_COMPLETE}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    first_name: this.user?.given_name || 'User',
                    last_name: this.user?.family_name || '',
                    primary_condition: 'Not specified',
                    conditions: ['Not specified']
                })
            });

            if (response.ok) {
                this.user = { ...this.user, profile_completed: true };
                this.hideOnboardingModal();
                this.updateUI();
            }
        } catch (error) {
            console.error('Skip onboarding error:', error);
            // Hide modal anyway
            this.hideOnboardingModal();
            this.updateUI();
        }
    }

    showSuccessMessage(message) {
        // Create temporary success message
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    async login() {
        try {
            await this.auth0Client.loginWithRedirect();
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    async logout() {
        try {
            await this.auth0Client.logout({
                logoutParams: {
                    returnTo: window.location.origin
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async getToken() {
        try {
            return await this.auth0Client.getTokenSilently();
        } catch (error) {
            console.error('Token error:', error);
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
            console.error('Send message error:', error);
            throw error;
        }
    }

    async incrementQuestionCount() {
        try {
            const token = await this.getToken();
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
            console.error('Increment question error:', error);
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
}

// Initialize auth manager
const authManager = new AuthManager();
window.authManager = authManager;

// Export for global access
window.AuthManager = AuthManager;