"""
AI Image Generator - Data Science Analysis Module
===============================================

This module performs comprehensive analysis of prompt data including:
- Text preprocessing and tokenization
- TF-IDF vectorization
- Word frequency analysis
- Sentiment analysis
- Prompt complexity metrics

Author: AI Image Generator Team
"""

import pandas as pd
import numpy as np
import re
import string
from collections import Counter
from typing import List, Dict, Tuple, Any
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from textblob import TextBlob
import pymongo
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Download NLTK data (only needed once)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')

class PromptAnalyzer:
    """
    Comprehensive prompt analysis class for AI Image Generator
    """
    
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        """
        Initialize the analyzer with database connection
        
        Args:
            mongo_uri: MongoDB connection string
        """
        self.mongo_uri = mongo_uri
        self.client = None
        self.db = None
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
        # Add custom stop words for image prompts
        custom_stop_words = {
            'image', 'picture', 'photo', 'art', 'style', 'like', 'generate',
            'create', 'make', 'show', 'picture', 'image', 'pic', 'digital', 'art'
        }
        self.stop_words.update(custom_stop_words)
        
    def connect_to_database(self) -> bool:
        """
        Connect to MongoDB database
        
        Returns:
            bool: Connection status
        """
        try:
            self.client = pymongo.MongoClient(self.mongo_uri)
            self.db = self.client['ai-image-generator']
            print("✅ Connected to MongoDB successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def load_prompt_data(self, days_back: int = 30) -> pd.DataFrame:
        """
        Load prompt data from MongoDB
        
        Args:
            days_back: Number of days to look back
            
        Returns:
            pd.DataFrame: Prompt data
        """
        if not self.db:
            raise ValueError("Database not connected. Call connect_to_database() first.")
        
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Query generations collection
            cursor = self.db.generations.find({
                'createdAt': {'$gte': start_date, '$lte': end_date}
            })
            
            # Convert to DataFrame
            data = list(cursor)
            df = pd.DataFrame(data)
            
            if df.empty:
                print(f"⚠️ No data found in the last {days_back} days")
                return pd.DataFrame()
            
            # Convert timestamps
            df['createdAt'] = pd.to_datetime(df['createdAt'])
            
            # Add derived features
            df['prompt_length'] = df['prompt'].str.len()
            df['word_count'] = df['prompt'].apply(lambda x: len(x.split()))
            df['char_per_word'] = df['prompt_length'] / df['word_count']
            
            print(f"✅ Loaded {len(df)} prompts from the last {days_back} days")
            return df
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return pd.DataFrame()
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for analysis
        
        Args:
            text: Input text
            
        Returns:
            str: Preprocessed text
        """
        if not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stop words and lemmatize
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens 
                 if token not in self.stop_words and len(token) > 2]
        
        return ' '.join(tokens)
    
    def analyze_word_frequency(self, df: pd.DataFrame, top_n: int = 50) -> Dict[str, Any]:
        """
        Analyze word frequency in prompts
        
        Args:
            df: DataFrame with prompt data
            top_n: Number of top words to return
            
        Returns:
            Dict: Word frequency analysis results
        """
        if df.empty:
            return {}
        
        # Preprocess all prompts
        all_words = []
        for prompt in df['prompt']:
            preprocessed = self.preprocess_text(prompt)
            words = preprocessed.split()
            all_words.extend(words)
        
        # Count word frequencies
        word_freq = Counter(all_words)
        
        # Get top words
        top_words = word_freq.most_common(top_n)
        
        # Calculate statistics
        total_words = len(all_words)
        unique_words = len(word_freq)
        
        return {
            'total_words': total_words,
            'unique_words': unique_words,
            'top_words': [{'word': word, 'frequency': freq} for word, freq in top_words],
            'lexical_diversity': unique_words / total_words if total_words > 0 else 0
        }
    
    def calculate_tfidf_vectors(self, df: pd.DataFrame, max_features: int = 1000) -> Tuple[np.ndarray, TfidfVectorizer]:
        """
        Calculate TF-IDF vectors for prompts
        
        Args:
            df: DataFrame with prompt data
            max_features: Maximum number of features
            
        Returns:
            Tuple: TF-IDF matrix and vectorizer
        """
        if df.empty:
            return np.array([]), None
        
        # Preprocess prompts
        preprocessed_prompts = df['prompt'].apply(self.preprocess_text)
        
        # Calculate TF-IDF
        vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=(1, 2),  # Include bigrams
            min_df=2,  # Minimum document frequency
            max_df=0.8  # Maximum document frequency
        )
        
        tfidf_matrix = vectorizer.fit_transform(preprocessed_prompts)
        
        print(f"✅ TF-IDF matrix shape: {tfidf_matrix.shape}")
        return tfidf_matrix, vectorizer
    
    def analyze_sentiment(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze sentiment of prompts
        
        Args:
            df: DataFrame with prompt data
            
        Returns:
            Dict: Sentiment analysis results
        """
        if df.empty:
            return {}
        
        sentiments = []
        subjectivities = []
        
        for prompt in df['prompt']:
            try:
                blob = TextBlob(prompt)
                sentiments.append(blob.sentiment.polarity)
                subjectivities.append(blob.sentiment.subjectivity)
            except:
                sentiments.append(0)
                subjectivities.append(0)
        
        return {
            'avg_sentiment': np.mean(sentiments),
            'avg_subjectivity': np.mean(subjectivities),
            'sentiment_distribution': {
                'positive': sum(1 for s in sentiments if s > 0.1),
                'neutral': sum(1 for s in sentiments if -0.1 <= s <= 0.1),
                'negative': sum(1 for s in sentiments if s < -0.1)
            },
            'sentiments': sentiments,
            'subjectivities': subjectivities
        }
    
    def analyze_prompt_complexity(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze prompt complexity metrics
        
        Args:
            df: DataFrame with prompt data
            
        Returns:
            Dict: Complexity analysis results
        """
        if df.empty:
            return {}
        
        # Calculate complexity metrics
        avg_sentence_length = []
        avg_word_length = []
        readability_scores = []
        
        for prompt in df['prompt']:
            try:
                sentences = sent_tokenize(prompt)
                words = word_tokenize(prompt)
                
                # Average sentence length
                avg_sent_len = len(words) / len(sentences) if sentences else 0
                avg_sentence_length.append(avg_sent_len)
                
                # Average word length
                avg_word_len = np.mean([len(word) for word in words]) if words else 0
                avg_word_length.append(avg_word_len)
                
                # Simple readability score (based on average sentence length)
                readability = 100 - (avg_sent_len * 2)
                readability_scores.append(max(0, readability))
                
            except:
                avg_sentence_length.append(0)
                avg_word_length.append(0)
                readability_scores.append(0)
        
        # Categorize complexity
        complexity_scores = []
        for i, prompt in enumerate(df['prompt']):
            score = 0
            
            # Length factor
            if len(prompt) > 100:
                score += 1
            if len(prompt) > 200:
                score += 1
                
            # Word count factor
            if df.iloc[i]['word_count'] > 15:
                score += 1
            if df.iloc[i]['word_count'] > 30:
                score += 1
                
            # Sentence structure factor
            if avg_sentence_length[i] > 20:
                score += 1
                
            complexity_scores.append(min(score, 3))  # Max complexity of 3
        
        complexity_labels = ['simple', 'moderate', 'complex', 'very_complex']
        complexity_distribution = {}
        for score in complexity_scores:
            label = complexity_labels[min(score, 3)]
            complexity_distribution[label] = complexity_distribution.get(label, 0) + 1
        
        return {
            'avg_sentence_length': np.mean(avg_sentence_length),
            'avg_word_length': np.mean(avg_word_length),
            'avg_readability': np.mean(readability_scores),
            'complexity_distribution': complexity_distribution,
            'complexity_scores': complexity_scores
        }
    
    def generate_daily_stats(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Generate daily statistics
        
        Args:
            df: DataFrame with prompt data
            
        Returns:
            List: Daily statistics
        """
        if df.empty:
            return []
        
        # Group by date
        df['date'] = df['createdAt'].dt.date
        daily_stats = []
        
        for date, group in df.groupby('date'):
            stats = {
                'date': date.isoformat(),
                'total_prompts': len(group),
                'unique_users': group['userId'].nunique(),
                'avg_prompt_length': group['prompt_length'].mean(),
                'avg_word_count': group['word_count'].mean(),
                'top_categories': group['category'].value_counts().head(5).to_dict(),
                'top_words': self.analyze_word_frequency(group, 10)['top_words']
            }
            daily_stats.append(stats)
        
        return sorted(daily_stats, key=lambda x: x['date'])
    
    def save_analysis_results(self, results: Dict[str, Any], analysis_type: str) -> bool:
        """
        Save analysis results to MongoDB
        
        Args:
            results: Analysis results
            analysis_type: Type of analysis
            
        Returns:
            bool: Save status
        """
        if not self.db:
            return False
        
        try:
            document = {
                'analysis_type': analysis_type,
                'results': results,
                'created_at': datetime.now(),
                'date_range': {
                    'start': datetime.now() - timedelta(days=30),
                    'end': datetime.now()
                }
            }
            
            self.db.prompt_analytics.insert_one(document)
            print(f"✅ Saved {analysis_type} analysis results")
            return True
            
        except Exception as e:
            print(f"❌ Error saving results: {e}")
            return False
    
    def run_comprehensive_analysis(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Run comprehensive analysis of prompt data
        
        Args:
            days_back: Number of days to analyze
            
        Returns:
            Dict: Comprehensive analysis results
        """
        print(f"🚀 Starting comprehensive analysis for the last {days_back} days...")
        
        # Load data
        df = self.load_prompt_data(days_back)
        if df.empty:
            return {}
        
        # Run all analyses
        results = {
            'summary': {
                'total_prompts': len(df),
                'unique_users': df['userId'].nunique(),
                'date_range': {
                    'start': df['createdAt'].min().isoformat(),
                    'end': df['createdAt'].max().isoformat()
                },
                'avg_prompt_length': df['prompt_length'].mean(),
                'avg_word_count': df['word_count'].mean()
            },
            'word_frequency': self.analyze_word_frequency(df),
            'sentiment_analysis': self.analyze_sentiment(df),
            'complexity_analysis': self.analyze_prompt_complexity(df),
            'daily_stats': self.generate_daily_stats(df)
        }
        
        # Calculate TF-IDF for clustering
        tfidf_matrix, vectorizer = self.calculate_tfidf_vectors(df)
        if tfidf_matrix is not None:
            results['tfidf_info'] = {
                'matrix_shape': tfidf_matrix.shape,
                'feature_count': len(vectorizer.get_feature_names_out()) if vectorizer else 0
            }
        
        # Save results
        self.save_analysis_results(results, 'comprehensive')
        
        print("✅ Comprehensive analysis completed!")
        return results

def main():
    """
    Main function to run the analysis
    """
    analyzer = PromptAnalyzer()
    
    if not analyzer.connect_to_database():
        return
    
    # Run analysis
    results = analyzer.run_comprehensive_analysis(days_back=30)
    
    if results:
        print("\n📊 Analysis Summary:")
        print(f"   Total Prompts: {results['summary']['total_prompts']}")
        print(f"   Unique Users: {results['summary']['unique_users']}")
        print(f"   Avg Prompt Length: {results['summary']['avg_prompt_length']:.1f} chars")
        print(f"   Top Word: {results['word_frequency']['top_words'][0]['word'] if results['word_frequency'].get('top_words') else 'N/A'}")
        print(f"   Avg Sentiment: {results['sentiment_analysis']['avg_sentiment']:.2f}")
        print(f"   Lexical Diversity: {results['word_frequency']['lexical_diversity']:.3f}")

if __name__ == "__main__":
    main()
