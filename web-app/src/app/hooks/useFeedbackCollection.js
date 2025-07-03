import { useState, useEffect, useCallback } from 'react';
import { auth } from '../utils/auth';

export function useFeedbackCollection(feature, options = {}) {
  const [user, setUser] = useState(null);
  const [feedbackState, setFeedbackState] = useState({
    showPrompt: false,
    hasSubmitted: false,
    dismissedCount: 0
  });

  // Get current user on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && auth.isAuthenticated()) {
      setUser(auth.getCurrentUser());
    }
  }, []);

  const {
    autoPrompt = false,
    promptDelay = 5000,
    maxDismissals = 2,
    triggerConditions = {}
  } = options;

  // Check if we should prompt for feedback
  const shouldPromptForFeedback = useCallback((interactions) => {
    const featureInteractions = interactions.filter(i => i.feature === feature);
    
    // Check various conditions
    const conditions = {
      minInteractions: triggerConditions.minInteractions || 3,
      timeSpent: triggerConditions.timeSpent || 30000, // 30 seconds
      completedActions: triggerConditions.completedActions || []
    };

    // Has enough interactions
    if (featureInteractions.length < conditions.minInteractions) return false;

    // Spent enough time
    const firstInteraction = featureInteractions[0];
    const timeSpent = Date.now() - firstInteraction.timestamp;
    if (timeSpent < conditions.timeSpent) return false;

    // Completed required actions
    if (conditions.completedActions.length > 0) {
      const completedActions = featureInteractions.map(i => i.action);
      const hasCompletedAll = conditions.completedActions.every(action =>
        completedActions.includes(action)
      );
      if (!hasCompletedAll) return false;
    }

    return true;
  }, [feature, triggerConditions]);

  // Track user interactions
  const trackInteraction = useCallback((action, context = {}) => {
    if (!user) return;

    // Store interaction for potential feedback prompting
    const interaction = {
      feature,
      action,
      timestamp: Date.now(),
      context,
      userId: user.userId
    };

    // Save to sessionStorage for this session
    const existingInteractions = JSON.parse(
      sessionStorage.getItem('feedbackInteractions') || '[]'
    );
    existingInteractions.push(interaction);
    sessionStorage.setItem('feedbackInteractions', JSON.stringify(existingInteractions));

    // Check if we should prompt for feedback
    if (autoPrompt && shouldPromptForFeedback(existingInteractions)) {
      setTimeout(() => {
        if (feedbackState.dismissedCount < maxDismissals) {
          setFeedbackState(prev => ({ ...prev, showPrompt: true }));
        }
      }, promptDelay);
    }
  }, [user, feature, autoPrompt, promptDelay, maxDismissals, feedbackState.dismissedCount, shouldPromptForFeedback]);

  const submitFeedback = async (feedbackData) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          summaryId: `${feature}_feedback`,
          context: {
            feature,
            collectionMethod: 'useFeedbackCollection',
            ...feedbackData.context
          },
          ...feedbackData
        })
      });

      if (response.ok) {
        setFeedbackState(prev => ({ 
          ...prev, 
          hasSubmitted: true, 
          showPrompt: false 
        }));
        return true;
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
    return false;
  };

  const dismissPrompt = () => {
    setFeedbackState(prev => ({ 
      ...prev, 
      showPrompt: false, 
      dismissedCount: prev.dismissedCount + 1 
    }));
  };

  const showFeedbackModal = () => {
    setFeedbackState(prev => ({ ...prev, showPrompt: true }));
  };

  // Quick feedback methods
  const submitQuickFeedback = async (type, rating = null, comment = '') => {
    return await submitFeedback({
      feedbackType: type,
      usefulnessScore: rating || (type === 'helpful' ? 5 : type === 'not_helpful' ? 2 : 3),
      userComment: comment || `Quick ${type} feedback for ${feature}`
    });
  };

  const thumbsUp = () => submitQuickFeedback('helpful', 5);
  const thumbsDown = () => submitQuickFeedback('not_helpful', 2);

  return {
    // State
    showPrompt: feedbackState.showPrompt,
    hasSubmitted: feedbackState.hasSubmitted,
    canPrompt: feedbackState.dismissedCount < maxDismissals,

    // Actions
    trackInteraction,
    submitFeedback,
    submitQuickFeedback,
    showFeedbackModal,
    dismissPrompt,
    thumbsUp,
    thumbsDown,

    // Utils
    feature
  };
}

// Convenience hook for specific features
export function useUploadFeedback() {
  return useFeedbackCollection('image_upload', {
    autoPrompt: true,
    promptDelay: 3000,
    triggerConditions: {
      completedActions: ['upload_started', 'upload_completed'],
      minInteractions: 2
    }
  });
}

export function useDashboardFeedback() {
  return useFeedbackCollection('dashboard', {
    autoPrompt: true,
    promptDelay: 10000,
    triggerConditions: {
      timeSpent: 20000,
      minInteractions: 5
    }
  });
}

export function useAnalysisFeedback() {
  return useFeedbackCollection('analysis_results', {
    autoPrompt: true,
    promptDelay: 5000,
    triggerConditions: {
      completedActions: ['viewed_results', 'clicked_details'],
      minInteractions: 3
    }
  });
}
