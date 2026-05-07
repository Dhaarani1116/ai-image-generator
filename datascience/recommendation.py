"""
AI Image Generator - Recommendation System Module
===============================================

This module implements a sophisticated recommendation system using:
- Cosine similarity on TF-IDF vectors
- Collaborative filtering
- Content-based filtering
- Hybrid recommendation approaches
- User behavior analysis

Author: AI Image Generator Team
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import pymongo
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
from collections import defaultdict, Counter
import warnings
warnings.filterwarnings('ignore')

class PromptRecommendationEngine:
    """
    Advanced recommendation engine for AI Image Generator
    """
    
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        """
        Initialize the recommendation engine
        
        Args:
            mongo_uri: MongoDB connection string
        """
        self.mongo_uri = mongo_uri
        self.client = None
        self.db = None
        self.tfidf_matrix = None
        self.tfidf_vectorizer = None
        self.prompt_df = None
        self.user_item_matrix = None
        self.svd_model = None
        
    def connect_to_database(self) -> bool:
        """Connect to MongoDB database"""
        try:
            self.client = pymongo.MongoClient(self.mongo_uri)
            self.db = self.client['ai-image-generator']
            print("✅ Connected to MongoDB for recommendations")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def load_data(self, days_back: int = 30) -> bool:
        """
        Load and prepare data for recommendations
        
        Args:
            days_back: Number of days to look back
            
        Returns:
            bool: Load status
        """
        if not self.db:
            return False
        
        try:
            # Load generations data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            cursor = self.db.generations.find({
                'createdAt': {'$gte': start_date, '$lte': end_date}
            })
            
            data = list(cursor)
            if not data:
                print("⚠️ No data found for recommendation analysis")
                return False
            
            self.prompt_df = pd.DataFrame(data)
            
            # Preprocess prompts
            from analysis import PromptAnalyzer
            analyzer = PromptAnalyzer()
            
            preprocessed_prompts = self.prompt_df['prompt'].apply(analyzer.preprocess_text)
            
            # Create TF-IDF matrix
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2),
                min_df=2,
                max_df=0.8,
                stop_words='english'
            )
            
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(preprocessed_prompts)
            
            # Create user-item interaction matrix
            self.create_user_item_matrix()
            
            print(f"✅ Loaded {len(self.prompt_df)} prompts for recommendations")
            print(f"✅ TF-IDF matrix shape: {self.tfidf_matrix.shape}")
            return True
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    def create_user_item_matrix(self) -> None:
        """Create user-item interaction matrix for collaborative filtering"""
        # Create user-prompt interactions
        user_prompt_interactions = self.prompt_df.groupby(['userId', '_id']).size().reset_index(name='interaction')
        
        # Create pivot table
        self.user_item_matrix = user_prompt_interactions.pivot_table(
            index='userId', 
            columns='_id', 
            values='interaction', 
            fill_value=0
        )
        
        # Apply SVD for dimensionality reduction
        if self.user_item_matrix.shape[0] > 1 and self.user_item_matrix.shape[1] > 1:
            self.svd_model = TruncatedSVD(n_components=min(50, min(self.user_item_matrix.shape)-1))
            self.svd_matrix = self.svd_model.fit_transform(self.user_item_matrix)
    
    def content_based_recommendations(self, user_id: str, prompt_text: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Generate content-based recommendations based on prompt similarity
        
        Args:
            user_id: User ID
            prompt_text: Input prompt text
            top_n: Number of recommendations
            
        Returns:
            List: Recommended prompts with similarity scores
        """
        try:
            # Preprocess input prompt
            from analysis import PromptAnalyzer
            analyzer = PromptAnalyzer()
            preprocessed_prompt = analyzer.preprocess_text(prompt_text)
            
            # Transform to TF-IDF
            prompt_tfidf = self.tfidf_vectorizer.transform([preprocessed_prompt])
            
            # Calculate cosine similarity
            similarities = cosine_similarity(prompt_tfidf, self.tfidf_matrix).flatten()
            
            # Get top similar prompts (excluding user's own prompts)
            user_prompts = set(self.prompt_df[self.prompt_df['userId'] == user_id]['_id'])
            
            # Get indices of prompts not belonging to user
            valid_indices = [i for i, prompt_id in enumerate(self.prompt_df['_id']) 
                           if prompt_id not in user_prompts]
            
            # Sort by similarity
            valid_similarities = [(i, similarities[i]) for i in valid_indices]
            valid_similarities.sort(key=lambda x: x[1], reverse=True)
            
            # Get top recommendations
            recommendations = []
            for idx, similarity in valid_similarities[:top_n]:
                if similarity > 0.1:  # Threshold for relevance
                    prompt_data = self.prompt_df.iloc[idx]
                    recommendations.append({
                        'prompt_id': str(prompt_data['_id']),
                        'prompt': prompt_data['prompt'],
                        'similarity': float(similarity),
                        'category': prompt_data.get('category', 'unknown'),
                        'generation_time': prompt_data.get('generationTime', 0),
                        'created_at': prompt_data['createdAt'],
                        'recommendation_type': 'content_based'
                    })
            
            return recommendations
            
        except Exception as e:
            print(f"❌ Error in content-based recommendations: {e}")
            return []
    
    def collaborative_filtering_recommendations(self, user_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Generate collaborative filtering recommendations
        
        Args:
            user_id: User ID
            top_n: Number of recommendations
            
        Returns:
            List: Recommended prompts
        """
        try:
            if self.user_item_matrix is None or user_id not in self.user_item_matrix.index:
                return []
            
            # Find similar users
            user_index = self.user_item_matrix.index.get_loc(user_id)
            
            if self.svd_matrix is not None:
                # Use SVD-reduced matrix for similarity calculation
                user_vector = self.svd_matrix[user_index].reshape(1, -1)
                similarities = cosine_similarity(user_vector, self.svd_matrix).flatten()
            else:
                # Use original matrix
                user_vector = self.user_item_matrix.iloc[user_index].values.reshape(1, -1)
                similarities = cosine_similarity(user_vector, self.user_item_matrix.values).flatten()
            
            # Get similar users (excluding self)
            similar_users = []
            for i, similarity in enumerate(similarities):
                if i != user_index and similarity > 0.1:
                    similar_users.append((i, similarity))
            
            similar_users.sort(key=lambda x: x[1], reverse=True)
            
            # Get prompts liked by similar users
            prompt_scores = defaultdict(float)
            prompt_counts = defaultdict(int)
            
            for user_idx, similarity in similar_users[:20]:  # Top 20 similar users
                similar_user_id = self.user_item_matrix.index[user_idx]
                user_prompts = self.prompt_df[self.prompt_df['userId'] == similar_user_id]
                
                for _, prompt_data in user_prompts.iterrows():
                    prompt_id = str(prompt_data['_id'])
                    prompt_scores[prompt_id] += similarity
                    prompt_counts[prompt_id] += 1
            
            # Exclude user's own prompts
            user_prompts = set(self.prompt_df[self.prompt_df['userId'] == user_id]['_id'])
            
            # Calculate final scores
            recommendations = []
            for prompt_id, score in prompt_scores.items():
                if prompt_id not in user_prompts and prompt_counts[prompt_id] >= 2:
                    prompt_data = self.prompt_df[self.prompt_df['_id'] == prompt_id].iloc[0]
                    recommendations.append({
                        'prompt_id': prompt_id,
                        'prompt': prompt_data['prompt'],
                        'score': float(score / prompt_counts[prompt_id]),
                        'category': prompt_data.get('category', 'unknown'),
                        'generation_time': prompt_data.get('generationTime', 0),
                        'created_at': prompt_data['createdAt'],
                        'recommendation_type': 'collaborative_filtering'
                    })
            
            # Sort by score and return top N
            recommendations.sort(key=lambda x: x['score'], reverse=True)
            return recommendations[:top_n]
            
        except Exception as e:
            print(f"❌ Error in collaborative filtering: {e}")
            return []
    
    def popularity_based_recommendations(self, user_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Generate popularity-based recommendations
        
        Args:
            user_id: User ID
            top_n: Number of recommendations
            
        Returns:
            List: Popular prompts
        """
        try:
            # Calculate popularity scores based on engagement
            popularity_scores = []
            
            for _, prompt_data in self.prompt_df.iterrows():
                # Skip user's own prompts
                if str(prompt_data['userId']) == user_id:
                    continue
                
                # Calculate popularity score
                engagement = prompt_data.get('analytics', {}).get('engagement', 0)
                downloads = prompt_data.get('downloadCount', 0)
                shares = prompt_data.get('shareCount', 0)
                
                # Weighted popularity score
                popularity_score = (engagement * 0.5 + downloads * 0.3 + shares * 0.2)
                
                # Time decay (recent prompts get higher score)
                days_old = (datetime.now() - prompt_data['createdAt']).days
                time_factor = max(0.1, 1 - (days_old / 30))  # Decay over 30 days
                
                final_score = popularity_score * time_factor
                
                popularity_scores.append({
                    'prompt_id': str(prompt_data['_id']),
                    'prompt': prompt_data['prompt'],
                    'score': final_score,
                    'category': prompt_data.get('category', 'unknown'),
                    'generation_time': prompt_data.get('generationTime', 0),
                    'created_at': prompt_data['createdAt'],
                    'recommendation_type': 'popularity_based'
                })
            
            # Sort by popularity and return top N
            popularity_scores.sort(key=lambda x: x['score'], reverse=True)
            return popularity_scores[:top_n]
            
        except Exception as e:
            print(f"❌ Error in popularity-based recommendations: {e}")
            return []
    
    def category_based_recommendations(self, user_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Generate category-based recommendations based on user preferences
        
        Args:
            user_id: User ID
            top_n: Number of recommendations
            
        Returns:
            List: Category-based recommendations
        """
        try:
            # Get user's category preferences
            user_prompts = self.prompt_df[self.prompt_df['userId'] == user_id]
            
            if user_prompts.empty:
                return []
            
            # Calculate category preferences
            category_counts = user_prompts['category'].value_counts()
            total_prompts = len(user_prompts)
            
            category_preferences = {}
            for category, count in category_counts.items():
                category_preferences[category] = count / total_prompts
            
            # Get recommendations from preferred categories
            recommendations = []
            
            for category, preference in sorted(category_preferences.items(), 
                                            key=lambda x: x[1], reverse=True):
                # Get prompts from this category (excluding user's own)
                category_prompts = self.prompt_df[
                    (self.prompt_df['category'] == category) & 
                    (self.prompt_df['userId'] != user_id)
                ]
                
                # Sort by engagement and take top from this category
                category_prompts = category_prompts.sort_values(
                    by=lambda x: x.get('analytics', {}).get('engagement', 0), 
                    ascending=False
                )
                
                # Add to recommendations
                for _, prompt_data in category_prompts.head(top_n // len(category_preferences) + 1).iterrows():
                    recommendations.append({
                        'prompt_id': str(prompt_data['_id']),
                        'prompt': prompt_data['prompt'],
                        'category': prompt_data['category'],
                        'preference_score': preference,
                        'generation_time': prompt_data.get('generationTime', 0),
                        'created_at': prompt_data['createdAt'],
                        'recommendation_type': 'category_based'
                    })
            
            # Sort by preference score and return top N
            recommendations.sort(key=lambda x: x['preference_score'], reverse=True)
            return recommendations[:top_n]
            
        except Exception as e:
            print(f"❌ Error in category-based recommendations: {e}")
            return []
    
    def hybrid_recommendations(self, user_id: str, prompt_text: str = None, top_n: int = 10) -> Dict[str, Any]:
        """
        Generate hybrid recommendations combining multiple approaches
        
        Args:
            user_id: User ID
            prompt_text: Input prompt text (optional)
            top_n: Number of recommendations
            
        Returns:
            Dict: Hybrid recommendations with different strategies
        """
        try:
            all_recommendations = {}
            
            # Content-based (if prompt provided)
            if prompt_text:
                content_recs = self.content_based_recommendations(user_id, prompt_text, top_n)
                all_recommendations['content_based'] = content_recs
            
            # Collaborative filtering
            collab_recs = self.collaborative_filtering_recommendations(user_id, top_n)
            all_recommendations['collaborative_filtering'] = collab_recs
            
            # Popularity-based
            popularity_recs = self.popularity_based_recommendations(user_id, top_n)
            all_recommendations['popularity_based'] = popularity_recs
            
            # Category-based
            category_recs = self.category_based_recommendations(user_id, top_n)
            all_recommendations['category_based'] = category_recs
            
            # Combine recommendations with weights
            combined_recs = []
            
            # Weight different approaches
            weights = {
                'content_based': 0.3 if prompt_text else 0.0,
                'collaborative_filtering': 0.3,
                'popularity_based': 0.2,
                'category_based': 0.2
            }
            
            prompt_scores = {}
            
            for rec_type, recommendations in all_recommendations.items():
                weight = weights[rec_type]
                for i, rec in enumerate(recommendations):
                    prompt_id = rec['prompt_id']
                    
                    if prompt_id not in prompt_scores:
                        prompt_scores[prompt_id] = {
                            'prompt_data': rec,
                            'total_score': 0,
                            'recommendation_types': []
                        }
                    
                    # Calculate weighted score (higher rank = higher score)
                    rank_score = (len(recommendations) - i) / len(recommendations)
                    weighted_score = rank_score * weight
                    
                    prompt_scores[prompt_id]['total_score'] += weighted_score
                    prompt_scores[prompt_id]['recommendation_types'].append(rec_type)
            
            # Sort by combined score
            sorted_recommendations = sorted(
                prompt_scores.values(),
                key=lambda x: x['total_score'],
                reverse=True
            )
            
            # Format final recommendations
            final_recommendations = []
            for item in sorted_recommendations[:top_n]:
                rec = item['prompt_data'].copy()
                rec['combined_score'] = item['total_score']
                rec['recommendation_sources'] = item['recommendation_types']
                rec['recommendation_type'] = 'hybrid'
                final_recommendations.append(rec)
            
            return {
                'user_id': user_id,
                'input_prompt': prompt_text,
                'recommendations': final_recommendations,
                'strategy_breakdown': {
                    strategy: list(all_recommendations.keys()),
                    counts: {k: len(v) for k, v in all_recommendations.items()}
                },
                'weights_used': weights
            }
            
        except Exception as e:
            print(f"❌ Error in hybrid recommendations: {e}")
            return {'user_id': user_id, 'recommendations': []}
    
    def get_trending_prompts(self, days_back: int = 7, top_n: int = 20) -> List[Dict[str, Any]]:
        """
        Get trending prompts based on recent activity
        
        Args:
            days_back: Number of days to look back
            top_n: Number of trending prompts
            
        Returns:
            List: Trending prompts
        """
        try:
            # Filter recent prompts
            cutoff_date = datetime.now() - timedelta(days=days_back)
            recent_prompts = self.prompt_df[self.prompt_df['createdAt'] >= cutoff_date]
            
            if recent_prompts.empty:
                return []
            
            # Calculate trending score
            trending_scores = []
            
            for _, prompt_data in recent_prompts.iterrows():
                engagement = prompt_data.get('analytics', {}).get('engagement', 0)
                downloads = prompt_data.get('downloadCount', 0)
                shares = prompt_data.get('shareCount', 0)
                
                # Trending score (engagement weighted more heavily)
                trending_score = engagement * 0.6 + downloads * 0.25 + shares * 0.15
                
                trending_scores.append({
                    'prompt_id': str(prompt_data['_id']),
                    'prompt': prompt_data['prompt'],
                    'trending_score': trending_score,
                    'category': prompt_data.get('category', 'unknown'),
                    'created_at': prompt_data['createdAt'],
                    'engagement': engagement,
                    'downloads': downloads,
                    'shares': shares
                })
            
            # Sort by trending score
            trending_scores.sort(key=lambda x: x['trending_score'], reverse=True)
            
            return trending_scores[:top_n]
            
        except Exception as e:
            print(f"❌ Error getting trending prompts: {e}")
            return []
    
    def save_recommendations(self, user_id: str, recommendations: Dict[str, Any]) -> bool:
        """
        Save recommendations to database
        
        Args:
            user_id: User ID
            recommendations: Recommendation results
            
        Returns:
            bool: Save status
        """
        if not self.db:
            return False
        
        try:
            document = {
                'user_id': user_id,
                'recommendations': recommendations,
                'created_at': datetime.now(),
                'type': 'user_recommendations'
            }
            
            # Update or insert
            self.db.prompt_analytics.update_one(
                {'user_id': user_id, 'type': 'user_recommendations'},
                {'$set': document},
                upsert=True
            )
            
            print(f"✅ Saved recommendations for user {user_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving recommendations: {e}")
            return False

def main():
    """
    Main function to test the recommendation system
    """
    recommender = PromptRecommendationEngine()
    
    if not recommender.connect_to_database():
        return
    
    if not recommender.load_data():
        return
    
    # Test with a sample user
    sample_users = recommender.prompt_df['userId'].unique()[:3]
    
    for user_id in sample_users:
        print(f"\n🎯 Generating recommendations for user: {user_id}")
        
        # Hybrid recommendations
        hybrid_recs = recommender.hybrid_recommendations(user_id, "beautiful sunset landscape")
        
        if hybrid_recs['recommendations']:
            print(f"   Generated {len(hybrid_recs['recommendations'])} recommendations")
            print(f"   Top recommendation: {hybrid_recs['recommendations'][0]['prompt'][:50]}...")
        
        # Save recommendations
        recommender.save_recommendations(user_id, hybrid_recs)
    
    # Get trending prompts
    trending = recommender.get_trending_prompts()
    print(f"\n🔥 Top 5 trending prompts:")
    for i, prompt in enumerate(trending[:5]):
        print(f"   {i+1}. {prompt['prompt'][:50]}... (Score: {prompt['trending_score']:.2f})")

if __name__ == "__main__":
    main()
