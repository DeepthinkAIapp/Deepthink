import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './Views/homepage';
import Blog from './Views/Blog';
import MyStory from './Views/MyStory';
import Features from './Views/Features';
import Event from './Views/Event';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/story" element={<MyStory />} />
            <Route path="/features" element={<Features />} />
            <Route path="/event" element={<Event />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
