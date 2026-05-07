const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getDashboard,
  getGlobalAnalytics,
  getRecommendations,
  getWordFrequency,
  getClusters
} = require('../controllers/analyticsController');

const router = express.Router();

// All routes are protected
router.use(protect);

// User analytics dashboard
router.get('/dashboard', getDashboard);

// Prompt recommendations
router.get('/recommendations', getRecommendations);

// Word frequency analysis
router.get('/word-frequency', getWordFrequency);

// Prompt clustering results
router.get('/clusters', getClusters);

// Global analytics (admin only - would need admin middleware)
router.get('/global', getGlobalAnalytics);

module.exports = router;
