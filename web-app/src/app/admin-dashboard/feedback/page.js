"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import AdminProtection from '../../components/AdminProtection';

function FeedbackAnalyticsContent() {
  const { isDarkMode } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  const [feedbackList, setFeedbackList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch(`/api/feedback/analytics?admin_token=${adminToken}&range=${timeRange}`);
        const data = await response.json();
        
        if (data.success) {
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error('Error fetching feedback analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentFeedback = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch(`/api/feedback/recent?admin_token=${adminToken}&limit=20`);
        const data = await response.json();
        
        if (data.success) {
          setFeedbackList(data.feedback || []);
        }
      } catch (error) {
        console.error('Error fetching recent feedback:', error);
      }
    };

    const fetchData = async () => {
      await fetchAnalytics();
      await fetchRecentFeedback();
    };
    fetchData();
  }, [timeRange]);

  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
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

  const statCardStyle = {
    ...cardStyle,
    textAlign: 'center',
    transition: 'transform 0.2s ease'
  };

  const getFeedbackTypeColor = (type) => {
    const colors = {
      helpful: '#10b981',
      somewhat_helpful: '#f59e0b',
      not_helpful: '#ef4444',
      inaccurate: '#dc2626',
      suggestion: '#8b5cf6',
      bug_report: '#f97316',
      confusing: '#f59e0b'
    };
    return colors[type] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
          <h2 style={{ color: isDarkMode ? '#f8fafc' : 'white' }}>Loading analytics...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: isDarkMode ? '#f8fafc' : 'white',
            marginBottom: '16px'
          }}>
            📝 Feedback Analytics
          </h1>
          <p style={{
            fontSize: '18px',
            color: isDarkMode ? 'rgba(248, 250, 252, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            marginBottom: '20px'
          }}>
            Monitor user satisfaction and system improvement opportunities
          </p>

          {/* Time Range Selector */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: 'all', label: 'All time' }
            ].map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                style={{
                  padding: '8px 16px',
                  background: timeRange === range.value ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        {analytics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            <div style={statCardStyle}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#3b82f6',
                marginBottom: '8px'
              }}>
                {analytics.totalFeedback || 0}
              </div>
              <div style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                Total Feedback
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📈</div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#10b981',
                marginBottom: '8px'
              }}>
                {analytics.recentFeedback || 0}
              </div>
              <div style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                Recent ({timeRange})
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⭐</div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#f59e0b',
                marginBottom: '8px'
              }}>
                {analytics.averageUsefulness?.toFixed(1) || '0.0'}
              </div>
              <div style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                Avg Rating
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>😊</div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#10b981',
                marginBottom: '8px'
              }}>
                {analytics.satisfactionRate || '0'}%
              </div>
              <div style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                Satisfaction Rate
              </div>
            </div>
          </div>
        )}

        {/* Feedback by Type Chart */}
        {analytics?.feedbackByType && (
          <div style={cardStyle}>
            <h3 style={{ 
              color: isDarkMode ? '#f8fafc' : '#1f2937', 
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              📊 Feedback Distribution
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {analytics.feedbackByType.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: getFeedbackTypeColor(item._id),
                        marginRight: '8px'
                      }}
                    />
                    <span style={{ 
                      fontWeight: '500',
                      textTransform: 'capitalize',
                      color: isDarkMode ? '#f1f5f9' : '#374151'
                    }}>
                      {item._id?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: getFeedbackTypeColor(item._id)
                  }}>
                    {item.count}
                  </div>
                  {item.avgUsefulness && (
                    <div style={{ 
                      fontSize: '12px',
                      color: isDarkMode ? '#94a3b8' : '#6b7280'
                    }}>
                      Avg: {item.avgUsefulness.toFixed(1)} ⭐
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ 
              color: isDarkMode ? '#f8fafc' : '#1f2937',
              fontSize: '20px',
              fontWeight: '600',
              margin: 0
            }}>
              🔄 Recent Feedback
            </h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                fontSize: '14px'
              }}
            >
              <option value="all">All Categories</option>
              <option value="helpful">Helpful</option>
              <option value="not_helpful">Not Helpful</option>
              <option value="suggestion">Suggestions</option>
              <option value="bug_report">Bug Reports</option>
            </select>
          </div>

          {feedbackList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                No recent feedback found
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {feedbackList
                .filter(feedback => selectedCategory === 'all' || feedback.feedbackType === selectedCategory)
                .slice(0, 10)
                .map((feedback, index) => (
                <div
                  key={feedback._id || index}
                  style={{
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          background: getFeedbackTypeColor(feedback.feedbackType),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {feedback.feedbackType?.replace('_', ' ') || 'General'}
                      </span>
                      {feedback.usefulnessScore && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {'⭐'.repeat(Math.max(1, Math.min(5, feedback.usefulnessScore)))}
                          <span style={{ marginLeft: '4px', fontSize: '12px', color: '#6b7280' }}>
                            ({feedback.usefulnessScore}/5)
                          </span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {formatDate(feedback.timestamp)}
                    </span>
                  </div>
                  
                  {feedback.userComment && (
                    <div style={{ 
                      color: isDarkMode ? '#f1f5f9' : '#374151',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      fontStyle: 'italic'
                    }}>
                      &ldquo;{feedback.userComment}&rdquo;
                    </div>
                  )}
                  
                  {feedback.context && (
                    <div style={{ 
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      Feature: {feedback.context.feature || 'Unknown'} | 
                      Page: {feedback.context.page || 'Unknown'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedbackAnalytics() {
  return (
    <AdminProtection>
      <FeedbackAnalyticsContent />
    </AdminProtection>
  );
}
