import React from 'react';
import { Link } from 'react-router-dom';
import './Event.css';
import robotLogo from '../assets/images/robot-logo.png';
import image1 from '../assets/images/image1.png';
import { useAuth } from '../contexts/AuthContext';

const Event = () => {
  const { user, signInWithGoogle, logout } = useAuth();

  const handleAuth = async () => {
    try {
      if (user) {
        await logout();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <div className="event-page">
      <header className="event-header">
        <nav className="nav-container" aria-label="Main navigation">
          <div className="nav-left">
            <Link to="/" aria-label="Home">
              <img src={robotLogo} alt="Deepthink AI Logo" className="nav-logo" />
            </Link>
          </div>
          <div className="nav-right">
            <button 
              className="nav-button sign-in" 
              onClick={handleAuth}
              aria-label={user ? "Sign out" : "Sign in"}
            >
              {user ? 'SIGN OUT' : 'SIGN IN'}
            </button>
            <a 
              href="https://deepthink-om168v315-scrapesalads-projects.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="nav-button download"
              aria-label="Download Deepthink"
            >
              DOWNLOAD
            </a>
          </div>
        </nav>
      </header>

      <main className="event-content">
        <div className="event-hero">
          <div className="event-text">
            <h1 className="event-title">
              <span className="title-line">Dive Deeper.</span>
              <span className="title-line accent">Think Smarter.</span>
            </h1>
            <div className="event-offer">
              <p className="offer-text">
                <span className="offer-badge">Unlock Deeper Insights:</span> Get INSTANT ACCESS NOW
              </p>
              <a 
                href="https://deepthink-om168v315-scrapesalads-projects.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="cta-button"
                aria-label="Join Deepthink Beta"
              >
                <span className="cta-main">Deepthink Research Tool</span>
                <span className="cta-sub">Join The Beta</span>
              </a>
              <div className="guarantee-container">
                <svg className="guarantee-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                <p className="guarantee-text">Your brain + our AI = Unstoppable research.</p>
              </div>
            </div>
          </div>
          
          <div className="event-image">
            <img src={image1} alt="Deepthink AI Illustration showing advanced research capabilities" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Event; 