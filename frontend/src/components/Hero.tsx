import React from 'react';
import './Hero.css';

interface HeroProps {
  onStart: () => void;
  children?: React.ReactNode;
}

const Hero: React.FC<HeroProps> = ({ onStart, children }) => {
  return (
    <div className="hero-section">
      <div className="hero-text">
        <h1 className="hero-title">
          <span className="title-line">Dive Deeper.</span>
          <span className="title-line accent">Think Smarter.</span>
        </h1>
        {children}
        <div className="offer-container">
          <p className="offer-text">
            <span className="offer-badge">Unlock Deeper Insights:</span> Get INSTANT ACCESS NOW
          </p>
          <button className="cta-button" onClick={onStart}>
            <span className="cta-main">Deepthink Research Tool</span>
            <span className="cta-sub">Start Now</span>
          </button>
          <div className="guarantee-container">
            <svg className="guarantee-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            <p className="guarantee-text">Your brain + our AI = Unstoppable research.</p>
          </div>
        </div>
      </div>
      <div className="hero-image">
        <img 
          src={"/images/image1.png"} 
          alt="Deepthink AI Illustration showing advanced research capabilities" 
          loading="eager"
        />
      </div>
    </div>
  );
};

export default Hero; 