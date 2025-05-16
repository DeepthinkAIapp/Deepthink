import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

interface AnalysisCardProps {
  children: React.ReactNode;
  robotImageUrl?: string;
  robotImagePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'floating';
  robotImageSize?: number;
  sx?: object;
  title?: string;
}

const getImagePositionStyle = (position: string, size: number) => {
  const base = {
    position: 'absolute' as const,
    width: size,
    height: size,
    opacity: 0.18,
    pointerEvents: 'none',
    zIndex: 2,
    filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.12))',
  };
  switch (position) {
    case 'top-right':
      return { ...base, top: 8, right: 16 };
    case 'bottom-right':
      return { ...base, bottom: 8, right: 16 };
    case 'top-left':
      return { ...base, top: 8, left: 16 };
    case 'bottom-left':
      return { ...base, bottom: 8, left: 16 };
    case 'floating':
      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.22 };
    default:
      return { ...base, bottom: 8, right: 16 };
  }
};

const AnalysisCard: React.FC<AnalysisCardProps> = ({
  children,
  robotImageUrl = '/images/android-chrome-512x512.png',
  robotImagePosition = 'bottom-right',
  robotImageSize = 64,
  sx = {},
  title,
}) => (
  <Paper elevation={3} sx={{
    mt: 4,
    p: 2,
    pr: robotImagePosition.includes('right') ? robotImageSize + 32 : 2,
    pb: robotImagePosition.includes('bottom') ? robotImageSize + 32 : 2,
    pt: robotImagePosition.includes('top') ? robotImageSize + 32 : 2,
    pl: robotImagePosition.includes('left') ? robotImageSize + 32 : 2,
    position: 'relative',
    overflow: 'visible',
    minHeight: 80,
    ...sx,
  }}>
    {robotImageUrl && (
      <Box sx={getImagePositionStyle(robotImagePosition, robotImageSize)}>
        <img
          src={robotImageUrl}
          alt="AI Robot"
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
        />
      </Box>
    )}
    {title && <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>}
    <Box sx={{ position: 'relative', zIndex: 3 }}>
      {children}
    </Box>
  </Paper>
);

export default AnalysisCard; 