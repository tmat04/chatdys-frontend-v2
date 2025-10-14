// Fixed Feedback Modal Implementation - Based on working React components
// Converted from React/TypeScript to vanilla JavaScript

class FeedbackModal {
    constructor() {
        this.isOpen = false;
        this.isSubmitting = false;
        this.isSuccess = false;
        this.modal = null;
        this.overlay = null;
        
        // Initialize the modal
        this.init();
    }
    
    init() {
        // Create the modal HTML structure
        this.createModalHTML();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    createModalHTML() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'feedback-modal';
        this.overlay.style.display = 'none';
        
        // Create modal content
        this.overlay.innerHTML = `
            <div class="feedback-modal-content">
                <div class="feedback-modal-header">
                    <h2 class="feedback-modal-title">Send Feedback</h2>
                    <button class="feedback-close" type="button" aria-label="Close">&times;</button>
                </div>
                
                <div class="feedback-modal-body">
                    <p class="feedback-subtitle">We value your feedback! Please let us know how we can improve ChatDys.</p>
                    
                    <form id="feedbackForm" class="feedback-form">
                        <div class="feedback-form-group">
                            <label for="feedbackType" class="feedback-label">Feedback Type</label>
                            <select id="feedbackType" class="feedback-select" required>
                                <option value="general">General Feedback</option>
                                <option value="bug">Bug Report</option>
                                <option value="feature">Feature Request</option>
                                <option value="content">Content Suggestion</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div class="feedback-form-group">
                            <label for="feedbackText" class="feedback-label">Your Feedback</label>
                            <textarea 
                                id="feedbackText" 
                                class="feedback-textarea" 
                                placeholder="Please describe your feedback, issue, or suggestion..."
                                required
                            ></textarea>
                        </div>
                        
                        <div class="feedback-form-group" id="emailGroup" style="display: none;">
                            <label for="feedbackEmail" class="feedback-label">Your Email</label>
                            <input 
                                type="email" 
                                id="feedbackEmail" 
                                class="feedback-select" 
                                placeholder="email@example.com"
                            />
                        </div>
                        
                        <div id="feedbackError" class="feedback-error" style="display: none;">
                            <div class="feedback-error-content">
                                <span class="feedback-error-icon">⚠️</span>
                                <span class="feedback-error-text"></span>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="feedback-modal-footer">
                    <button type="button" class="feedback-btn feedback-btn-cancel">Cancel</button>
                    <button type="submit" form="feedbackForm" class="feedback-btn feedback-btn-submit">
                        <span class="feedback-btn-text">Submit Feedback</span>
                        <span class="feedback-btn-spinner" style="display: none;">
                            <span class="spinner"></span>
                            Submitting...
                        </span>
                    </button>
                </div>
                
                <!-- Success state -->
                <div class="feedback-success" id="feedbackSuccess" style="display: none;">
                    <div class="feedback-success-icon">✅</div>
                    <h3 class="feedback-success-title">Thank You!</h3>
                    <p class="feedback-success-message">Your feedback has been submitted successfully. We appreciate your input!</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
    }
    
    addEventListeners() {
        // Close button
        const closeBtn = this.overlay.querySelector('.feedback-close');
        closeBtn.addEventListener('click', () => this.close());
        
        // Cancel button
        const cancelBtn = this.overlay.querySelector('.feedback-btn-cancel');
        cancelBtn.addEventListener('click', () => this.close());
        
        // Overlay click to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Form submission
        const form = this.overlay.querySelector('#feedbackForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    open() {
        this.isOpen = true;
        this.isSuccess = false;
        this.overlay.style.display = 'flex';
        this.overlay.classList.add('show');
        
        // Reset form
        this.resetForm();
        
        // Check if user is authenticated and set email
        this.updateEmailField();
        
        // Focus on textarea
        setTimeout(() => {
            const textarea = this.overlay.querySelector('#feedbackText');
            if (textarea) textarea.focus();
        }, 100);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.isOpen = false;
        this.overlay.classList.remove('show');
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
    
    resetForm() {
        const form = this.overlay.querySelector('#feedbackForm');
        form.reset();
        
        // Reset states
        this.hideError();
        this.hideSuccess();
        this.setSubmitting(false);
        
        // Reset form visibility
        this.overlay.querySelector('.feedback-modal-body').style.display = 'block';
        this.overlay.querySelector('.feedback-modal-footer').style.display = 'flex';
    }
    
    updateEmailField() {
        const emailGroup = this.overlay.querySelector('#emailGroup');
        const emailInput = this.overlay.querySelector('#feedbackEmail');
        
        // Check if user is authenticated (using global authManager if available)
        if (window.authManager && window.authManager.isAuthenticated()) {
            emailGroup.style.display = 'none';
            emailInput.removeAttribute('required');
        } else {
            emailGroup.style.display = 'block';
            emailInput.setAttribute('required', 'required');
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        const formData = new FormData(e.target);
        const feedbackType = formData.get('feedbackType') || this.overlay.querySelector('#feedbackType').value;
        const feedbackText = formData.get('feedbackText') || this.overlay.querySelector('#feedbackText').value;
        const email = formData.get('feedbackEmail') || this.overlay.querySelector('#feedbackEmail').value;
        
        // Validation
        if (!feedbackText.trim()) {
            this.showError('Please enter your feedback');
            return;
        }
        
        const isAuthenticated = window.authManager && window.authManager.isAuthenticated();
        if (!isAuthenticated && !email.trim()) {
            this.showError('Please enter your email address');
            return;
        }
        
        this.setSubmitting(true);
        this.hideError();
        
        try {
            // Get token if authenticated
            let token = null;
            let userEmail = email;
            let userId = null;
            
            if (isAuthenticated && window.authManager) {
                token = await window.authManager.getToken();
                const user = await window.authManager.getUser();
                userEmail = user?.email || email;
                userId = user?.sub || null;
            }
            
            // Send feedback to API - using the route from route.js
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    type: feedbackType,
                    message: feedbackText,
                    email: userEmail,
                    user_id: userId
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit feedback');
            }
            
            // Show success state
            this.showSuccess();
            
            // Close modal after delay
            setTimeout(() => {
                this.close();
            }, 2000);
            
        } catch (err) {
            console.error('Error submitting feedback:', err);
            this.showError(err.message || 'Failed to submit feedback. Please try again.');
        } finally {
            this.setSubmitting(false);
        }
    }
    
    setSubmitting(isSubmitting) {
        this.isSubmitting = isSubmitting;
        const submitBtn = this.overlay.querySelector('.feedback-btn-submit');
        const btnText = submitBtn.querySelector('.feedback-btn-text');
        const btnSpinner = submitBtn.querySelector('.feedback-btn-spinner');
        
        if (isSubmitting) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline-flex';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
        }
    }
    
    showError(message) {
        const errorDiv = this.overlay.querySelector('#feedbackError');
        const errorText = errorDiv.querySelector('.feedback-error-text');
        errorText.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    hideError() {
        const errorDiv = this.overlay.querySelector('#feedbackError');
        errorDiv.style.display = 'none';
    }
    
    showSuccess() {
        this.isSuccess = true;
        
        // Hide form and footer
        this.overlay.querySelector('.feedback-modal-body').style.display = 'none';
        this.overlay.querySelector('.feedback-modal-footer').style.display = 'none';
        
        // Show success message
        const successDiv = this.overlay.querySelector('#feedbackSuccess');
        successDiv.style.display = 'block';
        successDiv.classList.add('show');
    }
    
    hideSuccess() {
        const successDiv = this.overlay.querySelector('#feedbackSuccess');
        successDiv.style.display = 'none';
        successDiv.classList.remove('show');
    }
}

// Global feedback modal instance
let feedbackModal = null;

// Initialize feedback modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    feedbackModal = new FeedbackModal();
});

// Global function to open feedback modal (called by the button)
function openFeedbackModal() {
    if (feedbackModal) {
        feedbackModal.open();
    }
}

// Global function to close feedback modal
function closeFeedbackModal() {
    if (feedbackModal) {
        feedbackModal.close();
    }
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FeedbackModal, openFeedbackModal, closeFeedbackModal };
}
