import React from 'react';

interface ChatMessageProps {
  role: string;
  content: string;
  isTyping?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isTyping }) => {
  return (
    <div className={`${role === 'user' ? 'bg-[#343541]' : 'bg-[#444654]'} p-8`}>
      <div className="max-w-3xl mx-auto flex space-x-6">
        <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-white
          ${role === 'user' ? 'bg-blue-500' : 'bg-green-600'}`}>
          {role === 'user' ? '👤' : '🤖'}
        </div>
        <div className="flex-1 text-gray-100 overflow-hidden">
          <p className="prose prose-invert">
            {content}
            {isTyping && (
              <span className="inline-block animate-pulse">|</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
