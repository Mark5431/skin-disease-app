"use client";

import { useState, useEffect } from 'react';
import { auth } from '../utils/auth';
import styles from './FeedbackButton.module.css';
import { useTheme } from '../contexts/ThemeContext';

// Define the API base URL
const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function FeedbackButton({ 
  feature, 
  context = {}, 
  position = 'bottom-right',
  size = 'medium',
  style = 'floating'
}) {
  // Use theme context for dark mode support
  const themeContext = useTheme();
  const { theme = 'light', isDarkMode = false } = themeContext || {};
  
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined' && auth.isAuthenticated()) {
      return auth.getCurrentUser();
    }
    return null;
  });
  const [showModal, setShowModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('helpful');
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      alert('Please log in to provide feedback');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          feedback_type: feedbackType,
          usefulness_score: rating,
          user_comment: comment,
          summary_id: `${feature}_feedback`,
          image_id: context?.imageId || null,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowModal(false);
          setSubmitted(false);
          setComment('');
          setRating(4);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPositionStyle = () => {
    if (position === 'inline') return {};
    
    const positions = {
      'bottom-right': { position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 },
      'bottom-left': { position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 },
      'top-right': { position: 'fixed', top: '20px', right: '20px', zIndex: 1000 },
      'top-left': { position: 'fixed', top: '20px', left: '20px', zIndex: 1000 }
    };
    return positions[position] || {};
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${styles.feedbackButton} ${isDarkMode ? styles.darkTheme : ''}`}
        style={getPositionStyle()}
        data-theme={theme}
      >
        📝 Feedback
      </button>

      {showModal && (
        <div className={styles.feedbackModal} onClick={() => setShowModal(false)}>
          <div 
            className={`${styles.feedbackModalContent} ${isDarkMode ? styles.darkTheme : ''}`} 
            data-theme={theme} 
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>✅</div>
                <h3 className={styles.successTitle}>Thank you!</h3>
                <p>Your feedback helps us improve</p>
              </div>
            ) : (
              <>
                <h3>
                  📝 Feedback
                </h3>

                <div className={styles.formGroup}>
                  <label>
                    How was your experience?
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                  >
                    <option value="helpful">👍 Very helpful</option>
                    <option value="somewhat_helpful">😐 Somewhat helpful</option>
                    <option value="not_helpful">👎 Not helpful</option>
                    <option value="confusing">😕 Confusing</option>
                    <option value="bug_report">🐛 Found a bug</option>
                    <option value="suggestion">💡 Have a suggestion</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Rating (1-5 stars)
                  </label>
                  <div className={styles.starRow}>
                    {[1, 2, 3, 4, 5].map(num => (
                      <span
                        key={num}
                        onClick={() => setRating(num)}
                        className={`${styles.star} ${num <= rating ? '' : styles.inactive}`}
                      >
                        {num <= rating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Comments (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us more about your experience..."
                  />
                </div>

                <div className={styles.actions}>
                  <button
                    onClick={() => setShowModal(false)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={styles.submitBtn}
                  >
                    {isSubmitting ? '⏳ Submitting...' : '📤 Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
