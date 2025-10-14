// ChatDys Configuration
window.Config = {
    // Auth0 Configuration
    AUTH0_DOMAIN: 'your-domain.auth0.com',  // Replace with your actual Auth0 domain
    AUTH0_CLIENT_ID: 'your-client-id',      // Replace with your actual Auth0 client ID
    AUTH0_REDIRECT_URI: window.location.origin,
    AUTH0_AUDIENCE: 'https://api.chatdys.com/',
    AUTH0_SCOPE: 'openid profile email',

    // Backend Configuration
    BACKEND_BASE_URL: 'https://your-backend-url.com',  // Replace with your actual backend URL

    // API Endpoints
    API_ENDPOINTS: {
        USER_SESSION: '/api/user/session',
        USER_PROFILE: '/api/user/profile',
        CONVERSATIONS: '/api/conversations',
        QUERY: '/api/query'
    },

    // App Configuration
    APP_NAME: 'ChatDys',
    VERSION: '1.0.0',
    
    // Feature Flags
    FEATURES: {
        ONBOARDING_MODAL: true,
        PREMIUM_FEATURES: true,
        CHAT_HISTORY: true
    }
};

// For debugging - remove in production
console.log('Config loaded:', window.Config);
