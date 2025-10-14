/**
 * ChatDys Main Application
 * Initializes and coordinates all modules
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('ChatDys application starting...');
    
    try {
        // Initialize authentication
        await authManager.init();
        
        // Initialize chat functionality
        chatManager.init();
        
        // Setup global event listeners
        setupGlobalEventListeners();
        
        console.log('ChatDys application initialized successfully');
        
    } catch (error) {
        console.error('Error initializing ChatDys application:', error);
    }
});

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Auth button click handler
    const authButton = document.getElementById('authButton');
    if (authButton) {
        authButton.addEventListener('click', () => {
            authManager.login();
        });
    }

    // User dropdown toggle
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) {
                dropdown.classList.toggle('show');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && authManager.isAuthenticated()) {
            // Refresh user session when page becomes visible
            authManager.loadUserSession().then(() => {
                authManager.updateUI();
            });
        }
    });
}

/**
 * Utility functions
 */

// Show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<span class="loading-spinner"></span> Loading...';
    }
}

// Hide loading state
function hideLoading(elementId, content = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

// Show error message
function showError(message, elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="error-message">${message}</div>`;
        }
    } else {
        alert(message);
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Truncate text
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export utility functions globally
window.ChatDysUtils = {
    showLoading,
    hideLoading,
    showError,
    formatDate,
    truncateText,
    debounce
};
