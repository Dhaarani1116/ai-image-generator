import React, { useState, useCallback } from 'react';
import './ModernGenerator.css';

function ModernGenerator({ onGenerate, loading, prompt, onPromptChange }) {
  const [suggestions] = useState([
    "A futuristic city skyline at sunset with flying cars",
    "A magical forest with glowing mushrooms and fairy lights",
    "An astronaut reading a book on the moon",
    "A steampunk mechanical dragon with brass and copper details",
    "A serene zen garden with cherry blossoms and koi pond"
  ]);

  // Advanced options state
  const [style, setStyle] = useState('Realistic');
  const [aspectRatio, setAspectRatio] = useState('1:1 (Square)');
  const [quality, setQuality] = useState('Standard');

  // Keyword detection for auto style selection
  const detectStyleFromPrompt = useCallback((text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('cartoon') || lowerText.includes('anime') || lowerText.includes('comic')) {
      return 'Cartoon';
    }
    if (lowerText.includes('3d') || lowerText.includes('render') || lowerText.includes('blender')) {
      return '3D Render';
    }
    if (lowerText.includes('oil painting') || lowerText.includes('painting') || lowerText.includes('artistic')) {
      return 'Oil Painting';
    }
    if (lowerText.includes('city') || lowerText.includes('building') || lowerText.includes('architecture')) {
      return 'Realistic';
    }
    if (lowerText.includes('cat') || lowerText.includes('dog') || lowerText.includes('animal') || lowerText.includes('pet')) {
      return 'Realistic';
    }
    if (lowerText.includes('fantasy') || lowerText.includes('magical') || lowerText.includes('dragon')) {
      return 'Artistic';
    }
    return style; // Keep current style if no keywords match
  }, [style]);

  const handleSuggestionClick = useCallback((suggestion) => {
    onPromptChange(suggestion);
    // Auto-detect and set style based on prompt
    const detectedStyle = detectStyleFromPrompt(suggestion);
    setStyle(detectedStyle);
  }, [onPromptChange, detectStyleFromPrompt]);

  const handleGenerate = useCallback(() => {
    // Parse aspect ratio to dimensions
    let width = 512, height = 512;
    switch(aspectRatio) {
      case '16:9 (Landscape)':
        width = 1024; height = 576;
        break;
      case '9:16 (Portrait)':
        width = 576; height = 1024;
        break;
      case '4:3 (Standard)':
        width = 1024; height = 768;
        break;
      default: // 1:1
        width = 1024; height = 1024;
    }

    // Build enhanced prompt with style
    const styleKeywords = {
      'Realistic': 'photorealistic, highly detailed, 8k quality',
      'Artistic': 'artistic style, creative, painterly',
      'Cartoon': 'cartoon style, animated, colorful, fun',
      '3D Render': '3D rendered, CGI, blender style, volumetric lighting',
      'Oil Painting': 'oil painting style, classical art, textured brushstrokes'
    };

    const enhancedPrompt = `${prompt}, ${styleKeywords[style] || ''}`;

    onGenerate({
      prompt: enhancedPrompt,
      parameters: {
        width,
        height,
        style,
        quality: quality.toLowerCase(),
        steps: quality === 'Premium' ? 50 : quality === 'High' ? 30 : 20
      }
    });
  }, [onGenerate, prompt, style, aspectRatio, quality]);

  return (
    <div className="modern-generator">
      <div className="generator-container">
        {/* Header */}
        <div className="generator-header">
          <h2>Create Amazing Images</h2>
          <p>Describe what you want to see, and AI will bring it to life</p>
        </div>

        {/* Main Input */}
        <div className="input-section">
          <div className="prompt-input-container">
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe your dream image in detail..."
              className="prompt-textarea"
              rows={4}
              disabled={loading}
            />
            <div className="input-actions">
              <button 
                className="generate-btn"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                      <path d="M2 17L12 22L22 17"/>
                      <path d="M2 12L12 17L22 12"/>
                    </svg>
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Character Count */}
          <div className="input-footer">
            <span className="char-count">{prompt.length}/500 characters</span>
            <span className="tips">💡 Be specific for better results</span>
          </div>
        </div>

        {/* Suggestions */}
        <div className="suggestions-section">
          <h3>Need inspiration?</h3>
          <div className="suggestions-grid">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-card"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={loading}
              >
                <div className="suggestion-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <p>{suggestion}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="advanced-options">
          <details>
            <summary>Advanced Options</summary>
            <div className="options-grid">
              <div className="option-group">
                <label>Style</label>
                <select 
                  className="option-select"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option>Realistic</option>
                  <option>Artistic</option>
                  <option>Cartoon</option>
                  <option>3D Render</option>
                  <option>Oil Painting</option>
                </select>
              </div>
              <div className="option-group">
                <label>Aspect Ratio</label>
                <select 
                  className="option-select"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                >
                  <option>1:1 (Square)</option>
                  <option>16:9 (Landscape)</option>
                  <option>9:16 (Portrait)</option>
                  <option>4:3 (Standard)</option>
                </select>
              </div>
              <div className="option-group">
                <label>Quality</label>
                <select 
                  className="option-select"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option>Standard</option>
                  <option>High</option>
                  <option>Premium</option>
                </select>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default ModernGenerator;
