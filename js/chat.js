/**
 * ChatDys Chat Module
 * Handles AI chat functionality and streaming responses
 */

class ChatManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api'; // Update for production
        this.isProcessing = false;
    }

    /**
     * Send chat message and handle streaming response
     */
    async sendMessage(query) {
        if (!query.trim() || !authManager.isAuthenticated() || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        
        try {
            const token = await authManager.getToken();
            if (!token) {
                alert('Authentication required. Please sign in again.');
                return;
            }

            const responseContainer = document.getElementById('responseContainer');
            
            // Show response container
            if (responseContainer) {
                responseContainer.style.display = 'block';
            }
            
            // Reset all sections to loading state
            for (let i = 1; i <= 5; i++) {
                const content = document.getElementById(`section${i}Content`);
                const title = document.getElementById(`section${i}Title`);
                
                if (content) {
                    content.className = 'response-content loading';
                    content.textContent = 'Generating response...';
                }
                
                if (title) {
                    title.textContent = this.getDefaultTitle(i);
                }
            }
            
            // Clear input
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = '';
            }
            
            // Send request with streaming
            const response = await fetch(`${this.apiBaseUrl}/chat/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query })
            });
            
            if (response.ok) {
                await this.handleStreamingResponse(response);
            } else {
                const errorData = await response.json();
                if (response.status === 429) {
                    // Usage limit exceeded
                    const premiumUpgrade = document.getElementById('premiumUpgrade');
                    if (premiumUpgrade) {
                        premiumUpgrade.style.display = 'block';
                    }
                    authManager.updateUI();
                }
                alert(errorData.message || 'An error occurred while processing your request.');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred while sending your message. Please try again.');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle streaming response from server
     */
    async handleStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.section >= 1 && data.section <= 5) {
                                const content = document.getElementById(`section${data.section}Content`);
                                const title = document.getElementById(`section${data.section}Title`);
                                
                                if (title) title.textContent = data.title;
                                if (content) {
                                    content.textContent = data.content;
                                    content.className = 'response-content';
                                }
                            } else if (data.section === 'complete') {
                                // Refresh user session to update question count
                                await authManager.loadUserSession();
                                authManager.updateUI();
                            } else if (data.error) {
                                alert(data.error);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error reading stream:', error);
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Get default section title
     */
    getDefaultTitle(sectionNumber) {
        const titles = [
            'Quick Answer',
            'From Our Knowledge Base',
            'Medical Literature',
            'Current Information',
            'Research Summary'
        ];
        return titles[sectionNumber - 1] || `Section ${sectionNumber}`;
    }

    /**
     * Initialize chat functionality
     */
    init() {
        const sendButton = document.getElementById('sendButton');
        const chatInput = document.getElementById('chatInput');

        // Send button click handler
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                const input = document.getElementById('chatInput');
                if (input) {
                    this.sendMessage(input.value);
                }
            });
        }

        // Enter key handler
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage(chatInput.value);
                }
            });
        }
    }
}

// Global chat manager instance
const chatManager = new ChatManager();

// Export for use in other modules
window.chatManager = chatManager;
