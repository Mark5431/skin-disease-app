'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { marked } from 'marked';
import styles from './FloatingChatbot.module.css';

const FloatingChatbot = () => {
  // Listen for global event to open chatbot with optional pre-filled question
  // Store extra context for API calls (not shown to user)
  const [extraContext, setExtraContext] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      setIsOpen(true);
      if (e.detail && typeof e.detail.question === 'string') {
        setInputValue(e.detail.question);
      }
      if (e.detail && e.detail.predictionDetails) {
        setExtraContext(e.detail.predictionDetails);
      } else {
        setExtraContext(null);
      }
    };
    window.addEventListener('open-chatbot', handler);
    return () => window.removeEventListener('open-chatbot', handler);
  }, []);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI-powered dermatology assistant. I'm here to help you with:\n\n🔬 Understanding skin lesion analysis results\n📊 Interpreting confidence scores and medical terminology\n🎯 Guidance on image upload best practices\n⚠️ When to seek professional medical care\n�️ Skin health education and prevention tips\n📈 Understanding result trends over time\n\nRemember: I'm a screening tool to support your healthcare decisions, not replace professional medical advice. For urgent concerns, always consult a healthcare provider immediately.\n\nHow can I assist you today?",
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Configure marked for safe HTML rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
    sanitize: false,
    smartLists: true,
    smartypants: true
  });

  // Function to render markdown text as HTML
  const renderMarkdown = (text) => {
    try {
      const html = marked(text);
      return { __html: html };
    } catch (error) {
      console.error('Markdown parsing error:', error);
      // Fallback to simple formatting
      return { __html: text.replace(/\n/g, '<br>') };
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hide chatbot on login and signup pages
  const hiddenPaths = ['/login', '/sign-up'];
  const shouldHide = hiddenPaths.includes(pathname);

  if (shouldHide) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue.trim();
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call Qwen API with medical context and extra prediction details if present
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversation_history: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          context: {
            app_type: 'medical_image_analysis',
            current_page: pathname,
            specialization: 'dermatology_ai_assistant',
            ...(extraContext ? { predictionDetails: extraContext } : {})
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }

      const data = await response.json();
      let botText = data.response;
      // Only append disclaimer if context-aware (prediction explanation) AND this is the first user message after context is set
      let showDisclaimer = false;
      if (extraContext && extraContext.predictionDetails) {
        // Check if this is the first user message after context is set
        if (messages.length > 0 && messages[messages.length - 1].sender !== 'user') {
          showDisclaimer = true;
        }
      }
      if (showDisclaimer) {
        botText += '\n\n---\n_Disclaimer: This is not medical advice. For urgent concerns, consult a healthcare professional._';
        // Clear extraContext so follow-up questions don't get disclaimer
        setExtraContext(null);
      }
      const botMessage = {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        timestamp: data.timestamp || new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorText = "I'm experiencing technical difficulties. ";
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorText += "Please check your internet connection and try again. ";
      } else {
        errorText += "Please try again in a moment. ";
      }
      
      errorText += "For urgent medical concerns, contact your healthcare provider directly. 🏥";
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  // Quick action buttons for common medical queries
  const quickActions = [
    { text: "🔍 Better photo tips", query: "How can I take better quality photos of skin lesions for more accurate analysis? What lighting and positioning should I use?" },
    { text: "📊 Confidence scores", query: "What do the confidence scores in my analysis results mean? How should I interpret different percentage levels?" },
    { text: "⚠️ When to see a doctor", query: "When should I see a dermatologist after getting my analysis results? What warning signs should I look for?" },
    { text: "🎯 Lesion types", query: "Can you explain the different types of skin lesions your AI can detect? What's the difference between melanoma, basal cell carcinoma, and benign moles?" }
  ];

  const handleQuickAction = (query) => {
    setInputValue(query);
    // Auto-send the quick action
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className={styles.chatbotContainer}>
      {/* Chat Window */}
      <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderContent}>
            <div className={styles.chatHeaderIcon}>🔬</div>
            <h3>Medical AI Assistant</h3>
          </div>
          <button 
            className={styles.closeButton} 
            onClick={toggleChatbot}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>
        
        <div className={styles.messagesContainer}>
          {/* Quick Actions - only show when no messages beyond welcome */}
          {messages.length === 1 && (
            <div className={styles.quickActionsWrapper}>
              <div className={styles.quickActionsTitle}>
                ⚡ Quick Help
              </div>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.query)}
                  className={styles.quickActionItem}
                >
                  {action.text}
                </button>
              ))}
            </div>
          )}
          
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`${styles.message} ${styles[message.sender]}`}
            >
              <div className={styles.messageContent}>
                {message.sender === 'bot' ? (
                  <div dangerouslySetInnerHTML={renderMarkdown(message.text)} />
                ) : (
                  message.text
                )}
              </div>
              <div className={styles.messageTime}>
                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.bot}`}>
              <div className={styles.messageContent}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className={styles.inputContainer}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about skin lesions, analysis results, or medical terms..."
            className={styles.messageInput}
            rows="2"
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            className={styles.sendButton}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m22 2-7 20-4-9-9-4z"/>
              <path d="M22 2 11 13"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button 
        className={`${styles.floatingButton} ${isOpen ? styles.hidden : ''}`}
        onClick={toggleChatbot}
        aria-label="Open chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>
  );
};

export default FloatingChatbot;
