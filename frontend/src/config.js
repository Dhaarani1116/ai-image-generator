// API Configuration
// Automatically detects if running locally or in production

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal 
  ? 'http://localhost:5000'  // Local development
  : 'https://ai-image-generator-api.onrender.com';  // Production (Render)

export default API_BASE_URL;
