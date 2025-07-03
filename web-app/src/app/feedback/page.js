"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function Feedback() {
  const { isDarkMode } = useTheme();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    helpful: 0,
    notHelpful: 0,
    suggestions: 0,
    avgRating: 0
  });

  const calculateStats = useCallback((feedback) => {
    const total = feedback.length;
    const helpful = feedback.filter(f => f.feedbackType === 'helpful').length;
    const notHelpful = feedback.filter(f => f.feedbackType === 'not_helpful').length;
    const suggestions = feedback.filter(f => f.feedbackType === 'suggestion').length;
    const avgRating = feedback.reduce((sum, f) => sum + (f.usefulnessScore || 0), 0) / total || 0;

    setStats({ total, helpful, notHelpful, suggestions, avgRating });
  }, []);

  const fetchUserFeedback = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('No user ID found');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/feedback?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setFeedbackList(data.feedback);
        calculateStats(data.feedback);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFeedbackIcon = (type) => {
    switch (type) {
      case 'helpful': return '👍';
      case 'not_helpful': return '👎';
      case 'inaccurate': return '⚠️';
      case 'suggestion': return '💡';
      default: return '📝';
    }
  };

  const getRatingStars = (score) => {
    return '⭐'.repeat(score || 0) + '☆'.repeat(5 - (score || 0));
  };

  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    color: isDarkMode ? '#e2e8f0' : '#1f2937'
  };

  const cardStyle = {
    background: isDarkMode 
      ? 'rgba(30, 41, 59, 0.9)'
      : 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '24px',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
    boxShadow: isDarkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
          <h2>Loading your feedback...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '700',
          color: isDarkMode ? '#f8fafc' : 'white',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          📝 Your Feedback History
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: isDarkMode ? 'rgba(248, 250, 252, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          Track your feedback and help us improve our AI assistant
        </p>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={cardStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
              <div style={{ opacity: 0.7 }}>Total Feedback</div>
            </div>
          </div>
          
          <div style={cardStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👍</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.helpful}</div>
              <div style={{ opacity: 0.7 }}>Helpful</div>
            </div>
          </div>
          
          <div style={cardStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💡</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.suggestions}</div>
              <div style={{ opacity: 0.7 }}>Suggestions</div>
            </div>
          </div>
          
          <div style={cardStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.avgRating.toFixed(1)}</div>
              <div style={{ opacity: 0.7 }}>Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {feedbackList.length === 0 ? (
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
              <h3>No feedback yet</h3>
              <p style={{ opacity: 0.7 }}>
                Start using our AI assistant to provide feedback on your analysis results!
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
              Recent Feedback
            </h2>
            
            {feedbackList.map((feedback, index) => (
              <div 
                key={feedback._id} 
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedFeedback(selectedFeedback === feedback._id ? null : feedback._id)}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = isDarkMode 
                    ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                    : '0 12px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px', marginRight: '12px' }}>
                        {getFeedbackIcon(feedback.feedbackType)}
                      </span>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px', textTransform: 'capitalize' }}>
                          {feedback.feedbackType.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.7 }}>
                          {formatDate(feedback.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    {feedback.usefulnessScore && (
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '16px' }}>
                          {getRatingStars(feedback.usefulnessScore)}
                        </span>
                        <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                          ({feedback.usefulnessScore}/5)
                        </span>
                      </div>
                    )}
                    
                    {selectedFeedback === feedback._id && feedback.userComment && (
                      <div style={{
                        background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.05)',
                        padding: '16px',
                        borderRadius: '12px',
                        marginTop: '12px',
                        borderLeft: `4px solid ${isDarkMode ? '#3b82f6' : '#667eea'}`
                      }}>
                        <div style={{ fontStyle: 'italic', fontSize: '14px' }}>
                          &ldquo;{feedback.userComment}&rdquo;
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    opacity: 0.5,
                    transform: selectedFeedback === feedback._id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}>
                    ▼
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}