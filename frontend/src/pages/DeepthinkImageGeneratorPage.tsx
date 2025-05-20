import { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { getApiUrl, getSdApiUrl, API_CONFIG } from '../config';

const DeepthinkImageGeneratorPage = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(getSdApiUrl(API_CONFIG.SD_TXT2IMG), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          steps: 20,
          width: 512,
          height: 512,
          cfg_scale: 7,
          sampler_name: "Euler a"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      if (data.images && data.images.length > 0) {
        setImageUrl(`data:image/png;base64,${data.images[0]}`);
      } else {
        throw new Error('No image generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Deepthink AI Image Generator
      </Typography>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Enter your image prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={isLoading || !prompt}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Generate Image'}
        </Button>
      </Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {imageUrl && (
        <Box sx={{ mt: 2 }}>
          <img
            src={imageUrl}
            alt="Generated"
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
        </Box>
      )}
    </Box>
  );
};

export default DeepthinkImageGeneratorPage;
