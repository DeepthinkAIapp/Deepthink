import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Container, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnboardingTour from './OnboardingTour';
import InterestQuiz from './InterestQuiz';
import { useTranslation } from 'react-i18next';

const WelcomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (user) {
      setShowQuiz(true);
    }
  }, [user]);

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleTourEnd = () => {
    setShowTour(false);
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    navigate('/chat');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('/images/robot.png')`,
        backgroundSize: '40%',
        backgroundPosition: 'center right',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
        <Box sx={{ maxWidth: isMobile ? '100%' : '60%' }}>
          <Typography variant="h1" gutterBottom sx={{ mb: 3 }}>
            {t('welcome.title')}
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, color: 'text.secondary' }}>
            {t('welcome.subtitle')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartTour}
              sx={{ minWidth: 200 }}
            >
              {t('welcome.startTour')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={signInWithGoogle}
              sx={{ minWidth: 200 }}
            >
              {t('welcome.signIn')}
            </Button>
          </Box>
        </Box>
      </Container>

      {showTour && <OnboardingTour onEnd={handleTourEnd} />}
      {showQuiz && <InterestQuiz onComplete={handleQuizComplete} />}
    </Box>
  );
};

export default WelcomeScreen; 