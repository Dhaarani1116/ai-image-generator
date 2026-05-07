import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './Analytics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Dummy data for demonstration
const dummyAnalyticsData = {
  stats: {
    totalGenerations: 24,
    totalLikes: 156,
    totalDownloads: 89,
    avgPromptLength: 45,
    generationsThisMonth: 12,
    generationsLastMonth: 8
  },
  dailyTrends: [
    { date: '2024-01-01', count: 2, avgGenerationTime: 3.2 },
    { date: '2024-01-02', count: 3, avgGenerationTime: 2.8 },
    { date: '2024-01-03', count: 1, avgGenerationTime: 4.1 },
    { date: '2024-01-04', count: 4, avgGenerationTime: 3.5 },
    { date: '2024-01-05', count: 2, avgGenerationTime: 3.0 },
    { date: '2024-01-06', count: 5, avgGenerationTime: 2.9 },
    { date: '2024-01-07', count: 3, avgGenerationTime: 3.3 }
  ],
  categoryDistribution: {
    'Nature & Landscapes': 8,
    'Sci-Fi & Cyberpunk': 6,
    'Portraits & People': 4,
    'Abstract & Artistic': 3,
    'Anime & Illustration': 3
  },
  qualityDistribution: {
    'High Quality': 15,
    'Medium Quality': 6,
    'Standard Quality': 3
  },
  promptLengthStats: {
    average: 45,
    min: 12,
    max: 120,
    distribution: [2, 5, 8, 6, 3]
  },
  wordFrequency: [
    { word: 'beautiful', count: 18 },
    { word: 'sunset', count: 12 },
    { word: 'futuristic', count: 9 },
    { word: 'portrait', count: 7 },
    { word: 'nature', count: 6 }
  ],
  topEngagingPrompts: [
    { prompt: 'A beautiful sunset over mountains with golden clouds', likes: 24, downloads: 15 },
    { prompt: 'Futuristic cyberpunk city with neon lights', likes: 19, downloads: 12 },
    { prompt: 'Portrait of a wise old man with kind eyes', likes: 16, downloads: 8 }
  ]
};

