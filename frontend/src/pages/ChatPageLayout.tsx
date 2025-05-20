import React from 'react';
import { Box } from '@mui/material';
import Sidebar from '../Sidebar';
import ChatInterface from '../components/ChatInterface';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatPageLayoutProps {
  chats: Chat[];
  currentChatId: string;
  setCurrentChatId: (id: string) => void;
  handleNewChat: () => void;
  handleDeleteChat: (id: string) => void;
  model: string;
  setModel: (model: string) => void;
  onMessagesChange: (chatId: string, newMessages: Message[]) => void;
  onTitleChange?: (title: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

const ChatPageLayout: React.FC<ChatPageLayoutProps> = ({
  chats,
  currentChatId,
  setCurrentChatId,
  handleNewChat,
  handleDeleteChat,
  model,
  setModel,
  onMessagesChange,
  onTitleChange,
  onLoadingChange,
}) => {
  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Debug logs
  console.log('currentChatId:', currentChatId);
  console.log('currentChat:', currentChat);

  // Handler to update messages and ensure UI updates
  const handleMessagesChange = (newMessages: Message[]) => {
    if (currentChat) {
      onMessagesChange(currentChat.id, newMessages);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        open={true}
        onClose={() => {}}
        onDeleteChat={handleDeleteChat}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatInterface
          messages={currentChat?.messages || []}
          onMessagesChange={handleMessagesChange}
          model={model}
          onModelChange={setModel}
          onTitleChange={onTitleChange}
          onLoadingChange={onLoadingChange}
        />
      </Box>
    </Box>
  );
};

export default ChatPageLayout; 