import React from 'react';
import { ChatMessage } from './ChatMessage';

interface ChatHistoryProps {
  messages: Array<{ role: string; content: string; isTyping?: boolean }>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, messagesEndRef }) => {
  return (
    <>
      {messages.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-lg mb-2">Hello! I'm alpAI 👋</p>
          <p>How can I help you today?</p>
          <p className="text-sm mt-4 text-blue-400">
            Click the microphone button to use voice input (works in Chrome)
          </p>
        </div>
      )}
      {messages.map((msg, index) => (
        <ChatMessage key={index} {...msg} />
      ))}
      <div ref={messagesEndRef} />
    </>
  );
};