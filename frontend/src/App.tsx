import { useEffect, useState } from 'react';
import { Box, CssBaseline, ThemeProvider, Button, Menu, MenuItem, IconButton } from '@mui/material';
import Sidebar from './Sidebar';
import ChatInterface from './components/ChatInterface';
import { v4 as uuidv4 } from 'uuid';
import { getAppTheme } from './theme/theme';
import WelcomeScreen from './components/WelcomeScreen';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import SeoCard from './components/SeoCard';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import MonetizationPlannerPage from './components/MonetizationPlannerPage';
import GuestPostOutreachPage from './components/GuestPostOutreachPage';
import SearchIntentToolPage from './components/SearchIntentToolPage';
import DeepthinkImageGeneratorPage from './components/DeepthinkImageGeneratorPage';
import BlogPage from './pages/BlogPage';
import BlogPost from './pages/BlogPost';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import YouTubeContentPlannerPage from './components/YouTubeContentPlannerPage';
import ContentOutlineCreatorPage from './components/ContentOutlineCreatorPage';
import AffiliateArticleIdeaGeneratorPage from './components/AffiliateArticleIdeaGeneratorPage';
import VideoGeneratorPage from './components/VideoGeneratorPage';
import WebsiteAuthorityCheckerPage from './components/WebsiteAuthorityCheckerPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ChatPageLayout from './pages/ChatPageLayout';
import CustomInstructionsDialog from './components/CustomInstructionsDialog';
import { signOutUser } from './firebase';
import type { Message } from './types';
import TopNav from './components/TopNav';

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

const LOCAL_STORAGE_KEY = 'deepthinkai_chats';

interface MenuColorWrapperProps {
  children: (isChat: boolean) => JSX.Element;
}

