import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ModernHeader.css';

function ModernHeader({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="modern-header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#gradient1)"/>
                <path d="M8 12L16 8L24 12L16 16L8 12Z" fill="white" opacity="0.9"/>
                <path d="M8 20L16 16L24 20L16 24L8 20Z" fill="white" opacity="0.7"/>
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea"/>
                    <stop offset="100%" stopColor="#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">AI Generator</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav-menu">
          <Link to="/" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </Link>
          
          {user && (
            <Link to="/analytics" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span>Analytics</span>
            </Link>
          )}
        </nav>

        {/* User Section */}
        <div className="user-section">
          {user ? (
            <div className="user-menu">
              <div className="user-avatar">
                <img 
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=667eea&color=fff&size=32`}
                  alt={user.name}
                />
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-tier">{user.subscriptionTier || 'Free'}</span>
              </div>
              <button onClick={onLogout} className="logout-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default ModernHeader;
