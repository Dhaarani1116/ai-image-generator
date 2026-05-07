const mongoose = require('mongoose');

const promptAnalyticsSchema = new mongoose.Schema({
  // Word frequency analysis
  wordFrequencies: [{
    word: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    frequency: {
      type: Number,
      required: true,
      min: 1
    },
    category: {
      type: String,
      enum: ['noun', 'verb', 'adjective', 'art-style', 'subject', 'other'],
      default: 'other'
    }
  }],
  
  // Category clusters from K-means
  promptClusters: [{
    clusterId: {
      type: Number,
      required: true
    },
    clusterName: {
      type: String,
      required: true
    },
    centroid: {
      type: [Number], // TF-IDF vector
      required: true
    },
    promptCount: {
      type: Number,
      default: 0
    },
    representativePrompts: [{
      prompt: String,
      similarity: Number
    }],
    keywords: [String],
    avgPromptLength: Number,
    avgGenerationTime: Number
  }],
  
  // Similarity matrix for recommendations
  promptSimilarity: [{
    promptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Generation',
      required: true
    },
    similarPrompts: [{
      promptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Generation'
      },
      similarity: {
        type: Number,
        min: 0,
        max: 1
      }
    }]
  }],
  
  // Daily statistics
  dailyStats: [{
    date: {
      type: Date,
      required: true
    },
    totalPrompts: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    avgPromptLength: {
      type: Number,
      default: 0
    },
    topCategories: [{
      category: String,
      count: Number
    }],
    topWords: [{
      word: String,
      frequency: Number
    }]
  }],
  
  // Trending keywords
  trendingKeywords: [{
    word: {
      type: String,
      required: true
    },
    trend: {
      type: String,
      enum: ['rising', 'falling', 'stable'],
      default: 'stable'
    },
    currentFrequency: Number,
    previousFrequency: Number,
    changePercentage: Number
  }],
  
  // User behavior patterns
  userPatterns: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    preferredCategories: [{
      category: String,
      usageCount: Number
    }],
    avgPromptLength: Number,
    favoriteWords: [String],
    generationFrequency: Number, // per week
    mostActiveHour: Number, // 0-23
    promptComplexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex'],
      default: 'moderate'
    }
  }],
  
  // Model performance metrics
  modelPerformance: [{
    modelName: String,
    avgGenerationTime: Number,
    successRate: Number,
    errorRate: Number,
    userSatisfaction: Number,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Content quality metrics
  qualityMetrics: {
    avgPromptLength: Number,
    avgGenerationTime: Number,
    downloadRate: Number, // downloads / total generations
    shareRate: Number, // shares / total generations
    engagementRate: Number, // likes / views
    nsfwRate: Number, // NSFW content / total
    categoryDistribution: [{
      category: String,
      percentage: Number
    }]
  },
  
  // Recommendations cache
  recommendations: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recommendedPrompts: [{
      prompt: String,
      similarity: Number,
      category: String,
      popularityScore: Number
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
promptAnalyticsSchema.index({ 'wordFrequencies.word': 1 });
promptAnalyticsSchema.index({ 'promptClusters.clusterId': 1 });
promptAnalyticsSchema.index({ 'dailyStats.date': 1 });
promptAnalyticsSchema.index({ 'trendingKeywords.word': 1 });
promptAnalyticsSchema.index({ 'userPatterns.userId': 1 });

// Method to update word frequencies
promptAnalyticsSchema.methods.updateWordFrequencies = function(newWords) {
  const existingWords = this.wordFrequencies;
  
  newWords.forEach(word => {
    const existingWord = existingWords.find(w => w.word === word);
    if (existingWord) {
      existingWord.frequency += 1;
    } else {
      existingWords.push({
        word: word,
        frequency: 1,
        category: 'other'
      });
    }
  });
  
  return this.save();
};

// Method to get top N words
promptAnalyticsSchema.methods.getTopWords = function(limit = 10) {
  return this.wordFrequencies
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
};

module.exports = mongoose.model('PromptAnalytics', promptAnalyticsSchema);
