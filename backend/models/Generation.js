const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  prompt: {
    type: String,
    required: [true, 'Prompt is required'],
    trim: true,
    maxlength: [1000, 'Prompt cannot exceed 1000 characters']
  },
  promptLength: {
    type: Number,
    required: true
  },
  promptTokens: {
    type: Number,
    default: 0 // Will be calculated by Python analytics
  },
  imageUrl: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String,
    default: '' // For cloud storage integration
  },
  generationTime: {
    type: Number,
    required: true, // Time in milliseconds
    min: 0
  },
  modelUsed: {
    type: String,
    default: 'stable-diffusion-2-1'
  },
  parameters: {
    width: {
      type: Number,
      default: 512
    },
    height: {
      type: Number,
      default: 512
    },
    steps: {
      type: Number,
      default: 20
    },
    guidance_scale: {
      type: Number,
      default: 7.5
    }
  },
  downloaded: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  shared: {
    type: Boolean,
    default: false
  },
  shareCount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['anime', 'nature', 'portrait', 'abstract', 'futuristic', 'fantasy', 'other'],
    default: 'other' // Will be classified by Python analytics
  },
  tags: [{
    type: String,
    trim: true
  }],
  quality: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  nsfw: {
    type: Boolean,
    default: false
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
generationSchema.index({ userId: 1, createdAt: -1 });
generationSchema.index({ category: 1 });
generationSchema.index({ prompt: 'text' }); // For full-text search
generationSchema.index({ createdAt: -1 });

// Calculate prompt length before saving
generationSchema.pre('save', function(next) {
  if (this.isModified('prompt')) {
    this.promptLength = this.prompt.length;
  }
  next();
});

// Method to increment download count
generationSchema.methods.incrementDownload = function() {
  this.downloaded = true;
  this.downloadCount += 1;
  return this.save();
};

// Method to increment share count
generationSchema.methods.incrementShare = function() {
  this.shared = true;
  this.shareCount += 1;
  return this.save();
};

// Method to update analytics
generationSchema.methods.updateAnalytics = function(type) {
  switch(type) {
    case 'view':
      this.analytics.views += 1;
      break;
    case 'like':
      this.analytics.likes += 1;
      break;
    case 'engagement':
      this.analytics.engagement += 1;
      break;
  }
  return this.save();
};

module.exports = mongoose.model('Generation', generationSchema);
