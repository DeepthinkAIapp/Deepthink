import React, { useState } from 'react';
import './Chat.css';

const Chat = ({ messages, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.type === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            {message.type === 'user' ? (
              <div className="user-query">
                <div className="message-text">{message.content}</div>
              </div>
            ) : (
              <div className="assistant-response">
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                </div>
                <div className="message-actions">
                  <button 
                    className="action-button copy-button"
                    onClick={() => handleCopy(message.content)}
                    title="Copy response"
                  >
                    <svg viewBox="0 0 24 24" className="action-icon">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  </button>
                  <button 
                    className="action-button edit-button"
                    title="Edit prompt"
                  >
                    <svg viewBox="0 0 24 24" className="action-icon">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <textarea 
          className="chat-input"
          placeholder="Ask me anything..."
          rows="1"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button 
          className="send-button"
          onClick={handleSend}
          disabled={!inputValue.trim()}
        >
          <svg viewBox="0 0 24 24" className="send-icon">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat; 