function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(dummyAnalyticsData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Using dummy data for now - in production, fetch from API
    // fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/analytics/dashboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data.data || dummyAnalyticsData);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setAnalyticsData(dummyAnalyticsData);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/analytics/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.personalizedRecommendations || [];
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchAnalyticsData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-container">
        <div className="empty-state">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  // Chart configurations using dummy data
  const dailyStatsChart = {
    labels: analyticsData.dailyTrends.map(stat => new Date(stat.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Generations',
        data: analyticsData.dailyTrends.map(stat => stat.count),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const categoryChart = {
    labels: Object.keys(analyticsData.categoryDistribution),
    datasets: [
      {
        label: 'Prompt Categories',
        data: Object.values(analyticsData.categoryDistribution),
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#f093fb',
          '#f5576c',
          '#4facfe',
          '#00f2fe'
        ]
      }
    ]
  };

  const qualityChart = {
    labels: Object.keys(analyticsData.qualityDistribution),
    datasets: [
      {
        label: 'Image Quality Distribution',
        data: Object.values(analyticsData.qualityDistribution),
        backgroundColor: [
          '#48bb78',
          '#ed8936',
          '#fc8181'
        ]
      }
    ]
  };

  const promptLengthChart = {
    labels: ['0-20 chars', '21-40 chars', '41-60 chars', '61-80 chars', '80+ chars'],
    datasets: [
      {
        label: 'Prompt Length Distribution',
        data: analyticsData.promptLengthStats.distribution,
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(118, 75, 162, 0.8)',
          'rgba(240, 147, 251, 0.8)',
          'rgba(245, 87, 108, 0.8)',
          'rgba(79, 172, 254, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ]
      }
    ]
  };

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div className="header-left">
          <Link to="/" className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
          <h1>📊 Analytics Dashboard</h1>
        </div>
        <div className="timeframe-selector">
          <label htmlFor="timeframe">Timeframe:</label>
          <select 
            id="timeframe" 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </header>

      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          ✍️ Prompts
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          🎯 Recommendations
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="tab-content">
            {/* User Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Generations</h3>
                <p className="stat-value">{analyticsData.stats.totalGenerations}</p>
                <span className="stat-label">All time</span>
              </div>
              <div className="stat-card">
                <h3>Total Likes</h3>
                <p className="stat-value">{analyticsData.stats.totalLikes}</p>
                <span className="stat-label">On your images</span>
              </div>
              <div className="stat-card">
                <h3>Total Downloads</h3>
                <p className="stat-value">{analyticsData.stats.totalDownloads}</p>
                <span className="stat-label">Your images</span>
              </div>
              <div className="stat-card">
                <h3>Avg Prompt Length</h3>
                <p className="stat-value">{analyticsData.stats.avgPromptLength}</p>
                <span className="stat-label">Characters</span>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-container">
                <h3>Daily Generation Trends</h3>
                <Line data={dailyStatsChart} options={{ responsive: true }} />
              </div>
              <div className="chart-container">
                <h3>Category Distribution</h3>
                <Doughnut data={categoryChart} options={{ responsive: true }} />
              </div>
              <div className="chart-container">
                <h3>Quality Distribution</h3>
                <Pie data={qualityChart} options={{ responsive: true }} />
              </div>
              <div className="chart-container">
                <h3>Prompt Length Statistics</h3>
                <Bar data={promptLengthChart} options={{ responsive: true }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="tab-content">
            <div className="prompt-analysis">
              <div className="analysis-section">
                <h3>📝 Prompt Length Analysis</h3>
                <div className="length-stats">
                  <div className="length-stat">
                    <label>Average Length:</label>
                    <span>{Math.round(analyticsData.promptLengthStats?.average || analyticsData.stats?.avgPromptLength || 0)} chars</span>
                  </div>
                  <div className="length-stat">
                    <label>Median Length:</label>
                    <span>{Math.round((analyticsData.promptLengthStats?.min + analyticsData.promptLengthStats?.max) / 2 || analyticsData.stats?.avgPromptLength || 0)} chars</span>
                  </div>
                  <div className="length-stat">
                    <label>Min Length:</label>
                    <span>{analyticsData.promptLengthStats?.min || 0} chars</span>
                  </div>
                  <div className="length-stat">
                    <label>Max Length:</label>
                    <span>{analyticsData.promptLengthStats?.max || 0} chars</span>
                  </div>
                </div>
              </div>

              <div className="analysis-section">
                <h3>🏷️ Category Breakdown</h3>
                <div className="category-list">
                  {Object.entries(analyticsData.categoryDistribution || {}).map(([category, count], index) => {
                    const maxCount = Math.max(...Object.values(analyticsData.categoryDistribution || {}));
                    return (
                      <div key={index} className="category-item">
                        <span className="category-name">{category}</span>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          ></div>
                        </div>
                        <span className="category-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="analysis-section">
                <h3>⭐ Top Prompts by Engagement</h3>
                <div className="top-prompts">
                  {(analyticsData.topEngagingPrompts || []).map((prompt, index) => (
                    <div key={index} className="top-prompt-item">
                      <div className="prompt-rank">#{index + 1}</div>
                      <div className="prompt-content">
                        <p className="prompt-text">{prompt.prompt}</p>
                        <div className="prompt-meta">
                          <span>❤️ {prompt.likes || 0}</span>
                          <span>⬇️ {prompt.downloads || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="tab-content">
            <RecommendationPanel />
          </div>
        )}
      </div>
    </div>
  );
}

// Recommendation Panel Component
function RecommendationPanel() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/analytics/recommendations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.data.personalizedRecommendations || []);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return <div className="loading-recommendations">Loading recommendations...</div>;
  }

  return (
    <div className="recommendations-panel">
      <h3>🎯 Personalized Recommendations</h3>
      {recommendations.length === 0 ? (
        <div className="no-recommendations">
          <p>No recommendations available yet. Generate more images to get personalized suggestions!</p>
        </div>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <div className="rec-header">
                <span className="rec-category">{rec.category}</span>
                <span className="rec-similarity">Similarity: {(rec.similarity * 100).toFixed(1)}%</span>
              </div>
              <p className="rec-prompt">{rec.prompt}</p>
              <div className="rec-meta">
                <span>⏱️ {rec.generationTime}ms</span>
                <span>📅 {new Date(rec.created_at).toLocaleDateString()}</span>
              </div>
              <button 
                className="use-prompt-btn"
                onClick={() => {
                  // Navigate to home page with this prompt
                  window.location.href = `/?prompt=${encodeURIComponent(rec.prompt)}`;
                }}
              >
                Use This Prompt
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Analytics;
