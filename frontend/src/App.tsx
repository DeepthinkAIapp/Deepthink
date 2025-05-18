import { useEffect, useState } from 'react';
import { Box, CssBaseline, ThemeProvider, Button, Menu, MenuItem, IconButton } from '@mui/material';
import Sidebar from './Sidebar';
import ChatInterface from './components/ChatInterface';
import { v4 as uuidv4 } from 'uuid';
import { getAppTheme } from './theme/theme';
import WelcomeScreen from './components/WelcomeScreen';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import SeoCard from './components/SeoCard';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [model, setModel] = useState<string>('gemma:7b');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mode, setMode] = useState<'light' | 'dark'>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const theme = getAppTheme(mode);
  const themeMUI = useTheme();
  const isMobile = useMediaQuery(themeMUI.breakpoints.down('sm'));

  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Load chats from localStorage on mount, but don't auto-create a chat
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: Chat[] = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleStartNewChat = () => {
    handleNewChat();
    setShowWelcome(false);
  };

  const handleDeleteChat = (id: string): void => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    // If the current chat is deleted, select another chat or clear selection
    setCurrentChatId(prevId => prevId === id && chats.length > 1 ? chats.find(chat => chat.id !== id)?.id || '' : prevId);
  };

  const handleToolsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleToolsClose = (): void => {
    setAnchorEl(null);
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
        <Router>
          <MenuColorWrapper>
            {(isChat) => (
              <Box sx={{ position: 'fixed', top: 0, right: 0, zIndex: 1000, p: 2, display: 'flex', gap: 2 }}>
                {isMobile ? (
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
                      <MenuItem onClick={() => { setMode(mode === 'light' ? 'dark' : 'light'); handleToolsClose(); }} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>
                        {mode === 'dark' ? <Brightness7Icon sx={{ mr: 1 }} /> : <Brightness4Icon sx={{ mr: 1 }} />} {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <>
                    <Button color="primary" variant="outlined" component={Link} to="/" sx={{ color: isChat ? '#fff' : undefined, borderColor: isChat ? '#fff' : undefined }}>{'DeepThink AI'}</Button>
                    <Button color="primary" variant="outlined" component={Link} to="/blog" sx={{ color: isChat ? '#fff' : undefined, borderColor: isChat ? '#fff' : undefined }}>{'Blog'}</Button>
                    <Button color="primary" variant="outlined" onClick={handleToolsClick} aria-controls={anchorEl ? 'tools-menu' : undefined} aria-haspopup="true" aria-expanded={anchorEl ? 'true' : undefined} sx={{ color: isChat ? '#fff' : undefined, borderColor: isChat ? '#fff' : undefined }}>Tools</Button>
                    <Menu id="tools-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleToolsClose} MenuListProps={{ 'aria-labelledby': 'tools-button' }}>
                      <MenuItem component={Link} to="/monetization-planner" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink Monetization Planner</MenuItem>
                      <MenuItem component={Link} to="/guestpost-outreach" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink Guest Post Outreach Ideas</MenuItem>
                      <MenuItem component={Link} to="/search-intent-tool" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink Search Intent Tool</MenuItem>
                      <MenuItem component={Link} to="/image-generator" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink AI Image Generator</MenuItem>
                      <MenuItem component={Link} to="/content-outline-creator" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Deepthink Content Creator Machine</MenuItem>
                      <MenuItem component={Link} to="/affiliate-article-ideas" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Affiliate Article Idea Generator</MenuItem>
                      <MenuItem component={Link} to="/youtube-content-planner" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>YouTube Content Planner</MenuItem>
                      <MenuItem component={Link} to="/video-generator" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Video Generator</MenuItem>
                      <MenuItem component={Link} to="/website-authority-checker" onClick={handleToolsClose} sx={{ color: (isChat || mode === 'dark') ? '#fff' : '#222' }}>Website Authority Checker</MenuItem>
                    </Menu>
                    <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="primary" sx={{ color: isChat ? '#fff' : undefined }}>
                      {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                  </>
                )}
              </Box>
            )}
          </MenuColorWrapper>
          {/* Add top padding to main content to prevent overlap with menu */}
          <Box sx={{ pt: { xs: '80px', sm: '80px' }, pr: { xs: 0, sm: '0px' } }}>
            <Routes>
              <Route path="/monetization-planner" element={<MonetizationPlannerPage />} />
              <Route path="/guestpost-outreach" element={<GuestPostOutreachPage />} />
              <Route path="/search-intent-tool" element={<SearchIntentToolPage />} />
              <Route path="/image-generator" element={<DeepthinkImageGeneratorPage />} />
              <Route path="/youtube-content-planner" element={<YouTubeContentPlannerPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/content-outline-creator" element={<ContentOutlineCreatorPage />} />
              <Route path="/affiliate-article-ideas" element={<AffiliateArticleIdeaGeneratorPage />} />
              <Route path="/video-generator" element={<VideoGeneratorPage />} />
              <Route path="/website-authority-checker" element={<WebsiteAuthorityCheckerPage />} />
              <Route path="*" element={
                <Box sx={{ 
                  display: 'flex', 
                  minHeight: '100vh',
                  bgcolor: 'background.default'
                }}>
                  {showWelcome ? (
                    <WelcomeScreen onStart={handleStartNewChat} />
                  ) : (
                    <>
                      <Sidebar
                        chats={chats}
                        currentChatId={currentChatId}
                        onSelectChat={setCurrentChatId}
                        onNewChat={handleNewChat}
                        open={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        onDeleteChat={handleDeleteChat}
                      />
                      <Box sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        height: '100vh',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          flex: 1, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          p: { xs: 1, sm: 2 },
                          overflow: 'hidden'
                        }}>
                          {currentChat && (
                            <ChatInterface
                              messages={currentChat.messages}
                              onMessagesChange={messages =>
                                setChats(prev =>
                                  prev.map(chat =>
                                    chat.id === currentChatId ? { ...chat, messages } : chat
                                  )
                                )
                              }
                              onTitleChange={title =>
                                setChats(prev =>
                                  prev.map(chat =>
                                    chat.id === currentChatId ? { ...chat, title } : chat
                                  )
                                )
                              }
                              model={model}
                              onModelChange={setModel}
                            />
                          )}
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              } />
            </Routes>
          </Box>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App; 