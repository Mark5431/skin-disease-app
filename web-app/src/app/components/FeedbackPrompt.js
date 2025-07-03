"use client";

import { useState, useEffect } from 'react';
import { auth } from '../utils/auth';

// Define the API base URL
const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function FeedbackPrompt({ 
  trigger, 
  feature, 
  delay = 3000,
  conditions = {},
  onSubmit 
}) {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined' && auth.isAuthenticated()) {
      return auth.getCurrentUser();
    }
    return null;
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [feedbackType, setFeedbackType] = useState('helpful');
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (trigger && !dismissed && user) {
      // Check conditions
      const shouldShow = Object.entries(conditions).every(([key, value]) => {
        switch (key) {
          case 'minTimeOnPage':
            return Date.now() - window.performance.navigation.loadEventStart > value;
          case 'completedAction':
            return value === true;
          case 'errorOccurred':
            return value === false; // Show prompt when no errors
          default:
            return true;
        }
      });

      if (shouldShow) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, delay);

        return () => clearTimeout(timer);
      }
    }
  }, [trigger, dismissed, delay, conditions, user]);

  const handleSubmit = async (quickFeedback = null) => {
    if (!user) return;

    const feedbackData = {
      user_id: user.userId,
      feedback_type: quickFeedback || feedbackType,
      usefulness_score: quickFeedback ? (quickFeedback === 'helpful' ? 5 : 2) : rating,
      user_comment: comment || `Quick feedback: ${quickFeedback || feedbackType}`,
      summary_id: `${feature}_prompt`,
      image_id: null,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(`${apiBase}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      if (onSubmit) onSubmit(feedbackData);
      setShowPrompt(false);
      setDismissed(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
  };

  if (!showPrompt || !user) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      maxWidth: '350px',
      zIndex: 9999,
      border: '1px solid #e5e7eb',
      animation: 'slideInUp 0.3s ease-out'
    }}>
      <style>
        {`
          @keyframes slideInUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
          💭 Quick Feedback
        </h4>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '0',
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>

      <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
        How was your experience with {feature}?
      </p>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => handleSubmit('helpful')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#ecfdf5',
            color: '#10b981',
            border: '1px solid #d1fae5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          👍 Great!
        </button>
        <button
          onClick={() => handleSubmit('not_helpful')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#fef2f2',
            color: '#ef4444',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          👎 Could be better
        </button>
      </div>

      {/* Detailed Feedback Toggle */}
      <details>
        <summary style={{ 
          cursor: 'pointer', 
          color: '#6b7280', 
          fontSize: '12px',
          marginBottom: '12px'
        }}>
          ✏️ Add detailed feedback
        </summary>
        
        <div style={{ paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ marginBottom: '12px' }}>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="helpful">Very helpful</option>
              <option value="somewhat_helpful">Somewhat helpful</option>
              <option value="not_helpful">Not helpful</option>
              <option value="confusing">Confusing</option>
              <option value="bug_report">Found a bug</option>
              <option value="suggestion">Have a suggestion</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <span
                  key={num}
                  onClick={() => setRating(num)}
                  style={{
                    fontSize: '16px',
                    cursor: 'pointer',
                    color: num <= rating ? '#fbbf24' : '#d1d5db',
                    transition: 'color 0.2s'
                  }}
                >
                  {num <= rating ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more..."
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              resize: 'vertical',
              marginBottom: '12px'
            }}
          />

          <button
            onClick={() => handleSubmit()}
            style={{
              width: '100%',
              padding: '8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            📤 Submit Feedback
          </button>
        </div>
      </details>
    </div>
  );
}
