"use client";

import { useState } from 'react';
import FeedbackButton from '../components/FeedbackButton';
import FeedbackPrompt from '../components/FeedbackPrompt';
import { useFeedbackCollection } from '../hooks/useFeedbackCollection';

export default function FeedbackDemo() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [completedActions, setCompletedActions] = useState({
    action1: false,
    action2: false,
    action3: false
  });

  const feedback = useFeedbackCollection('demo', {
    autoPrompt: true,
    promptDelay: 2000,
    triggerConditions: {
      minInteractions: 2,
      timeSpent: 5000
    }
  });

  const handleAction = (actionKey, actionName) => {
    setCompletedActions(prev => ({
      ...prev,
      [actionKey]: true
    }));
    
    feedback.trackInteraction(actionName, {
      timestamp: Date.now(),
      actionType: 'button_click'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--primary-gradient)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        backdropFilter: 'blur(20px)'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '700',
          color: '#1f2937',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          🔬 Feedback System Demo
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          This page demonstrates all the feedback collection components. 
          Try the actions below to trigger automatic feedback prompts!
        </p>

        {/* Demo Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>📱 Action 1</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Click this button to simulate a user action
            </p>
            <button
              onClick={() => handleAction('action1', 'demo_action_1')}
              disabled={completedActions.action1}
              style={{
                background: completedActions.action1 ? '#10b981' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: completedActions.action1 ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {completedActions.action1 ? '✅ Completed' : '📱 Try Action 1'}
            </button>
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>🔄 Action 2</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Another action to build interaction history
            </p>
            <button
              onClick={() => handleAction('action2', 'demo_action_2')}
              disabled={completedActions.action2}
              style={{
                background: completedActions.action2 ? '#10b981' : '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: completedActions.action2 ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {completedActions.action2 ? '✅ Completed' : '🔄 Try Action 2'}
            </button>
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>⚡ Action 3</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Final action to trigger feedback prompt
            </p>
            <button
              onClick={() => handleAction('action3', 'demo_action_3')}
              disabled={completedActions.action3}
              style={{
                background: completedActions.action3 ? '#10b981' : '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: completedActions.action3 ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {completedActions.action3 ? '✅ Completed' : '⚡ Try Action 3'}
            </button>
          </div>
        </div>

        {/* Manual Feedback Triggers */}
        <div style={{
          background: '#f1f5f9',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '40px'
        }}>
          <h3 style={{ color: '#1f2937', marginBottom: '16px' }}>🎮 Manual Triggers</h3>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowPrompt(true)}
              style={{
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📋 Show Feedback Prompt
            </button>
            
            <button
              onClick={feedback.showFeedbackModal}
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📝 Show Feedback Modal
            </button>
            
            <button
              onClick={feedback.thumbsUp}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              👍 Quick Positive
            </button>
            
            <button
              onClick={feedback.thumbsDown}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              👎 Quick Negative
            </button>
          </div>
        </div>

        {/* Feedback State Display */}
        <div style={{
          background: '#ecfdf5',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #d1fae5'
        }}>
          <h3 style={{ color: '#065f46', marginBottom: '12px' }}>📊 Feedback State</h3>
          <div style={{ fontSize: '14px', color: '#047857' }}>
            <p>• Actions completed: {Object.values(completedActions).filter(Boolean).length}/3</p>
            <p>• Auto-prompt ready: {feedback.canPrompt ? '✅ Yes' : '❌ No'}</p>
            <p>• Has submitted feedback: {feedback.hasSubmitted ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: '#fffbeb',
          borderRadius: '12px',
          border: '1px solid #fde68a'
        }}>
          <h3 style={{ color: '#92400e', marginBottom: '12px' }}>📋 How to Test</h3>
          <ol style={{ color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
            <li>Click the action buttons above to simulate user interactions</li>
            <li>After 2+ actions, wait 5 seconds for auto-prompt</li>
            <li>Use manual triggers to test specific components</li>
            <li>Check the feedback state to see what&apos;s happening</li>
            <li>Look for floating feedback button in bottom corners</li>
          </ol>
        </div>
      </div>

      {/* Feedback Components */}
      <FeedbackButton 
        feature="feedback_demo" 
        context={{ 
          actionsCompleted: Object.values(completedActions).filter(Boolean).length,
          totalActions: 3
        }}
        position="bottom-right"
        style="floating"
      />

      <FeedbackPrompt
        trigger={showPrompt}
        feature="Feedback Demo"
        delay={1000}
        conditions={{
          completedAction: true
        }}
        onSubmit={(feedbackData) => {
          console.log('Demo feedback submitted:', feedbackData);
          setShowPrompt(false);
        }}
      />
    </div>
  );
}
