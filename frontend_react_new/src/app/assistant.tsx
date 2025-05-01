"use client";

import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { Thread } from "~/components/assistant-ui/thread";
import { ThreadList } from "~/components/assistant-ui/thread-list";
import { useState } from "react";

const FlaskModelAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const response = await fetch("http://localhost:5005/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let text = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(5));
            if (data.type === "text") {
              text = data.text;
              yield {
                content: [{ type: "text", text }]
              };
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};

export const Assistant = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const runtime = useLocalRuntime(FlaskModelAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="relative h-full w-full flex flex-col">
        {/* Sidebar menu button */}
        <button 
          className="absolute right-4 top-4 z-20 p-2 bg-gray-200 rounded-md hover:bg-gray-300"
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
        
        {/* Main Thread container - takes full height with proper structure */}
        <div className="flex-1 h-full w-full overflow-hidden">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
