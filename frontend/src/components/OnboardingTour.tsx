import React, { useState } from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import { Box, Typography } from '@mui/material';

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [run, setRun] = useState(true);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>Welcome to Deepthink AI! 🚀</Typography>
          <Typography>Let's take a quick tour to help you get started with our powerful AI tools.</Typography>
        </Box>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tools-section',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>Powerful AI Tools</Typography>
          <Typography>Explore our suite of AI-powered tools for content creation, SEO, and digital marketing.</Typography>
        </Box>
      ),
      placement: 'bottom',
    },
    {
      target: '.chat-section',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>AI Chat Assistant</Typography>
          <Typography>Get instant help and generate content ideas with our advanced AI chat.</Typography>
        </Box>
      ),
      placement: 'left',
    },
    {
      target: '.customize-section',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>Customize Your Experience</Typography>
          <Typography>Set your preferences and customize the AI's behavior to match your needs.</Typography>
        </Box>
      ),
      placement: 'right',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      setRun(false);
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#ff6600',
          zIndex: 10000,
        },
        tooltip: {
          backgroundColor: '#fff',
          borderRadius: 8,
          padding: 16,
        },
        buttonNext: {
          backgroundColor: '#ff6600',
          padding: '8px 16px',
        },
        buttonBack: {
          marginRight: 8,
        },
      }}
    />
  );
};

export default OnboardingTour; 