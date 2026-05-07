const Generation = require('../models/Generation');
const User = require('../models/User');
const PromptAnalytics = require('../models/PromptAnalytics');

// @desc    Get user analytics dashboard
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // User statistics
    const userStats = await User.findById(userId).select('totalGenerations subscriptionTier createdAt');

    // Generation statistics
    const totalGenerations = await Generation.countDocuments({ userId });
    const recentGenerations = await Generation.countDocuments({
      userId,
      createdAt: { $gte: startDate }
    });

    // Category distribution
    const categoryStats = await Generation.aggregate([
      { $match: { userId: userId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Daily generation counts
    const dailyStats = await Generation.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          avgPromptLength: { $avg: '$promptLength' },
          avgGenerationTime: { $avg: '$generationTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Quality distribution
    const qualityStats = await Generation.aggregate([
      { $match: { userId: userId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$quality', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top prompts by engagement
    const topPrompts = await Generation.find({ userId })
      .sort({ 'analytics.engagement': -1 })
      .limit(10)
      .select('prompt imageUrl analytics.engagement createdAt');

    // Prompt length trends
    const promptLengthTrend = await Generation.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgLength: { $avg: '$promptLength' },
          minLength: { $min: '$promptLength' },
          maxLength: { $max: '$promptLength' },
          medianLength: { $percentile: { input: '$promptLength', p: [0.5], method: 'approximate' } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        userStats: {
          totalGenerations: userStats.totalGenerations,
          subscriptionTier: userStats.subscriptionTier,
          memberSince: userStats.createdAt,
          recentGenerations
        },
        categoryStats,
        dailyStats,
        qualityStats,
        topPrompts,
        promptLengthTrend: promptLengthTrend[0] || {
          avgLength: 0,
          minLength: 0,
          maxLength: 0,
          medianLength: 0
        }
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
};

// @desc    Get global analytics (admin)
// @route   GET /api/analytics/global
// @access  Private (Admin only)
const getGlobalAnalytics = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Total users and generations
    const totalUsers = await User.countDocuments();
    const totalGenerations = await Generation.countDocuments();
    const recentGenerations = await Generation.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Active users (users who generated images in timeframe)
    const activeUsers = await Generation.distinct('userId', {
      createdAt: { $gte: startDate }
    });

    // Category distribution globally
    const globalCategoryStats = await Generation.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Most popular prompts
    const popularPrompts = await Generation.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$prompt', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Daily global statistics
    const globalDailyStats = await Generation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          generations: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $project: {
          uniqueUsers: 0
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Model performance
    const modelPerformance = await Generation.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$modelUsed',
          count: { $sum: 1 },
          avgGenerationTime: { $avg: '$generationTime' },
          successRate: { $avg: { $cond: [{ $ne: ['$imageUrl', null] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Subscription tier distribution
    const tierDistribution = await User.aggregate([
      { $group: { _id: '$subscriptionTier', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalGenerations,
          recentGenerations,
          activeUsers: activeUsers.length
        },
        globalCategoryStats,
        popularPrompts,
        globalDailyStats,
        modelPerformance,
        tierDistribution
      }
    });

  } catch (error) {
    console.error('Global analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global analytics',
      error: error.message
    });
  }
};

// @desc    Get prompt recommendations
// @route   GET /api/analytics/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Get user's recent prompts to understand preferences
    const userPrompts = await Generation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('prompt category');

    // Extract user's preferred categories
    const categoryPreferences = {};
    userPrompts.forEach(gen => {
      categoryPreferences[gen.category] = (categoryPreferences[gen.category] || 0) + 1;
    });

    // Find similar users based on prompt patterns
    const similarUsers = await Generation.aggregate([
      { $match: { userId: { $ne: userId } } },
      { $group: { _id: '$userId', categories: { $addToSet: '$category' } } },
      {
        $match: {
          'categories': {
            $in: Object.keys(categoryPreferences)
          }
        }
      },
      {
        $addFields: {
          similarityScore: {
            $size: {
              $setIntersection: ['$categories', Object.keys(categoryPreferences)]
            }
          }
        }
      },
      { $sort: { similarityScore: -1 } },
      { $limit: 10 }
    ]);

    // Get popular prompts from similar users
    const recommendedPrompts = await Generation.find({
      userId: { $in: similarUsers.map(u => u._id) },
      category: { $in: Object.keys(categoryPreferences) }
    })
    .sort({ 'analytics.engagement': -1 })
    .limit(parseInt(limit))
    .select('prompt category imageUrl analytics.engagement');

    // Get trending prompts globally
    const trendingPrompts = await Generation.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$prompt', count: { $sum: 1 }, avgEngagement: { $avg: '$analytics.engagement' } } },
      { $sort: { count: -1, avgEngagement: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        personalizedRecommendations: recommendedPrompts,
        trendingPrompts,
        categoryPreferences
      }
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
};

// @desc    Get word frequency analysis
// @route   GET /api/analytics/word-frequency
// @access  Private
const getWordFrequency = async (req, res) => {
  try {
    const { timeframe = '30', limit = 50 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Get all prompts in timeframe
    const prompts = await Generation.find({
      createdAt: { $gte: startDate }
    }).select('prompt');

    // Process word frequency
    const wordFrequency = {};
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
      'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where',
      'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'just', 'now', 'image', 'picture', 'photo'
    ]);

    prompts.forEach(gen => {
      const words = gen.prompt.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

      words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
    });

    // Sort and limit
    const sortedWords = Object.entries(wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, parseInt(limit))
      .map(([word, frequency]) => ({ word, frequency }));

    res.status(200).json({
      success: true,
      data: {
        wordFrequency: sortedWords,
        totalWords: Object.keys(wordFrequency).length,
        totalPrompts: prompts.length
      }
    });

  } catch (error) {
    console.error('Word frequency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze word frequency',
      error: error.message
    });
  }
};

// @desc    Get prompt clustering results
// @route   GET /api/analytics/clusters
// @access  Private
const getClusters = async (req, res) => {
  try {
    // For now, return basic category-based clustering
    // In a real implementation, this would call Python clustering algorithm
    
    const clusters = await Generation.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPromptLength: { $avg: '$promptLength' },
          avgGenerationTime: { $avg: '$generationTime' },
          samplePrompts: { $push: '$prompt' }
        }
      },
      {
        $addFields: {
          samplePrompts: { $slice: ['$samplePrompts', 3] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        clusters: clusters.map(cluster => ({
          clusterId: clusters.indexOf(cluster),
          clusterName: cluster._id,
          promptCount: cluster.count,
          avgPromptLength: Math.round(cluster.avgPromptLength),
          avgGenerationTime: Math.round(cluster.avgGenerationTime),
          representativePrompts: cluster.samplePrompts.map(prompt => ({
            prompt,
            similarity: 0.8 // Mock similarity score
          })),
          keywords: [cluster._id] // Mock keywords
        }))
      }
    });

  } catch (error) {
    console.error('Clustering error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clustering results',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getGlobalAnalytics,
  getRecommendations,
  getWordFrequency,
  getClusters
};
