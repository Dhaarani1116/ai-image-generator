import React, { useState } from 'react';
import './ModernGallery.css';

function ModernGallery({ images, onDownload, onLike, onDelete, loading }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredImages = images.filter(image => {
    if (filter === 'all') return true;
    return image.category === filter;
  });

  const categories = [...new Set(images.map(img => img.category || 'uncategorized'))];

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="modern-gallery">
      <div className="gallery-container">
        {/* Header */}
        <div className="gallery-header">
          <h2>Your Creations</h2>
          <div className="gallery-stats">
            <span className="stat-item">
              <strong>{images.length}</strong> Images
            </span>
            <span className="stat-item">
              <strong>{images.filter(img => img.downloaded).length}</strong> Downloads
            </span>
          </div>
        </div>

        {/* Filters */}
        {categories.length > 1 && (
          <div className="gallery-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${filter === category ? 'active' : ''}`}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="gallery-loading">
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-meta"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="empty-gallery">
            <div className="empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <h3>No images yet</h3>
            <p>Start creating amazing images to see them here!</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {filteredImages.map((image) => (
              <div key={image.id} className="image-card">
                <div className="image-container" onClick={() => handleImageClick(image)}>
                  <img 
                    src={image.imageUrl} 
                    alt={image.prompt}
                    loading="lazy"
                  />
                  <div className="image-overlay">
                    <div className="overlay-actions">
                      <button 
                        className="overlay-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(image);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button 
                        className="overlay-btn download-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(image);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      <button 
                        className="overlay-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this image?')) {
                            onDelete(image.id);
                          }
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="image-info">
                  <p className="image-prompt">{image.prompt}</p>
                  <div className="image-meta">
                    <span className="image-date">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </span>
                    <div className="image-actions">
                      <button 
                        className={`action-btn ${image.liked ? 'liked' : ''}`}
                        onClick={() => onLike(image.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={image.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        {image.likes || 0}
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => onDownload(image)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="modal-image">
              <img src={selectedImage.imageUrl} alt={selectedImage.prompt} />
            </div>
            <div className="modal-info">
              <h3>{selectedImage.prompt}</h3>
              <div className="modal-meta">
                <span>Created: {new Date(selectedImage.createdAt).toLocaleDateString()}</span>
                <span>Category: {selectedImage.category || 'Uncategorized'}</span>
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-btn primary"
                  onClick={() => onDownload(selectedImage)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </button>
                <button 
                  className={`modal-btn ${selectedImage.liked ? 'liked' : ''}`}
                  onClick={() => onLike(selectedImage.id)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={selectedImage.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {selectedImage.likes || 0}
                </button>
                <button 
                  className="modal-btn delete-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this image?')) {
                      onDelete(selectedImage.id);
                      closeModal();
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModernGallery;
