import { createTheme } from '@mui/material/styles';

export const deepthinkTheme = createTheme({
  palette: {
    primary: {
      main: '#ff6600', // Deepthink orange
      light: '#ff8533',
      dark: '#cc5200',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1a1a1a',
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#ff6600',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#ff6600',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#ff6600',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#ff6600',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#ff6600',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#ff6600',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        },
        contained: {
          backgroundColor: '#ff6600',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#ff8533',
          },
        },
        outlined: {
          borderColor: '#ff6600',
          color: '#ff6600',
          '&:hover': {
            borderColor: '#ff8533',
            backgroundColor: 'rgba(255, 102, 0, 0.04)',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#ff6600',
          textDecoration: 'none',
          '&:hover': {
            color: '#ff8533',
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          },
        },
      },
    },
  },
}); 