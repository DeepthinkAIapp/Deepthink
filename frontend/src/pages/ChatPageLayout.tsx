import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Sidebar from '../Sidebar';
import ChatInterface from '../components/ChatInterface';
import type { Message } from '../types';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); // open by default on desktop, closed on mobile

  // Handler to open sidebar (hamburger)
  const handleSidebarOpen = () => setIsSidebarOpen(true);
  // Handler to close sidebar
  const handleSidebarClose = () => setIsSidebarOpen(false);

  // Close sidebar on mobile after selecting a chat
  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  // Ensure sidebar closes on mobile after sign-in
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  // Debug logs
  // console.log('currentChatId:', currentChatId);
  // console.log('currentChat:', currentChat);

  // Handler to update messages and ensure UI updates
  const handleMessagesChange = (newMessages: Message[]) => {
    if (currentChat) {
      onMessagesChange(currentChat.id, newMessages);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Hamburger/Menu Button for Mobile */}
      {isMobile && !isSidebarOpen && (
        <IconButton
          color="primary"
          onClick={handleSidebarOpen}
          aria-label="Open sidebar"
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 2000,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 2,
            width: 44,
            height: 44,
            display: { xs: 'flex', sm: 'none' },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        open={isSidebarOpen}
        onClose={handleSidebarClose}
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