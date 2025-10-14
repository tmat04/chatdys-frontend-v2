/**
 * ChatDys Frontend Configuration
 * Environment-specific settings and authentication configuration with backend failover
 */

const Config = {
    // API Configuration with failover
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : 'https://api.chatdys.com/api',
    
    // Auth0 Configuration
    AUTH0_DOMAIN: 'dev-5040302010.us.auth0.com',
    AUTH0_CLIENT_ID: 'fqzwP9fpJrY0c7FINxADguJhxjrOqnwV',
    AUTH0_AUDIENCE: 'https://api.chatdys.com/',
    AUTH0_REDIRECT_URI: window.location.origin,
    AUTH0_SCOPE: 'openid profile email offline_access',
    
    // Backend API Configuration with failover
    BACKEND_BASE_URL: 'https://chatdys-backend-new.fly.dev',
    BACKEND_FALLBACK_URL: 'https://chatdys-backend.fly.dev',
    
    API_ENDPOINTS: {
        userSession: '/api/user/session',
        incrementQuestion: '/api/user/increment-question',
        completeProfile: '/api/user/complete-profile',
        query: '/api/query',
        conversations: '/api/conversations',
        payments: '/api/payments'
    },
    
    // Application Settings
    APP_NAME: 'ChatDys',
    APP_VERSION: '2.0.0',
    
    // Feature Flags
    FEATURES: {
        CONVERSATION_HISTORY: true,
        PREMIUM_SUBSCRIPTIONS: true,
        HEALTH_TRACKER: true,
        COMMUNITY_FORUM: false
    },
    
    // UI Settings
    UI: {
        THEME: 'default',
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500
    },
    
    // Limits
    LIMITS: {
        FREE_DAILY_QUESTIONS: 5,
        FREE_MONTHLY_QUESTIONS: 10,
        MAX_MESSAGE_LENGTH: 2000,
        MAX_CONVERSATION_TITLE_LENGTH: 100
    }
};

// Environment-specific overrides
if (window.location.hostname === 'chatdys.com') {
    // Production overrides
    Config.API_BASE_URL = 'https://api.chatdys.com/api';
    Config.BACKEND_BASE_URL = 'https://chatdys-backend-new.fly.dev';
    Config.BACKEND_FALLBACK_URL = 'https://chatdys-backend.fly.dev';
} else if (window.location.hostname.includes('staging')) {
    // Staging overrides
    Config.API_BASE_URL = 'https://staging-api.chatdys.com/api';
    Config.BACKEND_BASE_URL = 'https://staging-chatdys-backend.fly.dev';
    Config.BACKEND_FALLBACK_URL = 'https://chatdys-backend.fly.dev';
} else if (window.location.hostname === 'localhost') {
    // Development overrides
    Config.BACKEND_BASE_URL = 'http://localhost:8000';
    Config.BACKEND_FALLBACK_URL = 'https://chatdys-backend.fly.dev';
}

// Backend failover functionality
Config.currentBackendUrl = Config.BACKEND_BASE_URL;
Config.isUsingFallback = false;

Config.switchToFallback = function() {
    if (!this.isUsingFallback && this.BACKEND_FALLBACK_URL) {
        console.log(`🔄 Switching from ${this.currentBackendUrl} to fallback ${this.BACKEND_FALLBACK_URL}`);
        this.currentBackendUrl = this.BACKEND_FALLBACK_URL;
        this.isUsingFallback = true;
        return true;
    }
    return false;
};

Config.resetToPrimary = function() {
    if (this.isUsingFallback) {
        console.log(`🔄 Resetting to primary backend ${this.BACKEND_BASE_URL}`);
        this.currentBackendUrl = this.BACKEND_BASE_URL;
        this.isUsingFallback = false;
    }
};

// Enhanced fetch function with automatic failover
Config.fetchWithFailover = async function(endpoint, options = {}) {
    const makeRequest = async (baseUrl) => {
        const url = `${baseUrl}${endpoint}`;
        console.log(`🌐 Making request to: ${url}`);
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    };

    try {
        // Try primary backend
        return await makeRequest(this.currentBackendUrl);
    } catch (error) {
        console.warn(`❌ Primary backend failed: ${error.message}`);
        
        // Try fallback if available and not already using it
        if (this.switchToFallback()) {
            try {
                console.log(`🔄 Trying fallback backend...`);
                return await makeRequest(this.currentBackendUrl);
            } catch (fallbackError) {
                console.error(`❌ Fallback backend also failed: ${fallbackError.message}`);
                throw new Error(`Both backends failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
            }
        } else {
            throw error;
        }
    }
};

// Create AUTH_CONFIG object for compatibility with auth-manager.js
const AUTH_CONFIG = {
    auth0: {
        domain: Config.AUTH0_DOMAIN,
        clientId: Config.AUTH0_CLIENT_ID,
        audience: Config.AUTH0_AUDIENCE,
        redirectUri: Config.AUTH0_REDIRECT_URI,
        scope: Config.AUTH0_SCOPE
    },
    api: {
        baseUrl: Config.BACKEND_BASE_URL,
        fallbackUrl: Config.BACKEND_FALLBACK_URL,
        endpoints: Config.API_ENDPOINTS
    },
    app: {
        freeUserQuestionLimit: Config.LIMITS.FREE_DAILY_QUESTIONS,
        maxCharacterLimit: Config.LIMITS.MAX_MESSAGE_LENGTH
    }
};

// Export configurations
window.Config = Config;
window.AUTH_CONFIG = AUTH_CONFIG;

// Debug logging for production troubleshooting
console.log('ChatDys Config loaded with failover:', {
    environment: window.location.hostname,
    primaryBackend: Config.BACKEND_BASE_URL,
    fallbackBackend: Config.BACKEND_FALLBACK_URL,
    currentBackend: Config.currentBackendUrl,
    auth0Domain: Config.AUTH0_DOMAIN
});

// Health check both backends on load
(async function checkBackendHealth() {
    const checkHealth = async (url, name) => {
        try {
            const response = await fetch(`${url}/health`, { 
                method: 'GET',
                timeout: 5000 
            });
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${name} backend healthy:`, data);
                return true;
            }
        } catch (error) {
            console.warn(`❌ ${name} backend unhealthy:`, error.message);
            return false;
        }
    };

    const primaryHealthy = await checkHealth(Config.BACKEND_BASE_URL, 'Primary');
    const fallbackHealthy = await checkHealth(Config.BACKEND_FALLBACK_URL, 'Fallback');
    
    // Switch to fallback if primary is down but fallback is up
    if (!primaryHealthy && fallbackHealthy && !Config.isUsingFallback) {
        Config.switchToFallback();
        console.log('🔄 Automatically switched to fallback backend due to primary being unhealthy');
    }
})();