function MenuColorWrapper({ children }: MenuColorWrapperProps) {
  const location = useLocation();
  // Assume chat interface is at root path '/'
  const isChat = location.pathname === '/';
  return children(isChat);
}

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [model, setModel] = useState<string>('gemma:7b');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mode, setMode] = useState<'light' | 'dark'>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const theme = getAppTheme(mode);
  const themeMUI = useTheme();
  const isMobile = useMediaQuery(themeMUI.breakpoints.down('sm'));
  const [customInstructionsOpen, setCustomInstructionsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('deepthinkai_chats');
    if (saved) {
      const parsed: Chat[] = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('deepthinkai_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (chats.length > 0 && !currentChatId) {
      setCurrentChatId(chats[0].id);
    }
    if (chats.length === 0 && !currentChatId) {
      const newChat = {
        id: uuidv4(),
        title: 'New Chat',
        messages: [],
      };
      setChats([newChat]);
      setCurrentChatId(newChat.id);
    }
  }, [chats, currentChatId]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleDeleteChat = (id: string): void => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    setCurrentChatId(prevId => prevId === id && chats.length > 1 ? chats.find(chat => chat.id !== id)?.id || '' : prevId);
  };

  const handleToolsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleToolsClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOutUser();
    window.location.reload();
  };

  useEffect(() => {
    const handleOpenCustomInstructions = () => setCustomInstructionsOpen(true);
    window.addEventListener('openCustomInstructions', handleOpenCustomInstructions);
    return () => window.removeEventListener('openCustomInstructions', handleOpenCustomInstructions);
  }, []);

  const handleMessagesChange = (chatId: string, newMessages: Message[]) => {
    setChats(prevChats => prevChats.map(chat =>
      chat.id === chatId ? { ...chat, messages: newMessages } : chat
    ));
  };

  return (
    <HelmetProvider>
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-29J09XGG8M"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-29J09XGG8M');
          `}
        </script>
      </Helmet>
      <SeoCard />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <TopNav />
            <MenuColorWrapper>
              {(isChat) => (
                <>
                  {/* Only show mobile tools menu globally (top right) */}
                  <Box sx={{ position: 'fixed', top: 0, right: 0, zIndex: 1000, p: 2, display: 'flex', gap: 2 }}>
                    {isMobile && (
                      <>
                        <IconButton
                          color="primary"
                          onClick={handleToolsClick}
                          aria-controls={anchorEl ? 'mobile-menu' : undefined}
                          aria-haspopup="true"
                          aria-expanded={anchorEl ? 'true' : undefined}
                          sx={{ minWidth: 40, color: isChat ? '#fff' : undefined }}
                        >
                          <MenuIcon />
                        </IconButton>
                        <Menu
                          id="mobile-menu"
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl)}
                          onClose={handleToolsClose}
                          MenuListProps={{ 'aria-labelledby': 'mobile-menu-button' }}
                          PaperProps={{ sx: { bgcolor: mode === 'dark' ? '#232936' : '#fff' } }}
                        >
                          <MenuItem component={Link} to="/" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>DeepThink AI</MenuItem>
                          <MenuItem component={Link} to="/monetization-planner" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink Monetization Planner</MenuItem>
                          <MenuItem component={Link} to="/guestpost-outreach" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink Guest Post Outreach Ideas</MenuItem>
                          <MenuItem component={Link} to="/search-intent-tool" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink Search Intent Tool</MenuItem>
                          <MenuItem component={Link} to="/image-generator" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink AI Image Generator</MenuItem>
                          <MenuItem component={Link} to="/blog" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Blog</MenuItem>
                          <MenuItem component={Link} to="/content-outline-creator" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink Content Creator Machine</MenuItem>
                          <MenuItem component={Link} to="/affiliate-article-ideas" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Affiliate Article Idea Generator</MenuItem>
                          <MenuItem component={Link} to="/youtube-content-planner" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>YouTube Content Planner</MenuItem>
                          <MenuItem component={Link} to="/video-generator" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Video Generator</MenuItem>
                          <MenuItem component={Link} to="/website-authority-checker" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Website Authority Checker</MenuItem>
                        </Menu>
                      </>
                    )}
                  </Box>
                </>
              )}
            </MenuColorWrapper>
            {/* Main content, no sidebar except on /chat */}
            <Box sx={{ pt: { xs: '80px', sm: '80px' }, pr: { xs: 0, sm: '0px' } }}>
              <Routes>
                <Route path="/" element={<WelcomeScreen />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPost />} />
                {/* Protected Routes */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPageLayout
                        chats={chats}
                        currentChatId={currentChatId}
                        setCurrentChatId={setCurrentChatId}
                        handleNewChat={handleNewChat}
                        handleDeleteChat={handleDeleteChat}
                        model={model}
                        setModel={setModel}
                        onMessagesChange={handleMessagesChange}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/affiliate-article-ideas"
                  element={
                    <ProtectedRoute>
                      <AffiliateArticleIdeaGeneratorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/monetization-planner"
                  element={
                    <ProtectedRoute>
                      <MonetizationPlannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/youtube-content-planner"
                  element={
                    <ProtectedRoute>
                      <YouTubeContentPlannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/content-outline-creator"
                  element={
                    <ProtectedRoute>
                      <ContentOutlineCreatorPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/guestpost-outreach" element={<GuestPostOutreachPage />} />
                <Route path="/website-authority-checker" element={<WebsiteAuthorityCheckerPage />} />
                <Route path="/search-intent-tool" element={<SearchIntentToolPage />} />
                <Route path="/image-generator" element={<DeepthinkImageGeneratorPage />} />
                <Route path="/video-generator" element={<VideoGeneratorPage />} />
              </Routes>
            </Box>
            <CustomInstructionsDialog
              open={customInstructionsOpen}
              onClose={() => setCustomInstructionsOpen(false)}
              mode={mode}
              onToggleDarkMode={() => setMode(mode === 'light' ? 'dark' : 'light')}
              onLogout={handleLogout}
            />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App; 