import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Container, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import GoogleIcon from '@mui/icons-material/Google';
import OnboardingTour from './OnboardingTour';
import InterestQuiz from './InterestQuiz';
import { useTheme, ThemeProvider, createTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const TOP_TOOLS = [
  {
    name: "Monetization Planner",
    desc: "Get a step-by-step blueprint to monetize your niche on YouTube and blogs."
  },
  {
    name: "Guest Post Outreach",
    desc: "Find high-authority sites and content gaps for winning guest post pitches."
  },
  {
    name: "Search Intent Tool",
    desc: "Analyze any keyword's search intent for perfect content targeting."
  },
  {
    name: "AI Image Generator",
    desc: "Create stunning, unique images for your content in seconds."
  },
  {
    name: "Content Creator Machine",
    desc: "Generate SEO-optimized outlines and full articles, tailored to your niche."
  },
  {
    name: "Affiliate Article Ideas",
    desc: "Unlock high-converting affiliate article ideas and keywords."
  },
  {
    name: "YouTube Content Planner",
    desc: "Plan viral YouTube videos and sub-niches for channel growth."
  },
  {
    name: "Video Generator",
    desc: "Turn prompts into AI-powered video content."
  },
  {
    name: "Website Authority Checker",
    desc: "Check any site's authority, backlinks, and more—instantly."
  },
];

const TESTIMONIAL = {
  quote: '"Deepthink AI is my secret weapon for content and SEO. The tools are a game-changer!"',
  author: 'Alex P., SEO Specialist'
};

const WelcomeScreen: React.FC = () => {
  // Theme mode state for this page only
  const [mode, setMode] = useState<'light' | 'dark'>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const theme = createTheme({
    palette: {
      mode,
      primary: { main: '#ff6600' },
      background: {
        default: mode === 'dark' ? '#181c24' : '#fff',
        paper: mode === 'dark' ? '#232936' : '#fff',
      },
    },
  });

  const navigate = useNavigate();
  const [whyOpen, setWhyOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  useEffect(() => {
    // Check if this is the user's first visit
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowWelcomeModal(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const handleStartNow = async () => {
    try {
      await signInWithGoogle();
      setShowQuiz(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
  };

  const handleQuizComplete = (interests: string[]) => {
    setUserInterests(interests);
    setShowQuiz(false);
    navigate('/chat');
  };

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setShowTour(true);
  };

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', background: `url(/images/blog/logo.png) center center no-repeat`, backgroundSize: '40%', py: 6, display: 'flex', alignItems: 'center', position: 'relative' }}>
        {/* Light/Dark mode toggle button in top right */}
        <Box sx={{ position: 'absolute', top: 24, right: 32, zIndex: 10 }}>
          <IconButton onClick={handleToggleMode} color="inherit" sx={{ bgcolor: mode === 'dark' ? 'rgba(36,40,48,0.85)' : 'rgba(255,255,255,0.85)', boxShadow: 2 }}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
        <Container
          maxWidth="md"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: mode === 'dark' ? 'rgba(24,28,36,0.85)' : 'rgba(255,255,255,0.80)',
            borderRadius: 4,
            boxShadow: 3,
            py: { xs: 4, sm: 6 },
            px: { xs: 2, sm: 6 }
          }}
        >
          <Typography variant="h4" align="center" fontWeight={900} sx={{ letterSpacing: 2, color: '#ff6600', mb: 1, textTransform: 'uppercase' }}>
            DEEPTHINK AI
          </Typography>
          <Avatar src="/images/blog/logo.png" alt="Deepthink AI Logo" sx={{ width: 80, height: 80, mb: 2, boxShadow: 2 }} />
          <Typography variant="h2" align="center" fontWeight={800} sx={{ mt: 1, mb: 1, color: mode === 'dark' ? '#fff' : '#232936', fontSize: { xs: '2.2rem', sm: '3rem' } }}>
            Unlock Smarter Research. Instantly.
          </Typography>
          <Typography align="center" color="primary" fontWeight={600} sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
            AI-powered tools for SEO, content, and digital growth.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<GoogleIcon />}
            sx={{ mt: 2, mb: 2, px: 6, fontWeight: 700, fontSize: '1.1rem', background: '#ff6600', borderRadius: 3, boxShadow: 2, textTransform: 'uppercase' }}
            onClick={handleStartNow}
          >
            TRY DEEPTHINK
          </Button>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 1, borderRadius: 3, px: 4, fontWeight: 600, color: '#ff6600', borderColor: '#ff6600', '&:hover': { background: 'rgba(255,102,0,0.08)', borderColor: '#ff6600' } }}
            onClick={() => setWhyOpen(true)}
          >
            Why Deepthink AI?
          </Button>
          <Box className="tools-section" sx={{ width: '100%', mt: 5, mb: 2 }}>
            <Typography variant="h5" align="center" fontWeight={700} sx={{ mb: 2, color: mode === 'dark' ? '#fff' : '#232936' }}>
              Explore Our Top Tools
            </Typography>
            <Grid container spacing={2}>
              {TOP_TOOLS.map(tool => (
                <Grid item xs={12} sm={6} key={tool.name}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 3, height: '100%', bgcolor: mode === 'dark' ? 'rgba(36,40,48,0.95)' : '#f8fafc' }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: mode === 'dark' ? '#ffb366' : '#ff6600' }}>{tool.name}</Typography>
                    <Typography variant="body2" sx={{ color: mode === 'dark' ? '#fff' : '#232936', mt: 0.5 }}>{tool.desc}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Box className="chat-section" sx={{ mt: 5, mb: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="success.main" fontWeight={700}>
              Trusted by 1,000+ creators and marketers
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: mode === 'dark' ? '#ccc' : '#888' }}>
              {TESTIMONIAL.quote}
              <br />
              <Box component="span" fontWeight={600} color={mode === 'dark' ? '#fff' : '#232936'}>{TESTIMONIAL.author}</Box>
            </Typography>
          </Box>
          <Dialog open={whyOpen} onClose={() => setWhyOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Why Deepthink AI?</DialogTitle>
            <DialogContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>All-in-One Research & Content Suite</Typography>
              <Typography sx={{ mb: 2 }}>
                Deepthink AI brings together the most powerful tools for SEO, content creation, and digital marketing—all in one place. Whether you're a blogger, marketer, or entrepreneur, our platform helps you:
              </Typography>
              <ul>
                <li>Uncover hidden opportunities with advanced search intent and authority analysis</li>
                <li>Generate high-converting content ideas and outlines in seconds</li>
                <li>Create stunning images and videos with AI</li>
                <li>Streamline your workflow with chat-powered automation</li>
                <li>Save hours every week and outsmart your competition</li>
              </ul>
              <Typography sx={{ mt: 2 }}>
                Join thousands of creators and marketers using Deepthink AI to level up their research and content game.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setWhyOpen(false)} color="primary" variant="contained">Close</Button>
            </DialogActions>
          </Dialog>
          <Dialog 
            open={showWelcomeModal} 
            onClose={() => setShowWelcomeModal(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: 3,
              }
            }}
          >
            <DialogTitle sx={{ 
              bgcolor: '#ff6600', 
              color: 'white',
              fontWeight: 600,
              fontSize: '1.5rem'
            }}>
              Welcome to Deepthink AI! 🚀
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Let's take a quick tour to help you get started with our powerful AI tools. We'll show you:
              </Typography>
              <ul>
                <li>Our suite of AI-powered tools for content creation</li>
                <li>How to use the AI Chat Assistant</li>
                <li>Ways to customize your experience</li>
                <li>Tips for getting the most out of Deepthink AI</li>
              </ul>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setShowWelcomeModal(false)}
                sx={{ color: '#ff6600', borderColor: '#ff6600' }}
              >
                Skip Tour
              </Button>
              <Button
                variant="contained"
                onClick={handleStartTour}
                sx={{ 
                  bgcolor: '#ff6600',
                  '&:hover': {
                    bgcolor: '#e55c00'
                  }
                }}
              >
                Start Tour
              </Button>
            </DialogActions>
          </Dialog>
          {showTour && <OnboardingTour onComplete={handleTourComplete} />}
          <Dialog open={showQuiz} onClose={() => setShowQuiz(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <InterestQuiz onComplete={handleQuizComplete} />
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default WelcomeScreen; 