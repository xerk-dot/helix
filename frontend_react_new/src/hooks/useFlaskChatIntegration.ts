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
              
              // Look for user messages - updated to match actual class names
              if (element.classList.contains('grid') && 
                  element.classList.contains('grid-cols-[auto_1fr]')) {
                
                // Extract the message text
                const messageEl = element.querySelector('.text-foreground');
                if (messageEl && !element.dataset.processed) {
                  const messageText = messageEl.textContent?.trim();
                  
                  if (messageText) {
                    // Mark as processed to avoid duplicate processing
                    element.dataset.processed = 'true';
                    
                    // Send to Flask
                    sendToFlask({ text: messageText, sender: 'user' });
                  }
                }
              }
            }
          });
        }
      });
    });
    
    // Function to send messages to Flask
    const sendToFlask = async (message: { text: string; sender: string }) => {
      try {
        console.log("\n=== Frontend Debug Point 1: Starting Message Send ===");
        console.log("Message:", message);
        
        let userId = localStorage.getItem('chatUserId');
        if (!userId) {
          userId = `user_${Date.now()}`;
          localStorage.setItem('chatUserId', userId);
          console.log("Generated new userId:", userId);
        } else {
          console.log("Using existing userId:", userId);
        }
        
        // Log to database through Flask
        console.log("\n=== Frontend Debug Point 2: Sending to Log Endpoint ===");
        const logData = {
          user_id: userId,
          message: message.text,
          sender: message.sender,
          timestamp: new Date().toISOString(),
        };
        console.log("Log data:", logData);
        
        try {
          const logResponse = await fetch('http://localhost:5005/api/chat/log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
          });
          
          if (!logResponse.ok) {
            const errorText = await logResponse.text();
            console.error("Log endpoint error:", errorText);
            throw new Error(`Log endpoint error: ${errorText}`);
          }
          
          const logResult = await logResponse.json();
          console.log("Log response:", logResult);
        } catch (error) {
          console.error("Network error during log:", error);
          throw error;
        }
        
        // Send to Flask backend
        console.log("\n=== Frontend Debug Point 3: Sending to Chat Endpoint ===");
        const chatData = {
          message: message.text,
          user_id: userId,
        };
        console.log("Chat data:", chatData);
        
        let chatResponseData;
        try {
          const response = await fetch('http://localhost:5005/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chatData),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Chat endpoint error:", errorText);
            throw new Error(`Chat endpoint error: ${errorText}`);
          }
          
          chatResponseData = await response.json();
          console.log("Chat response:", chatResponseData);
        } catch (error) {
          console.error("Network error during chat:", error);
          throw error;
        }
        
        // Log AI response to database
        console.log("\n=== Frontend Debug Point 4: Logging AI Response ===");
        const aiLogData = {
          user_id: userId,
          message: chatResponseData.response,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };
        console.log("AI log data:", aiLogData);
        
        try {
          const aiLogResponse = await fetch('http://localhost:5005/api/chat/log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(aiLogData),
          });
          
          if (!aiLogResponse.ok) {
            const errorText = await aiLogResponse.text();
            console.error("AI log endpoint error:", errorText);
            throw new Error(`AI log endpoint error: ${errorText}`);
          }
          
          const aiLogResult = await aiLogResponse.json();
          console.log("AI log response:", aiLogResult);
        } catch (error) {
          console.error("Network error during AI log:", error);
          throw error;
        }
        
        console.log("\n=== Frontend Debug Point 5: Message Processing Complete ===");
        console.log("Thread:", {
          user: message.text,
          ai: chatResponseData.response
        });
        
      } catch (error) {
        console.error("\n=== Frontend Debug Point 6: Error ===");
        console.error("Error details:", error);
        if (error instanceof Error) {
          console.error("Error stack:", error.stack);
        }
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