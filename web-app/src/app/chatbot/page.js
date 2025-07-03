"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../utils/auth";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "Hello! I'm your AI healthcare assistant. I can help explain skin conditions, provide general health information, and answer questions about your skin analysis results. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [predictionContext, setPredictionContext] = useState(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Check for prediction context from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('context') === 'prediction') {
      const predContext = {
        id: urlParams.get('id'),
        type: urlParams.get('type'),
        confidence: urlParams.get('confidence')
      };
      setPredictionContext(predContext);
      
      // Add context-specific welcome message
      const contextMessage = {
        type: "bot",
        content: `I see you've just received an analysis result showing "${predContext.type}" with ${predContext.confidence}% confidence. I'm here to help explain what this means and answer any questions you might have about skin health. What would you like to know?`,
        timestamp: new Date()
      };
      setMessages(prev => [prev[0], contextMessage]);
    }

    // Load user context (recent predictions, etc.)
    loadUserContext();
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadUserContext = async () => {
    try {
      const recentPredictions = await auth.getUserPredictions();
      const latestPrediction = recentPredictions?.[0];
      setUserContext({
        hasRecentPredictions: recentPredictions?.length > 0,
        latestPrediction: latestPrediction,
        totalPredictions: recentPredictions?.length || 0
      });
    } catch (error) {
      console.error("Error loading user context:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await getAIResponse(inputMessage, userContext);
      
      const botMessage = {
        type: "bot",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        type: "bot",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later or consult with a healthcare professional for urgent concerns.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAIResponse = async (userInput, context) => {
    // Construct context-aware prompt
    let systemPrompt = `You are a helpful AI healthcare assistant specializing in dermatology and skin health. 
    
    Guidelines:
    - Provide educational information about skin conditions
    - Explain medical terms in simple language
    - Always recommend consulting healthcare professionals for diagnosis
    - Never provide specific medical diagnosis or treatment advice
    - Be empathetic and supportive
    
    User Context:`;

    if (context?.hasRecentPredictions) {
      systemPrompt += `
    - User has ${context.totalPredictions} skin analysis(es) in their history
    - Most recent analysis: ${context.latestPrediction?.predicted_class || 'N/A'} (${context.latestPrediction?.confidence || 'N/A'}% confidence)
    - You can reference their analysis results when relevant`;
    } else {
      systemPrompt += `
    - User hasn't performed any skin analyses yet
    - You can suggest they try the skin analysis feature for personalized insights`;
    }

    // Add specific prediction context if available
    if (predictionContext) {
      systemPrompt += `
    
    CURRENT DISCUSSION CONTEXT:
    - User just received a prediction: ${predictionContext.type}
    - Confidence level: ${predictionContext.confidence}%
    - User may want explanation about this specific result
    - Focus on educational information about this condition
    - Provide reassurance and next steps appropriate for this result`;
    }

    const fullPrompt = `${systemPrompt}

    User Question: ${userInput}
    
    Please provide a helpful, educational response.`;

    // Call your AI service (adapt this to your backend)
    const response = await fetch('/api/healthcare-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.getToken()}`
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        userContext: context
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return data.response || "I'm sorry, I couldn't process that request right now.";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    "What does my recent skin analysis result mean?",
    "How can I protect my skin from sun damage?",
    "What are the warning signs of skin cancer?",
    "Tell me about different types of moles",
    "How often should I check my skin?"
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--primary-gradient)",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "20px",
        overflow: "hidden",
        height: "calc(100vh - 40px)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px",
          textAlign: "center"
        }}>
          <h1 style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "700"
          }}>
            🩺 AI Healthcare Assistant
          </h1>
          <p style={{
            margin: "8px 0 0 0",
            fontSize: "14px",
            opacity: 0.9
          }}>
            Get personalized skin health guidance and explanations
          </p>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {messages.map((message, index) => (
            <div key={index} style={{
              display: "flex",
              justifyContent: message.type === "user" ? "flex-end" : "flex-start"
            }}>
              <div style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: "16px",
                background: message.type === "user" 
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "#f3f4f6",
                color: message.type === "user" ? "white" : "#374151",
                fontSize: "14px",
                lineHeight: "1.5"
              }}>
                <div>{message.content}</div>
                <div style={{
                  fontSize: "11px",
                  marginTop: "4px",
                  opacity: 0.7
                }}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{
              display: "flex",
              justifyContent: "flex-start"
            }}>
              <div style={{
                padding: "12px 16px",
                borderRadius: "16px",
                background: "#f3f4f6",
                color: "#374151",
                fontSize: "14px"
              }}>
                <div>AI is thinking...</div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div style={{
            padding: "0 20px",
            borderTop: "1px solid #e5e7eb"
          }}>
            <p style={{
              margin: "16px 0 8px 0",
              fontSize: "14px",
              fontWeight: "600",
              color: "#6b7280"
            }}>
              💡 Try asking:
            </p>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px"
            }}>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    border: "1px solid #d1d5db",
                    background: "white",
                    color: "#374151",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "white";
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div style={{
          padding: "20px",
          borderTop: "1px solid #e5e7eb",
          background: "white"
        }}>
          <div style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end"
          }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about skin health, conditions, or your analysis results..."
              style={{
                flex: 1,
                minHeight: "20px",
                maxHeight: "100px",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                fontSize: "14px",
                resize: "none",
                fontFamily: "inherit"
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                padding: "12px 20px",
                background: inputMessage.trim() && !isLoading 
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "#d1d5db",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: inputMessage.trim() && !isLoading ? "pointer" : "not-allowed",
                transition: "all 0.2s"
              }}
            >
              Send
            </button>
          </div>
          <div style={{
            fontSize: "11px",
            color: "#6b7280",
            marginTop: "8px",
            textAlign: "center"
          }}>
            ⚠️ This AI provides educational information only. Always consult healthcare professionals for medical advice.
          </div>
        </div>
      </div>
    </div>
  );
}