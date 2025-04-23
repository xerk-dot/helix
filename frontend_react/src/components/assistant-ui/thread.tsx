import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useState, useCallback, createContext, useContext } from "react";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

// Create a context for Flask integration
const FlaskContext = createContext({
  sendToFlask: async (message: string) => "",
});

export const Thread: FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeightRef = useRef(0);
  const lastUserInteractionRef = useRef(Date.now());
  
  // Function to send messages to Flask backend
  const sendToFlask = async (message: string) => {
    try {
      // Get or create a user ID
      let userId = localStorage.getItem('chatUserId');
      if (!userId) {
        userId = `user_${Date.now()}`;
        localStorage.setItem('chatUserId', userId);
      }
      
      console.log("Sending message to Flask:", message);
      
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
      
      return data.response;
    } catch (error) {
      console.error('Error sending message to server:', error);
      return "Sorry, there was an error processing your message.";
    }
  };
  
  // Check if scroll is at bottom
  const isAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    
    const threshold = 50;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  }, []);
  
  // Direct scroll to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);
  
  // Detect when user manually scrolls
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    const handleScroll = () => {
      // Only consider it manual user scrolling if it's been at least 100ms since the last auto-scroll
      const timeSinceLastAutoScroll = Date.now() - lastUserInteractionRef.current;
      if (timeSinceLastAutoScroll > 100) {
        if (!isAtBottom()) {
          setUserScrolledUp(true);
        } else {
          setUserScrolledUp(false);
        }
      }
    };
    
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isAtBottom]);
  
  // Detect content generation through DOM changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    let changeCounter = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    lastHeightRef.current = container.scrollHeight;
    
    const observer = new MutationObserver(() => {
      // If height changed significantly, we're likely generating content
      if (container.scrollHeight > lastHeightRef.current + 5) {
        lastHeightRef.current = container.scrollHeight;
        changeCounter++;
        
        // If we detect multiple changes in succession, assume we're generating
        if (changeCounter >= 2 && !isGenerating) {
          setIsGenerating(true);
        }
        
        // Reset the counter after a period of no changes
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          changeCounter = 0;
          if (isGenerating) {
            setIsGenerating(false);
          }
        }, 500);
      }
    });
    
    observer.observe(container, { 
      childList: true, 
      subtree: true, 
      characterData: true 
    });
    
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isGenerating]);
  
  // Auto-scroll ONLY during generation and ONLY if user hasn't scrolled up
  useEffect(() => {
    // Clear any existing interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    // Only auto-scroll if we're generating text AND user hasn't manually scrolled up
    if (isGenerating && !userScrolledUp) {
      // Initial scroll
      scrollToBottom(false);
      lastUserInteractionRef.current = Date.now();
      
      // Set up frequent updates
      autoScrollIntervalRef.current = setInterval(() => {
        scrollToBottom(false);
        lastUserInteractionRef.current = Date.now();
      }, 50);
    }
    
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isGenerating, userScrolledUp, scrollToBottom]);

  return (
    <FlaskContext.Provider value={{ sendToFlask }}>
      <ThreadPrimitive.Root
        className="bg-background box-border flex h-full w-full flex-col relative"
      >
        {/* Scrollable messages container with ref */}
        <div 
          ref={scrollContainerRef}
          className="absolute inset-0 bottom-[72px] overflow-y-auto"
        >
          <ThreadPrimitive.Viewport className="flex w-full flex-col items-center bg-inherit px-4 pt-8 min-h-full">
            <ThreadWelcome />

            <ThreadPrimitive.Messages
              components={{
                UserMessage: UserMessage,
                EditComposer: EditComposer,
                AssistantMessage: AssistantMessage,
              }}
            />

            <ThreadPrimitive.If empty={false}>
              <div className="min-h-8 flex-grow" />
            </ThreadPrimitive.If>
          </ThreadPrimitive.Viewport>
        </div>
        
        {/* Fixed search bar / composer at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t px-4 py-3 z-10">
          {!isAtBottom() && (
            <ThreadScrollToBottom 
              onClick={() => {
                setUserScrolledUp(false);
                scrollToBottom(true);
              }}
            />
          )}
          <Composer />
        </div>
      </ThreadPrimitive.Root>
    </FlaskContext.Provider>
  );
};

const ThreadScrollToBottom: FC = ({ onClick }) => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
        onClick={onClick}
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          <p className="mt-4 font-medium">How can I help you today?</p>
        </div>
        <ThreadWelcomeSuggestions />
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="mt-3 flex w-full items-stretch justify-center gap-4">
      <ThreadPrimitive.Suggestion
        className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3 transition-colors ease-in"
        prompt="I need help recruiting for my company."
        method="replace"
        autoSend
      >
        <span className="line-clamp-2 text-ellipsis text-sm font-semibold">
          I need help recruiting for my company.
        </span>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3 transition-colors ease-in"
        prompt="I need to send emails out."
        method="replace"
        autoSend
      >
        <span className="line-clamp-2 text-ellipsis text-sm font-semibold">
          I need to send emails out.
        </span>
      </ThreadPrimitive.Suggestion>
    </div>
  );
};

// Replace the Composer component with a custom implementation
const Composer: FC = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Get or create a user ID
      let userId = localStorage.getItem('chatUserId');
      if (!userId) {
        userId = `user_${Date.now()}`;
        localStorage.setItem('chatUserId', userId);
      }
      
      // Use the ThreadPrimitive internal methods if available
      // Otherwise fall back to manual DOM manipulation
      const threadRoot = document.querySelector('[data-thread-root]');
      if (threadRoot && typeof threadRoot.addMessage === 'function') {
        // If the library exposes an API for adding messages
        threadRoot.addMessage({
          role: 'user',
          content: message
        });
        
        // Send to Flask and get response
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
        
        // Add the assistant response
        threadRoot.addMessage({
          role: 'assistant',
          content: data.response
        });
      } else {
        // Manually inject the messages into the DOM
        alert("The assistant-ui library doesn't expose an API for adding messages. Please check the library documentation.");
      }
      
      // Clear the message
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border bg-inherit px-2.5 shadow-sm transition-colors ease-in">
      <form onSubmit={handleSubmit} className="flex w-full">
        <textarea
          rows={1}
          autoFocus
          placeholder="Write a message..."
          className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="my-2.5 size-8 p-2 transition-opacity ease-in bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
        >
          <SendHorizontalIcon />
        </button>
      </form>
    </div>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4">
      <UserActionBar />

      <div className="bg-muted text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5 col-start-2 row-start-2">
        <MessagePrimitive.Content />
      </div>

      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button>Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
      <div className="text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
      </div>

      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-muted-foreground flex gap-1 col-start-3 row-start-2 -ml-1 data-[floating]:bg-background data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "text-muted-foreground inline-flex items-center text-xs",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
