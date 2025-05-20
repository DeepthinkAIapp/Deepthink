import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { deepthinkTheme } from './theme';
import WelcomeScreen from './components/WelcomeScreen';
import BlogPage from './components/BlogPage';
import { AuthProvider } from './contexts/AuthContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={deepthinkTheme}>
      <CssBaseline />
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/blog" element={<BlogPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
};

export default App; 