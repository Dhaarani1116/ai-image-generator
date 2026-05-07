# AI Image Generator - Data Science Module

This directory contains the Python data science components for the AI Image Generator project.

## 🚀 Features

### 1. Text Analysis (`analysis.py`)
- **Text Preprocessing**: Tokenization, stopword removal, lemmatization
- **TF-IDF Vectorization**: Convert prompts to numerical vectors
- **Word Frequency Analysis**: Most common prompt keywords
- **Sentiment Analysis**: Emotional tone of prompts
- **Complexity Metrics**: Prompt difficulty assessment
- **Daily Statistics**: Time-based analytics

### 2. Clustering (`clustering.py`)
- **K-Means Clustering**: Group similar prompts
- **Hierarchical Clustering**: Tree-based clustering
- **DBSCAN**: Density-based clustering
- **Cluster Validation**: Silhouette scores, Calinski-Harabasz index
- **Visualization**: PCA/t-SNE plots
- **Automatic Naming**: Generate meaningful cluster names

### 3. Recommendation System (`recommendation.py`)
- **Content-Based Filtering**: Similar prompt recommendations
- **Collaborative Filtering**: User behavior-based recommendations
- **Popularity-Based**: Trending prompts
- **Category-Based**: User preference recommendations
- **Hybrid Approach**: Combined recommendation strategies
- **Real-time Scoring**: Dynamic recommendation updates

## 📦 Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Download NLTK data (first time only)
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"
```

## 🗄 Database Setup

Make sure MongoDB is running and accessible:
```bash
# Start MongoDB
mongod

# Check connection
python -c "from pymongo import MongoClient; client = MongoClient('mongodb://localhost:27017/'); print('Connected!')"
```

## 🔧 Usage

### Run Complete Analysis
```bash
python analysis.py
```

### Run Clustering Analysis
```bash
python clustering.py
```

### Test Recommendation System
```bash
python recommendation.py
```

## 📊 Output Examples

### Analysis Results
```json
{
  "summary": {
    "total_prompts": 1250,
    "unique_users": 89,
    "avg_prompt_length": 45.2
  },
  "word_frequency": {
    "top_words": [
      {"word": "beautiful", "frequency": 156},
      {"word": "sunset", "frequency": 142}
    ]
  },
  "sentiment_analysis": {
    "avg_sentiment": 0.23,
    "sentiment_distribution": {
      "positive": 678,
      "neutral": 456,
      "negative": 116
    }
  }
}
```

### Clustering Results
```json
{
  "algorithm": "kmeans",
  "n_clusters": 5,
  "clusters": {
    "cluster_0": {
      "cluster_name": "Nature",
      "size": 234,
      "top_keywords": ["landscape", "mountain", "tree", "sunset"],
      "representative_prompts": ["beautiful mountain landscape", "sunset over ocean"]
    }
  }
}
```

### Recommendation Results
```json
{
  "user_id": "user123",
  "recommendations": [
    {
      "prompt": "stunning mountain landscape at sunset",
      "combined_score": 0.89,
      "recommendation_sources": ["content_based", "collaborative_filtering"],
      "category": "Nature"
    }
  ]
}
```

## 🎯 Algorithms Explained

### TF-IDF Vectorization
- **Term Frequency (TF)**: How often a word appears in a prompt
- **Inverse Document Frequency (IDF)**: Rarity of words across all prompts
- **Formula**: TF-IDF = TF × log(Total Documents / Documents with Term)

### K-Means Clustering
1. Initialize K cluster centroids randomly
2. Assign each prompt to nearest centroid
3. Recalculate centroids based on mean of assigned points
4. Repeat until convergence

### Cosine Similarity
- Measures angle between TF-IDF vectors
- Range: -1 (opposite) to 1 (identical)
- Formula: cos(θ) = (A·B) / (|A|×|B|)

### Collaborative Filtering
- Find users with similar prompt preferences
- Recommend prompts liked by similar users
- Uses matrix factorization (SVD) for efficiency

## 📈 Performance Metrics

### Clustering Evaluation
- **Silhouette Score**: -1 to 1 (higher is better)
- **Calinski-Harabasz Index**: Higher is better
- **Inertia**: Lower is better (within-cluster variance)

### Recommendation Quality
- **Precision@K**: Relevant items in top K recommendations
- **Recall@K**: Relevant items found in top K recommendations
- **Diversity**: Variety in recommendation types

## 🔧 Configuration

### Environment Variables
```bash
export MONGODB_URI="mongodb://localhost:27017/ai-image-generator"
export ANALYSIS_DAYS=30
export MAX_CLUSTERS=10
export RECOMMENDATION_COUNT=10
```

### Custom Parameters
```python
# In analysis.py
analyzer = PromptAnalyzer(mongo_uri="your-mongodb-uri")
results = analyzer.run_comprehensive_analysis(days_back=30)

# In clustering.py
clusterer = PromptClusterer()
results = clusterer.run_comprehensive_clustering(days_back=30)

# In recommendation.py
recommender = PromptRecommendationEngine()
hybrid_recs = recommender.hybrid_recommendations(user_id, prompt_text)
```

## 🚨 Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running
2. **Memory Issues**: Reduce `max_features` in TF-IDF
3. **Empty Data**: Check date range and database content
4. **NLTK Data**: Run download commands first

### Debug Mode
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable verbose output
analyzer = PromptAnalyzer()
analyzer.connect_to_database()
```

## 📚 Dependencies

- **pandas**: Data manipulation
- **numpy**: Numerical operations
- **scikit-learn**: Machine learning algorithms
- **nltk**: Natural language processing
- **matplotlib/seaborn**: Visualization
- **pymongo**: MongoDB connection
- **textblob**: Sentiment analysis

## 🔄 Integration with Backend

The Python modules connect to the same MongoDB database as the Node.js backend:

```
Frontend (React) → Node.js Backend → MongoDB Database → Python Analytics
```

### API Integration Points
1. **Analysis Results**: Stored in `prompt_analytics` collection
2. **Cluster Labels**: Added to generation documents
3. **Recommendations**: Cached for user queries
4. **Daily Stats**: Updated automatically

## 🎨 Visualization

Generated plots include:
- Cluster scatter plots (PCA/t-SNE)
- Word frequency bar charts
- Sentiment distribution pie charts
- Daily generation time series
- Category distribution heatmaps

## 📝 Next Steps

1. **Real-time Processing**: Stream processing for live data
2. **Advanced Models**: BERT, GPT embeddings
3. **A/B Testing**: Recommendation algorithm comparison
4. **User Study**: Qualitative evaluation
5. **Scalability**: Distributed processing for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

## 📄 License

This project is licensed under the ISC License.
