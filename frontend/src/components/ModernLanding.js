import React from 'react';
import { Link } from 'react-router-dom';
import './ModernLanding.css';

function ModernLanding() {
  return (
    <div className="modern-landing">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Transform Your Ideas Into
              <span className="gradient-text"> Stunning Images</span>
            </h1>
            <p className="hero-subtitle">
              Harness the power of artificial intelligence to create breathtaking visuals from your imagination. 
              No design skills required - just describe what you want to see.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-large">
                Start Creating Free
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Sign In
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-cards">
              <div className="card card-1">
                <div className="card-image">
                  <div className="placeholder-img gradient-1"></div>
                </div>
                <div className="card-title">Futuristic City</div>
              </div>
              <div className="card card-2">
                <div className="card-image">
                  <div className="placeholder-img gradient-2"></div>
                </div>
                <div className="card-title">Magical Forest</div>
              </div>
              <div className="card card-3">
                <div className="card-image">
                  <div className="placeholder-img gradient-3"></div>
                </div>
                <div className="card-title">Space Adventure</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose AI Generator?</h2>
            <p>Powerful features designed for creators like you</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17"/>
                  <path d="M2 12L12 17L22 12"/>
                </svg>
              </div>
              <h3>AI-Powered Generation</h3>
              <p>State-of-the-art machine learning models create stunning, high-quality images from your text descriptions.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <h3>Advanced Analytics</h3>
              <p>Track your creations with detailed analytics, insights, and performance metrics to improve your prompts.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17"/>
                  <path d="M2 12L12 17L22 12"/>
                </svg>
              </div>
              <h3>Smart Recommendations</h3>
              <p>Get personalized prompt suggestions based on your style and preferences to spark creativity.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <h3>Easy to Use</h3>
              <p>Intuitive interface designed for everyone. No technical skills required - just your imagination.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Create amazing images in three simple steps</p>
          </div>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Describe Your Vision</h3>
                <p>Write a detailed description of the image you want to create.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Creates Magic</h3>
                <p>Our advanced AI analyzes your prompt and generates unique artwork.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Download & Share</h3>
                <p>Get your high-quality image and share it with the world.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Create Something Amazing?</h2>
            <p>Join thousands of creators using AI to bring their ideas to life</p>
            <Link to="/signup" className="btn btn-primary btn-large">
              Get Started Free
            </Link>
            <p className="cta-note">No credit card required • Free plan available</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ModernLanding;
