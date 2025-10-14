# ChatDys Frontend

Clean, modular frontend for ChatDys AI assistant using vanilla HTML, CSS, and JavaScript.

## Architecture

```
chatdys-frontend/
├── pages/
│   ├── index.html        # Main chat interface
│   ├── profile.html      # User profile page
│   ├── settings.html     # User settings page
│   ├── history.html      # Conversation history (premium)
│   ├── premium.html      # Premium upgrade page
│   └── faq.html         # FAQ page
├── css/
│   └── main.css         # Main stylesheet
├── js/
│   ├── auth.js          # Authentication module
│   ├── chat.js          # Chat functionality
│   └── main.js          # Main application logic
├── assets/
│   ├── *.png            # Images and logos
│   └── *.ico            # Favicons
└── config/
    └── config.js        # Configuration settings
```

## Features

- **Modular Architecture**: Clean separation of concerns
- **Vanilla JavaScript**: No framework dependencies
- **Responsive Design**: Works on all devices
- **Auth0 Integration**: Secure authentication
- **Streaming Responses**: Real-time AI chat
- **Premium Features**: Subscription-based enhancements
- **Progressive Enhancement**: Works without JavaScript

## Setup

1. **Serve Static Files**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using nginx (production)
   # Configure nginx to serve from this directory
   ```

2. **Configuration**:
   Update `config/config.js` with your environment settings.

3. **Backend Connection**:
   Ensure the backend API is running and accessible.

## File Structure

### Pages
- **index.html**: Main chat interface with 5-section responses
- **profile.html**: User profile management
- **settings.html**: User preferences and account settings
- **history.html**: Conversation history for premium users
- **premium.html**: Subscription upgrade page
- **faq.html**: Frequently asked questions

### JavaScript Modules
- **auth.js**: Handles Auth0 authentication and user session
- **chat.js**: Manages AI chat functionality and streaming
- **main.js**: Application initialization and global utilities

### Styling
- **main.css**: Complete responsive stylesheet with:
  - Header and navigation
  - Chat interface
  - Form components
  - Cards and layouts
  - Mobile responsiveness

## API Integration

The frontend communicates with the backend through REST APIs:

```javascript
// Authentication
GET /api/user/session
POST /api/auth/verify

// Chat
POST /api/chat/query (streaming)
GET /api/chat/history

// Payments
POST /api/payments/create-checkout-session
GET /api/payments/subscription-status
```

## Authentication Flow

1. User clicks "Sign In"
2. Redirected to Auth0 login
3. Auth0 redirects back with authorization code
4. Frontend exchanges code for JWT token
5. Token used for all API requests
6. User session loaded from backend

## Chat Flow

1. User enters question
2. Frontend sends to `/api/chat/query`
3. Backend streams 5-section response
4. Frontend updates UI in real-time
5. Conversation saved for premium users

## Deployment

### Development
```bash
# Serve locally
python -m http.server 8000
# Visit http://localhost:8000/pages/
```

### Production
```nginx
server {
    listen 443 ssl http2;
    server_name chatdys.com;
    
    root /var/www/chatdys-frontend;
    index pages/index.html;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /pages/index.html;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Adding New Features

### New Page
1. Create HTML file in `pages/`
2. Add navigation link in header
3. Include required CSS/JS modules
4. Update routing if needed

### New JavaScript Module
1. Create module file in `js/`
2. Export functions/classes
3. Import in `main.js` or specific pages
4. Follow existing patterns

### New API Integration
1. Add endpoint calls in relevant module
2. Handle authentication tokens
3. Implement error handling
4. Update UI accordingly

## Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Features Used**: 
  - ES6+ JavaScript
  - CSS Grid and Flexbox
  - Fetch API
  - Async/Await

## Performance

- **Minimal Dependencies**: Only Auth0 SDK
- **Optimized Assets**: Compressed images
- **Efficient CSS**: Mobile-first responsive design
- **Lazy Loading**: Content loaded as needed

## Security

- **CSP Headers**: Content Security Policy
- **HTTPS Only**: Secure connections required
- **Token Storage**: Secure token handling
- **Input Validation**: Client-side validation

This modular frontend architecture makes it easy to add new features like community forums, additional AI models, or enhanced user management without breaking existing functionality.
