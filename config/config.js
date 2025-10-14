/**
 * ChatDys Frontend Configuration
 * Environment-specific settings and authentication configuration
 */

const Config = {
    // API Configuration
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : 'https://api.chatdys.com/api',
    
    // Auth0 Configuration
    AUTH0_DOMAIN: 'dev-5040302010.us.auth0.com',
    AUTH0_CLIENT_ID: 'fqzwP9fpJrY0c7FINxADguJhxjrOqnwV',
    AUTH0_AUDIENCE: 'https://api.chatdys.com/',
    AUTH0_REDIRECT_URI: window.location.origin,
    AUTH0_SCOPE: 'openid profile email offline_access',
    
    // Backend API Configuration
    BACKEND_BASE_URL: 'https://chatdys-backend.fly.dev',
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
    BACKEND_BASE_URL: 'https://chatdys-backend-new.fly.dev',
} else if (window.location.hostname.includes('staging')) {
    // Staging overrides
    Config.API_BASE_URL = 'https://staging-api.chatdys.com/api';
    Config.BACKEND_BASE_URL = 'https://staging-chatdys-backend.fly.dev';
} else if (window.location.hostname === 'localhost') {
    // Development overrides
    Config.BACKEND_BASE_URL = 'http://localhost:8000';
}

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