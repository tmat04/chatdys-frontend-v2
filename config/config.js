// ChatDys Configuration
window.Config = {
    // Auth0 Configuration
    AUTH0_DOMAIN: 'dev-5040302010.us.auth0.com',
    AUTH0_CLIENT_ID: 'fqzwP9fpJrY0c7FINxADguJhxjrOqnwV',
    AUTH0_REDIRECT_URI: window.location.origin,
    AUTH0_AUDIENCE: 'https://api.chatdys.com/',
    AUTH0_SCOPE: 'openid profile email',

    // Backend Configuration
    // IMPORTANT: Replace this with your actual deployed backend URL
    // For Railway: https://your-app-name.up.railway.app
    // For Render: https://your-app-name.onrender.com
    // For Fly.io: https://your-app-name.fly.dev
    BACKEND_BASE_URL: 'https://chatdys-backend-rail-production.up.railway.app',
    
    // Optional: Fallback backend URL for redundancy
    BACKEND_FALLBACK_URL: null,  // Set to a second backend URL if you have one

    // API Endpoints
    API_ENDPOINTS: {
        // User endpoints
        USER_SESSION: '/api/user/session',
        USER_PROFILE: '/api/user/profile',
        INCREMENT_QUESTION: '/api/user/increment-question',
        COMPLETE_PROFILE: '/api/user/complete-profile',
        USER_PREFERENCES: '/api/user/preferences',
        USER_USAGE: '/api/user/usage',
        CHECK_PREMIUM: '/api/user/check-premium',
        DELETE_ACCOUNT: '/api/user/account',
        
        // Auth endpoints
        VALIDATE_TOKEN: '/api/auth/validate-token',
        CHECK_AUTH: '/api/auth/check-auth',
        USER_INFO: '/api/auth/user-info',
        REFRESH_USER: '/api/auth/refresh-user',
        
        // Chat endpoints
        QUERY: '/api/query',
        CONVERSATIONS: '/api/conversations',
        CONVERSATION_DETAIL: '/api/conversations/',  // append conversation_id
        DELETE_CONVERSATION: '/api/conversations/',  // append conversation_id
        
        // Payment endpoints
        CREATE_CHECKOUT: '/api/payments/create-checkout-session',
        WEBHOOK: '/api/payments/webhook',
        CANCEL_SUBSCRIPTION: '/api/payments/cancel-subscription',
        
        // Health check
        HEALTH: '/health'
    },

    // App Configuration
    APP_NAME: 'ChatDys',
    VERSION: '1.0.0',
    
    // Limits
    LIMITS: {
        FREE_DAILY_QUESTIONS: 5,
        PREMIUM_DAILY_QUESTIONS: 1000
    },
    
    // Feature Flags
    FEATURES: {
        ONBOARDING_MODAL: true,
        PREMIUM_FEATURES: true,
        CHAT_HISTORY: true,
        HUBSPOT_INTEGRATION: true
    },
    
    // Stripe Configuration (for premium features)
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your-stripe-publishable-key',  // Replace with your actual key
    
    // Premium Pricing
    PREMIUM_PRICE: {
        MONTHLY: 9.99,
        YEARLY: 99.99
    }
};

// Initialize backend tracking
Config.currentBackendUrl = Config.BACKEND_BASE_URL;
Config.isUsingFallback = false;

// For debugging - remove in production
console.log('✅ Config loaded successfully');
console.log('🔧 Auth0 Domain:', Config.AUTH0_DOMAIN);
console.log('🔧 Backend URL:', Config.BACKEND_BASE_URL);
console.log('🔧 Redirect URI:', Config.AUTH0_REDIRECT_URI);