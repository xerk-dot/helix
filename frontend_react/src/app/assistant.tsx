"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { useState } from "react";

export const Assistant = () => {
  const runtime = useChatRuntime({
    api: "/api/chat",
    stream: false // Disable streaming
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="relative h-full w-full flex">
        {/* Sidebar menu button */}
        <button 
          className="absolute left-4 top-4 z-20 p-2 bg-gray-200 rounded-md hover:bg-gray-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
        
        {/* Slide-out modal for ThreadList */}
        <div 
          className={`absolute z-10 h-full w-64 bg-white shadow-lg transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="pt-16 h-full overflow-auto">
            <ThreadList />
          </div>
        </div>
        
        {/* Main Thread container - takes full height */}
        <div className="flex-1 h-full w-full">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
