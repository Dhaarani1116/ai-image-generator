"""
AI Image Generator - Clustering Analysis Module
===============================================

This module performs clustering analysis of prompts using:
- K-Means clustering on TF-IDF vectors
- Hierarchical clustering
- DBSCAN clustering
- Cluster validation and analysis
- Prompt categorization

Author: AI Image Generator Team
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.metrics import silhouette_score, calinski_harabasz_score
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from scipy.cluster.hierarchy import dendrogram, linkage
import pymongo
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

# Set style for better plots
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class PromptClusterer:
    """
    Advanced clustering analysis for prompt categorization
    """
    
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        """
        Initialize the clusterer
        
        Args:
            mongo_uri: MongoDB connection string
        """
        self.mongo_uri = mongo_uri
        self.client = None
        self.db = None
        self.cluster_models = {}
        self.cluster_results = {}
        
    def connect_to_database(self) -> bool:
        """Connect to MongoDB database"""
        try:
            self.client = pymongo.MongoClient(self.mongo_uri)
            self.db = self.client['ai-image-generator']
            print("✅ Connected to MongoDB for clustering analysis")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def load_prompt_data(self, days_back: int = 30) -> Tuple[pd.DataFrame, np.ndarray]:
        """
        Load prompt data and TF-IDF vectors
        
        Args:
            days_back: Number of days to look back
            
        Returns:
            Tuple: DataFrame and TF-IDF matrix
        """
        if not self.db:
            raise ValueError("Database not connected")
        
        try:
            # Load data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            cursor = self.db.generations.find({
                'createdAt': {'$gte': start_date, '$lte': end_date}
            })
            
            data = list(cursor)
            df = pd.DataFrame(data)
            
            if df.empty:
                return pd.DataFrame(), np.array([])
            
            # Load preprocessed TF-IDF vectors from analysis
            analysis_doc = self.db.prompt_analytics.find_one(
                {'analysis_type': 'comprehensive'},
                sort=[('created_at', -1)]
            )
            
            if not analysis_doc:
                print("⚠️ No TF-IDF data found. Run analysis.py first.")
                return pd.DataFrame(), np.array([])
            
            # For now, we'll create simple TF-IDF vectors
            from sklearn.feature_extraction.text import TfidfVectorizer
            from analysis import PromptAnalyzer
            
            analyzer = PromptAnalyzer()
            preprocessed_prompts = df['prompt'].apply(analyzer.preprocess_text)
            
            vectorizer = TfidfVectorizer(
                max_features=500,
                ngram_range=(1, 2),
                min_df=2,
                max_df=0.8
            )
            
            tfidf_matrix = vectorizer.fit_transform(preprocessed_prompts)
            
            print(f"✅ Loaded {len(df)} prompts with TF-IDF matrix shape: {tfidf_matrix.shape}")
            return df, tfidf_matrix
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return pd.DataFrame(), np.array([])
    
    def find_optimal_clusters(self, tfidf_matrix: np.ndarray, max_clusters: int = 10) -> Dict[str, Any]:
        """
        Find optimal number of clusters using elbow method and silhouette analysis
        
        Args:
            tfidf_matrix: TF-IDF matrix
            max_clusters: Maximum number of clusters to test
            
        Returns:
            Dict: Optimal cluster analysis results
        """
        if tfidf_matrix.shape[0] < 2:
            return {'optimal_k': 1, 'silhouette_scores': [], 'inertias': []}
        
        inertias = []
        silhouette_scores = []
        k_range = range(2, min(max_clusters + 1, tfidf_matrix.shape[0]))
        
        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(tfidf_matrix)
            
            inertias.append(kmeans.inertia_)
            
            if len(set(cluster_labels)) > 1:  # Only calculate if multiple clusters exist
                silhouette_avg = silhouette_score(tfidf_matrix, cluster_labels)
                silhouette_scores.append(silhouette_avg)
            else:
                silhouette_scores.append(0)
        
        # Find optimal k (highest silhouette score)
        if silhouette_scores:
            optimal_k = k_range[np.argmax(silhouette_scores)]
        else:
            optimal_k = 2
        
        return {
            'optimal_k': optimal_k,
            'k_range': list(k_range),
            'inertias': inertias,
            'silhouette_scores': silhouette_scores,
            'max_silhouette': max(silhouette_scores) if silhouette_scores else 0
        }
    
    def perform_kmeans_clustering(self, tfidf_matrix: np.ndarray, n_clusters: int = 5) -> Dict[str, Any]:
        """
        Perform K-Means clustering
        
        Args:
            tfidf_matrix: TF-IDF matrix
            n_clusters: Number of clusters
            
        Returns:
            Dict: Clustering results
        """
        if tfidf_matrix.shape[0] < n_clusters:
            n_clusters = max(2, tfidf_matrix.shape[0] // 2)
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(tfidf_matrix)
        
        # Calculate metrics
        silhouette_avg = silhouette_score(tfidf_matrix, cluster_labels) if len(set(cluster_labels)) > 1 else 0
        calinski_harabasz = calinski_harabasz_score(tfidf_matrix.toarray(), cluster_labels) if len(set(cluster_labels)) > 1 else 0
        
        self.cluster_models['kmeans'] = kmeans
        
        return {
            'algorithm': 'kmeans',
            'n_clusters': n_clusters,
            'cluster_labels': cluster_labels,
            'centroids': kmeans.cluster_centers_,
            'inertia': kmeans.inertia_,
            'silhouette_score': silhouette_avg,
            'calinski_harabasz_score': calinski_harabasz,
            'cluster_sizes': [list(cluster_labels).count(i) for i in range(n_clusters)]
        }
    
    def perform_hierarchical_clustering(self, tfidf_matrix: np.ndarray, n_clusters: int = 5) -> Dict[str, Any]:
        """
        Perform hierarchical clustering
        
        Args:
            tfidf_matrix: TF-IDF matrix
            n_clusters: Number of clusters
            
        Returns:
            Dict: Clustering results
        """
        if tfidf_matrix.shape[0] < n_clusters:
            n_clusters = max(2, tfidf_matrix.shape[0] // 2)
        
        hierarchical = AgglomerativeClustering(n_clusters=n_clusters)
        cluster_labels = hierarchical.fit_predict(tfidf_matrix.toarray())
        
        # Calculate metrics
        silhouette_avg = silhouette_score(tfidf_matrix.toarray(), cluster_labels) if len(set(cluster_labels)) > 1 else 0
        calinski_harabasz = calinski_harabasz_score(tfidf_matrix.toarray(), cluster_labels) if len(set(cluster_labels)) > 1 else 0
        
        self.cluster_models['hierarchical'] = hierarchical
        
        return {
            'algorithm': 'hierarchical',
            'n_clusters': n_clusters,
            'cluster_labels': cluster_labels,
            'silhouette_score': silhouette_avg,
            'calinski_harabasz_score': calinski_harabasz,
            'cluster_sizes': [list(cluster_labels).count(i) for i in range(n_clusters)]
        }
    
    def perform_dbscan_clustering(self, tfidf_matrix: np.ndarray, eps: float = 0.5, min_samples: int = 5) -> Dict[str, Any]:
        """
        Perform DBSCAN clustering
        
        Args:
            tfidf_matrix: TF-IDF matrix
            eps: Epsilon parameter
            min_samples: Minimum samples parameter
            
        Returns:
            Dict: Clustering results
        """
        dbscan = DBSCAN(eps=eps, min_samples=min_samples, metric='cosine')
        cluster_labels = dbscan.fit_predict(tfidf_matrix.toarray())
        
        n_clusters = len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0)
        n_noise = list(cluster_labels).count(-1)
        
        # Calculate metrics (excluding noise points)
        if n_clusters > 1:
            mask = cluster_labels != -1
            if mask.sum() > 1:
                silhouette_avg = silhouette_score(tfidf_matrix.toarray()[mask], cluster_labels[mask])
                calinski_harabasz = calinski_harabasz_score(tfidf_matrix.toarray()[mask], cluster_labels[mask])
            else:
                silhouette_avg = 0
                calinski_harabasz = 0
        else:
            silhouette_avg = 0
            calinski_harabasz = 0
        
        self.cluster_models['dbscan'] = dbscan
        
        return {
            'algorithm': 'dbscan',
            'n_clusters': n_clusters,
            'n_noise': n_noise,
            'cluster_labels': cluster_labels,
            'eps': eps,
            'min_samples': min_samples,
            'silhouette_score': silhouette_avg,
            'calinski_harabasz_score': calinski_harabasz,
            'cluster_sizes': [list(cluster_labels).count(i) for i in set(cluster_labels) if i != -1]
        }
    
    def analyze_clusters(self, df: pd.DataFrame, cluster_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze clustering results and provide insights
        
        Args:
            df: Original DataFrame
            cluster_results: Clustering results
            
        Returns:
            Dict: Cluster analysis
        """
        cluster_labels = cluster_results['cluster_labels']
        n_clusters = cluster_results['n_clusters']
        
        # Add cluster labels to DataFrame
        df_analysis = df.copy()
        df_analysis['cluster'] = cluster_labels
        
        cluster_analysis = {}
        
        for cluster_id in range(n_clusters):
            cluster_data = df_analysis[df_analysis['cluster'] == cluster_id]
            
            if cluster_data.empty:
                continue
            
            # Get representative prompts (closest to centroid)
            if cluster_results['algorithm'] == 'kmeans':
                from sklearn.metrics.pairwise import cosine_similarity
                centroid = cluster_results['centroids'][cluster_id].reshape(1, -1)
                
                # For simplicity, we'll use random sampling for representative prompts
                representative_prompts = cluster_data['prompt'].sample(min(5, len(cluster_data))).tolist()
            else:
                representative_prompts = cluster_data['prompt'].sample(min(5, len(cluster_data))).tolist()
            
            # Extract keywords
            from analysis import PromptAnalyzer
            analyzer = PromptAnalyzer()
            all_words = []
            for prompt in cluster_data['prompt']:
                preprocessed = analyzer.preprocess_text(prompt)
                words = preprocessed.split()
                all_words.extend(words)
            
            from collections import Counter
            word_freq = Counter(all_words)
            top_keywords = [word for word, freq in word_freq.most_common(10)]
            
            # Calculate cluster statistics
            cluster_stats = {
                'cluster_id': cluster_id,
                'size': len(cluster_data),
                'avg_prompt_length': cluster_data['prompt'].str.len().mean(),
                'avg_word_count': cluster_data['prompt'].str.split().apply(len).mean(),
                'unique_users': cluster_data['userId'].nunique(),
                'representative_prompts': representative_prompts,
                'top_keywords': top_keywords,
                'most_common_category': cluster_data['category'].mode().iloc[0] if not cluster_data['category'].mode().empty else 'unknown',
                'avg_generation_time': cluster_data.get('generationTime', pd.Series([0])).mean()
            }
            
            # Assign cluster name based on keywords
            cluster_name = self.generate_cluster_name(top_keywords)
            cluster_stats['cluster_name'] = cluster_name
            
            cluster_analysis[f'cluster_{cluster_id}'] = cluster_stats
        
        return {
            'algorithm': cluster_results['algorithm'],
            'n_clusters': n_clusters,
            'overall_metrics': {
                'silhouette_score': cluster_results['silhouette_score'],
                'calinski_harabasz_score': cluster_results['calinski_harabasz_score']
            },
            'clusters': cluster_analysis
        }
    
    def generate_cluster_name(self, keywords: List[str]) -> str:
        """
        Generate a meaningful cluster name based on keywords
        
        Args:
            keywords: Top keywords in cluster
            
        Returns:
            str: Cluster name
        """
        keyword_to_category = {
            'portrait': 'Portrait',
            'person': 'Portrait',
            'face': 'Portrait',
            'landscape': 'Landscape',
            'nature': 'Nature',
            'tree': 'Nature',
            'mountain': 'Nature',
            'animal': 'Animals',
            'cat': 'Animals',
            'dog': 'Animals',
            'anime': 'Anime',
            'cartoon': 'Anime',
            'character': 'Characters',
            'fantasy': 'Fantasy',
            'dragon': 'Fantasy',
            'magic': 'Fantasy',
            'futuristic': 'Futuristic',
            'robot': 'Futuristic',
            'tech': 'Futuristic',
            'abstract': 'Abstract',
            'geometric': 'Abstract',
            'pattern': 'Abstract',
            'food': 'Food',
            'car': 'Vehicles',
            'building': 'Architecture',
            'house': 'Architecture',
            'city': 'Urban',
            'flower': 'Nature',
            'ocean': 'Nature',
            'space': 'Space',
            'planet': 'Space'
        }
        
        for keyword in keywords[:5]:  # Check top 5 keywords
            if keyword.lower() in keyword_to_category:
                return keyword_to_category[keyword.lower()]
        
        # Default naming based on most common keyword
        return keywords[0].title() if keywords else 'Uncategorized'
    
    def visualize_clusters(self, tfidf_matrix: np.ndarray, cluster_labels: np.ndarray, method: str = 'pca') -> None:
        """
        Visualize clusters using dimensionality reduction
        
        Args:
            tfidf_matrix: TF-IDF matrix
            cluster_labels: Cluster labels
            method: Dimensionality reduction method ('pca' or 'tsne')
        """
        try:
            # Convert to dense if sparse
            if hasattr(tfidf_matrix, 'toarray'):
                dense_matrix = tfidf_matrix.toarray()
            else:
                dense_matrix = tfidf_matrix
            
            # Dimensionality reduction
            if method == 'pca':
                reducer = PCA(n_components=2, random_state=42)
            else:  # t-SNE
                reducer = TSNE(n_components=2, random_state=42, perplexity=min(30, len(dense_matrix)-1))
            
            reduced_features = reducer.fit_transform(dense_matrix)
            
            # Create plot
            plt.figure(figsize=(12, 8))
            scatter = plt.scatter(reduced_features[:, 0], reduced_features[:, 1], 
                               c=cluster_labels, cmap='tab10', alpha=0.7, s=50)
            plt.colorbar(scatter, label='Cluster')
            plt.title(f'Prompt Clusters Visualization ({method.upper()})')
            plt.xlabel(f'{method.upper()} Component 1')
            plt.ylabel(f'{method.upper()} Component 2')
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            
            # Save plot
            plt.savefig(f'cluster_visualization_{method}.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            print(f"✅ Cluster visualization saved as 'cluster_visualization_{method}.png'")
            
        except Exception as e:
            print(f"❌ Error creating visualization: {e}")
    
    def save_clustering_results(self, cluster_analysis: Dict[str, Any]) -> bool:
        """
        Save clustering results to MongoDB
        
        Args:
            cluster_analysis: Cluster analysis results
            
        Returns:
            bool: Save status
        """
        if not self.db:
            return False
        
        try:
            document = {
                'analysis_type': 'clustering',
                'algorithm': cluster_analysis['algorithm'],
                'results': cluster_analysis,
                'created_at': datetime.now(),
                'n_clusters': cluster_analysis['n_clusters'],
                'metrics': cluster_analysis['overall_metrics']
            }
            
            self.db.prompt_analytics.insert_one(document)
            print(f"✅ Saved clustering results for {cluster_analysis['algorithm']}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving clustering results: {e}")
            return False
    
    def run_comprehensive_clustering(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Run comprehensive clustering analysis
        
        Args:
            days_back: Number of days to analyze
            
        Returns:
            Dict: Comprehensive clustering results
        """
        print(f"🚀 Starting comprehensive clustering analysis...")
        
        # Load data
        df, tfidf_matrix = self.load_prompt_data(days_back)
        if df.empty or tfidf_matrix.shape[0] == 0:
            return {}
        
        # Find optimal number of clusters
        optimal_analysis = self.find_optimal_clusters(tfidf_matrix)
        optimal_k = optimal_analysis['optimal_k']
        
        print(f"📊 Optimal number of clusters: {optimal_k}")
        print(f"📊 Max silhouette score: {optimal_analysis['max_silhouette']:.3f}")
        
        # Perform different clustering algorithms
        results = {}
        
        # K-Means
        kmeans_results = self.perform_kmeans_clustering(tfidf_matrix, optimal_k)
        kmeans_analysis = self.analyze_clusters(df, kmeans_results)
        results['kmeans'] = kmeans_analysis
        self.save_clustering_results(kmeans_analysis)
        
        # Hierarchical
        hierarchical_results = self.perform_hierarchical_clustering(tfidf_matrix, optimal_k)
        hierarchical_analysis = self.analyze_clusters(df, hierarchical_results)
        results['hierarchical'] = hierarchical_analysis
        self.save_clustering_results(hierarchical_analysis)
        
        # DBSCAN
        dbscan_results = self.perform_dbscan_clustering(tfidf_matrix)
        dbscan_analysis = self.analyze_clusters(df, dbscan_results)
        results['dbscan'] = dbscan_analysis
        self.save_clustering_results(dbscan_analysis)
        
        # Visualize best performing algorithm
        best_algorithm = max(results.keys(), 
                           key=lambda x: results[x]['overall_metrics']['silhouette_score'])
        
        print(f"🎨 Best algorithm: {best_algorithm}")
        print(f"📊 Silhouette score: {results[best_algorithm]['overall_metrics']['silhouette_score']:.3f}")
        
        # Visualize clusters
        best_labels = self.cluster_models[best_algorithm].labels_
        self.visualize_clusters(tfidf_matrix, best_labels, 'pca')
        
        print("✅ Comprehensive clustering analysis completed!")
        return {
            'optimal_analysis': optimal_analysis,
            'clustering_results': results,
            'best_algorithm': best_algorithm
        }

def main():
    """
    Main function to run clustering analysis
    """
    clusterer = PromptClusterer()
    
    if not clusterer.connect_to_database():
        return
    
    # Run clustering analysis
    results = clusterer.run_comprehensive_clustering(days_back=30)
    
    if results:
        print("\n🎯 Clustering Summary:")
        print(f"   Optimal Clusters: {results['optimal_analysis']['optimal_k']}")
        print(f"   Best Algorithm: {results['best_algorithm']}")
        
        best_results = results['clustering_results'][results['best_algorithm']]
        print(f"   Number of Clusters: {best_results['n_clusters']}")
        print(f"   Silhouette Score: {best_results['overall_metrics']['silhouette_score']:.3f}")
        
        print("\n📋 Cluster Categories:")
        for cluster_key, cluster_data in best_results['clusters'].items():
            print(f"   {cluster_data['cluster_name']}: {cluster_data['size']} prompts")

if __name__ == "__main__":
    main()
