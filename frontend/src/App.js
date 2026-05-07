import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Analytics from "./pages/Analytics";
import ModernHeader from "./components/ModernHeader";
import ModernGenerator from "./components/ModernGenerator";
import ModernGallery from "./components/ModernGallery";
import ModernLanding from "./components/ModernLanding";
import { API_BASE_URL } from "./config";
import './ModernApp.css';

function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      loadUserImages(token);
    }

    // Check for prompt in URL (from recommendations)
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');
    if (promptParam) {
      setPrompt(decodeURIComponent(promptParam));
    }
  }, []);

  const loadUserImages = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generations/history`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Map _id to id for consistent handling
        const mappedImages = (data.data.generations || []).map(img => ({
          ...img,
          id: img._id,
          liked: false,
          likes: 0,
          downloaded: false
        }));
        setImages(mappedImages);
      }
    } catch (err) {
      console.error("Failed to load images:", err);
    }
  };

  const generateImage = useCallback(async (generationData) => {
    // Handle both object format (from ModernGenerator) and event format (backward compatibility)
    let generationPrompt, generationParams;
    
    if (typeof generationData === 'object' && generationData.prompt) {
      // New format from ModernGenerator with parameters
      generationPrompt = generationData.prompt;
      generationParams = generationData.parameters;
    } else {
      // Old format - just the prompt string or event
      generationPrompt = prompt;
      generationParams = {};
    }

    if (!generationPrompt || !generationPrompt.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to generate images");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          prompt: generationPrompt,
          parameters: generationParams
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate image");
      }

      // Show preview instead of directly saving
      const newImage = {
        ...data.data.generation,
        id: data.data.generation._id,
        liked: false,
        likes: 0,
        downloaded: false
      };
      
      setPreviewImage(newImage);
      setShowPreview(true);
      
    } catch (err) {
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const saveToGallery = useCallback(() => {
    if (previewImage) {
      setImages(prev => [previewImage, ...prev]);
      setShowPreview(false);
      setPreviewImage(null);
      setPrompt("");
    }
  }, [previewImage]);

  const discardImage = useCallback(() => {
    setShowPreview(false);
    setPreviewImage(null);
  }, []);

  const handlePromptChange = useCallback((newPrompt) => {
    setPrompt(newPrompt);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setImages([]);
  };

  const handleDownload = useCallback((image) => {
    // Open image in new tab for download
    window.open(image.imageUrl, '_blank');
    
    // Update downloaded status
    setImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, downloaded: true } : img
    ));
  }, []);

  const handleLike = useCallback((imageId) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, liked: !img.liked, likes: img.liked ? img.likes - 1 : img.likes + 1 }
        : img
    ));
  }, []);

  const handleDelete = useCallback(async (imageId) => {
    console.log("Delete called with ID:", imageId);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to delete images");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/generations/${imageId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Delete response status:", response.status);

      if (response.ok) {
        // Remove from local state
        setImages(prev => {
          const filtered = prev.filter(img => img.id !== imageId && img._id !== imageId);
          console.log("Images after delete:", filtered.length);
          return filtered;
        });
        console.log("Image deleted successfully");
      } else {
        const data = await response.json();
        console.error("Delete failed:", data.message);
        alert("Failed to delete image: " + data.message);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting image. Please try again.");
    }
  }, []);

  // If user is not logged in, show landing page
  if (!user) {
    return <ModernLanding />;
  }

  return (
    <div className="modern-app">
      <ModernHeader user={user} onLogout={handleLogout} />
      
      <main className="modern-main">
        <ModernGenerator 
          onGenerate={generateImage}
          loading={loading}
          prompt={prompt}
          onPromptChange={handlePromptChange}
        />
        
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && previewImage && (
          <div className="preview-modal" onClick={discardImage}>
            <div className="preview-content" onClick={(e) => e.stopPropagation()}>
              <h2>🎨 Your Generated Image</h2>
              <div className="preview-image-container">
                <img src={previewImage.imageUrl} alt={previewImage.prompt} />
              </div>
              <div className="preview-prompt">
                <strong>Prompt:</strong> {previewImage.prompt}
              </div>
              <div className="preview-actions">
                <button 
                  className="btn btn-primary"
                  onClick={saveToGallery}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save to Gallery
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={discardImage}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        <ModernGallery 
          images={images}
          onDownload={handleDownload}
          onLike={handleLike}
          onDelete={handleDelete}
          loading={loading}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;
