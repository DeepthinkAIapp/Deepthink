import { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { getApiUrl } from '../config';

const DeepthinkImageGeneratorPage = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(getApiUrl('/api/generate-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
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
