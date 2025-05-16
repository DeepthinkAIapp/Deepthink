import Hero from './Hero';
import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Hero onStart={onStart}>
        <Button
          variant="outlined"
          color="primary"
          sx={{ mt: 2, mb: 1, borderRadius: 8, fontWeight: 600, fontSize: 16, px: 4, py: 1.5, boxShadow: 2 }}
          onClick={handleOpen}
        >
          Why Deepthink AI?
        </Button>
      </Hero>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Why Deepthink AI?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            <b>Deepthink AI</b> is a modern, web-based conversational AI platform that enables users to interact with powerful open-source language models in real time. The app is designed for speed, privacy, and flexibility, making advanced AI accessible to everyone.
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>Key Features:</Typography>
          <ul>
            <li>Multi-Model Support: Chat with open-source models (Gemma, Mistral, DeepSeek, Phi-4, LLaVA, and more).</li>
            <li>Streaming Chat Experience: Fast, interactive, and engaging real-time responses.</li>
            <li>Rich Input Handling: Supports long prompts, code, and images for vision models.</li>
            <li>Contextual Intelligence: Enhanced with sentiment, entity, and intent analysis.</li>
            <li>Smart Model Selection: Auto-selects the best model for your prompt, or choose manually.</li>
            <li>Privacy & Security: No data sent to third-party clouds—your privacy is protected.</li>
            <li>SEO & Social Sharing Ready: Looks great on Google and social media.</li>
            <li>Modern, Responsive UI: Clean, mobile-friendly, and easy to use.</li>
            <li>Easy Deployment: Scalable frontend (Vercel) and secure backend (ngrok/local).</li>
          </ul>
          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>Business Value:</Typography>
          <ul>
            <li>Customizable & Extensible: Add new models, features, or integrations easily.</li>
            <li>Cost-Effective: Uses open-source models, reducing licensing costs.</li>
            <li>Enterprise-Ready: Designed for privacy, security, and scalability.</li>
          </ul>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <b>In summary:</b> Deepthink AI is a robust, user-friendly conversational AI platform that brings the power of open-source models to businesses and individuals, with a focus on privacy, flexibility, and a premium user experience.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 