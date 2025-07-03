import React, { useEffect } from 'react';
import styles from './ProactivePromptToast.module.css';

/**
 * ProactivePromptToast - A floating, animated, dismissible toast for proactive suggestions.
 * Props:
 *   - visible: boolean
 *   - onAccept: () => void
 *   - onDismiss: () => void
 *   - prediction: object (optional, for context)
 */
const ProactivePromptToast = ({ visible, onAccept, onDismiss, prediction }) => {
  // Auto-dismiss after 15s if not interacted with
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onDismiss && onDismiss();
    }, 15000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  // Compose a concise message (no mention of predicted class)
  const conciseMsg = 'Want an explanation for your latest result?';

  return (
    <div className={styles.toast}>
      <div className={styles.icon}>💡</div>
      <div className={styles.content}>
        <div className={styles.title}>AI Assistant</div>
        <div className={styles.text}>{conciseMsg}</div>
        <div className={styles.actions}>
          <button className={styles.accept} onClick={onAccept}>Explain</button>
          <button className={styles.dismiss} onClick={onDismiss}>Dismiss</button>
        </div>
      </div>
      <button className={styles.close} onClick={onDismiss} aria-label="Close">×</button>
    </div>
  );
};

export default ProactivePromptToast;
