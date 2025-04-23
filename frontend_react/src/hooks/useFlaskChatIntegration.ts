import { useEffect } from 'react';

// Create a hook to integrate with Flask backend
export function useFlaskChatIntegration() {
  useEffect(() => {
    // Create a mutation observer to watch for new messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for newly added user messages
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node as HTMLElement;
              
              // Look for user messages 
              if (element.classList.contains('user-message') || 
                  element.querySelector('.user-message')) {
                
                // Extract the message text
                const messageEl = element.querySelector('.message-content');
                if (messageEl && !element.dataset.processed) {
                  const messageText = messageEl.textContent?.trim();
                  
                  if (messageText) {
                    // Mark as processed to avoid duplicate processing
                    element.dataset.processed = 'true';
                    
                    // Send to Flask
                    sendToFlask(messageText);
                  }
                }
              }
            }
          });
        }
      });
    });
    
    // Function to send messages to Flask
    const sendToFlask = async (message) => {
      try {
        // Get or create a user ID
        let userId = localStorage.getItem('chatUserId');
        if (!userId) {
          userId = `user_${Date.now()}`;
          localStorage.setItem('chatUserId', userId);
        }
        
        console.log("Sending message to Flask:", message);
        
        // Send to Flask backend
        const response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            user_id: userId,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received response from Flask:", data.response);
        
        // Now we need to find a way to inject this response into the UI
        // This may require a custom approach based on the assistant-ui library
      } catch (error) {
        console.error('Error sending message to server:', error);
      }
    };
    
    // Start observing the document for changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Clean up
    return () => {
      observer.disconnect();
    };
  }, []);
} 