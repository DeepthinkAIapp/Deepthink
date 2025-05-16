import React from 'react';
import './Features.css';

const Features = () => {
  const features = [
    {
      category: "AI-Powered Research",
      items: [
        "Advanced natural language processing for deep content analysis",
        "Intelligent research summarization and insights extraction",
        "Context-aware information synthesis",
        "Multi-source research integration",
        "Smart citation and reference management"
      ]
    },
    {
      category: "Collaboration Tools",
      items: [
        "Real-time collaborative research workspaces",
        "Team knowledge sharing and annotation",
        "Version control for research documents",
        "Comment and feedback system",
        "Role-based access control"
      ]
    },
    {
      category: "Data Analysis",
      items: [
        "Automated data extraction and organization",
        "Visual data representation and analytics",
        "Pattern recognition and trend analysis",
        "Customizable research metrics",
        "Export capabilities in multiple formats"
      ]
    },
    {
      category: "Knowledge Management",
      items: [
        "Smart research organization and categorization",
        "AI-powered knowledge base creation",
        "Cross-reference linking between research items",
        "Automated tagging and metadata generation",
        "Searchable research repository"
      ]
    },
    {
      category: "Productivity Features",
      items: [
        "Research progress tracking",
        "Automated research reminders",
        "Task and milestone management",
        "Time tracking and productivity analytics",
        "Custom research templates"
      ]
    },
    {
      category: "Security & Privacy",
      items: [
        "End-to-end encryption for research data",
        "Secure cloud storage",
        "Compliance with data protection regulations",
        "Regular security audits",
        "User data privacy controls"
      ]
    },
    {
      category: "Integration Capabilities",
      items: [
        "API access for custom integrations",
        "Browser extension for web research",
        "Document import/export support",
        "Cloud storage integration",
        "Academic database connections"
      ]
    },
    {
      category: "User Experience",
      items: [
        "Intuitive research dashboard",
        "Customizable research workflows",
        "Mobile-responsive design",
        "Dark/Light mode support",
        "Accessibility features"
      ]
    }
  ];

  return (
    <div className="features-container">
      <header className="features-header">
        <h1>Deepthink Features</h1>
        <p className="subtitle">Empowering Your Research Journey</p>
      </header>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-category">
            <h2>{feature.category}</h2>
            <ul>
              {feature.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <span className="checkmark">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="cta-section">
        <h2>Ready to Transform Your Research Process?</h2>
        <p>Join our beta program and experience the future of research</p>
        <a 
          href="https://deepthink-jsmrnzitf-scrapesalads-projects.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="cta-button"
        >
          Join The Beta
        </a>
      </div>
    </div>
  );
};

export default Features; 