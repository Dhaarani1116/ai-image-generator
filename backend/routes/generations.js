const express = require('express');
const { protect, generationLimiter } = require('../middleware/auth');
const {
  generateImage,
  getUserHistory,
  getGeneration,
  downloadGeneration,
  deleteGeneration,
  toggleLike
} = require('../controllers/generationController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Generate image (with rate limiting)
router.post('/', generationLimiter, generateImage);

// Get user's generation history
router.get('/history', getUserHistory);

// Get single generation
router.get('/:id', getGeneration);

// Download generation
router.post('/:id/download', downloadGeneration);

// Like/unlike generation
router.post('/:id/like', toggleLike);

// Delete generation
router.delete('/:id', deleteGeneration);

module.exports = router;
