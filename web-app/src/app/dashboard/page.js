"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../utils/auth";

import ThemeToggle from "../components/ThemeToggle";
import FeedbackButton from "../components/FeedbackButton";
import ProactivePromptToast from "../components/ProactivePromptToast";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [error, setError] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [showProactiveToast, setShowProactiveToast] = useState(false);
  const [proactiveToastPrediction, setProactiveToastPrediction] = useState(null);
  const router = useRouter();
  const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    try {
      // Check authentication
      if (!auth.isAuthenticated()) {
        router.push("/login");
        return;
      }

      // Get user data
      const userData = auth.getCurrentUser();
      setUser(userData);
      setLoading(false);
      
      // Trigger entrance animation
      setTimeout(() => setIsVisible(true), 100);
    } catch (error) {
      console.error("Error in dashboard useEffect:", error);
      setError(error.message);
      setLoading(false);
      // Don't redirect on error, let user try to access dashboard
    }
  }, [router]);

  // Fetch recent predictions when user data is available
  useEffect(() => {
    const fetchRecentPredictions = async () => {
      if (!user?.userId) {
        console.log("Dashboard: No user ID available, skipping predictions fetch");
        return;
      }
      
      console.log("Dashboard: Fetching predictions for user:", user.userId);
      setLoadingPredictions(true);
      try {
        const response = await fetch(`${nodeApiBase}/get-user-predictions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.userId }),
        });

        console.log("Dashboard: API response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Dashboard: Received predictions data:", data);
          // Get the 5 most recent predictions
          const recentPredictions = data.predictions.slice(0, 5);
          console.log("Dashboard: Setting recent predictions:", recentPredictions);
          setRecentPredictions(recentPredictions);
        } else {
          console.error("Dashboard: Failed to fetch predictions, status:", response.status);
          const errorText = await response.text();
          console.error("Dashboard: Error response:", errorText);
          setRecentPredictions([]);
        }
      } catch (error) {
        console.error("Dashboard: Error fetching predictions:", error);
        setRecentPredictions([]);
      } finally {
        setLoadingPredictions(false);
        console.log("Dashboard: Finished loading predictions");
      }
    };

    if (user?.userId) {
      fetchRecentPredictions();
    }
  }, [user, nodeApiBase]);

  const handleLogout = () => {
    try {
      auth.logout();
    } catch (error) {
      console.error("Error during logout:", error);
      // Force logout by clearing localStorage and redirecting
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  };

  // Show proactive toast when a new prediction appears, using localStorage for persistence
  useEffect(() => {
    if (recentPredictions.length > 0) {
      const latest = recentPredictions[0];
      const storedPromptedId = typeof window !== 'undefined' ? localStorage.getItem('lastPromptedPredictionId') : null;
      if (latest.prediction_id && latest.prediction_id !== storedPromptedId) {
        setProactiveToastPrediction(latest);
        setShowProactiveToast(true);
        if (latest.prediction_id) {
          localStorage.setItem('lastPromptedPredictionId', latest.prediction_id);
        }
      }
    }
  }, [recentPredictions]);

  // Handler for accepting the proactive prompt
  const handleProactiveAccept = () => {
    if (proactiveToastPrediction) {
      // Build a simple, user-friendly question
      const question = "Can you explain my latest skin analysis result?";
      // Build rich context for the API (not shown to user)
      const confidence = typeof proactiveToastPrediction.confidence_score === 'number'
        ? proactiveToastPrediction.confidence_score.toFixed(2)
        : (proactiveToastPrediction.confidence_scores?.confidence_scores
          ? Math.max(...Object.values(proactiveToastPrediction.confidence_scores.confidence_scores).map(v => parseFloat(v)).filter(v => !isNaN(v))).toFixed(2)
          : 'N/A');
      const date = proactiveToastPrediction.upload_timestamp
        ? new Date(proactiveToastPrediction.upload_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Unknown';
      const filename = proactiveToastPrediction.filename || 'Unknown';
      const imageQuality = proactiveToastPrediction.image_quality || proactiveToastPrediction?.additional_metrics?.image_quality || undefined;
      const modelVersion = proactiveToastPrediction.model_version || undefined;
      let extraMetrics = undefined;
      if (proactiveToastPrediction.additional_metrics) {
        extraMetrics = Object.entries(proactiveToastPrediction.additional_metrics)
          .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
          .join('; ');
      }
      const predictionDetails = {
        lesion_type: proactiveToastPrediction.predicted_class,
        confidence,
        date,
        filename,
        ...(imageQuality ? { image_quality: imageQuality } : {}),
        ...(modelVersion ? { model_version: modelVersion } : {}),
        ...(extraMetrics ? { additional_metrics: extraMetrics } : {}),
      };
      window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { question, predictionDetails } }));
    }
    setShowProactiveToast(false);
  };

  // Handler for dismissing the proactive prompt
  const handleProactiveDismiss = () => {
    setShowProactiveToast(false);
    if (proactiveToastPrediction?.prediction_id && typeof window !== 'undefined') {
      localStorage.setItem('lastPromptedPredictionId', proactiveToastPrediction.prediction_id);
    }
  };

  // Error state
  if (error) {
    return (
      <div style={{ 
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--primary-gradient)",
      }}>
        <div
          style={{
            background: "var(--card-background)",
            padding: "40px",
            borderRadius: 20,
            boxShadow: "var(--shadow-lg)",
            backdropFilter: "blur(20px)",
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: "var(--error-color)", marginBottom: 16 }}>Dashboard Error</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            There was an error loading the dashboard: {error}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              background: "var(--info-color)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--primary-gradient)",
      }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "var(--card-background)",
            padding: "30px 50px",
            borderRadius: 20,
            boxShadow: "var(--shadow-lg)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--card-border)",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              border: "3px solid var(--info-color)",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ fontSize: 18, color: "var(--text-primary)", fontWeight: 600 }}>
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .pulse {
          animation: pulse 2s infinite;
        }
        
        .float {
          animation: float 3s ease-in-out infinite;
        }
        
        .hover-lift {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
        }
        
        .scale-on-hover {
          transition: transform 0.3s ease;
        }
        
        .scale-on-hover:hover {
          transform: scale(1.05);
        }
        
        .glass-card {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
        }
        
        .gradient-text {
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: var(--shadow-lg);
        }
        
        .interactive-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .interactive-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        /* Custom scrollbar for horizontal scroll */
        .horizontal-scroll::-webkit-scrollbar {
          height: 8px;
        }
        
        .horizontal-scroll::-webkit-scrollbar-track {
          background: var(--hover-background);
          border-radius: 10px;
        }
        
        .horizontal-scroll::-webkit-scrollbar-thumb {
          background: var(--info-color);
          border-radius: 10px;
          box-shadow: var(--shadow-sm);
        }
        
        .horizontal-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #1d4ed8, #2563eb);
        }
        
        /* Prediction card animations */
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .prediction-card {
          animation: slideInRight 0.6s ease-out;
        }
        
        .prediction-card:nth-child(2) {
          animation-delay: 0.1s;
        }
        
        .prediction-card:nth-child(3) {
          animation-delay: 0.2s;
        }
        
        .prediction-card:nth-child(4) {
          animation-delay: 0.3s;
        }
        
        .prediction-card:nth-child(5) {
          animation-delay: 0.4s;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--primary-gradient)",
          fontFamily: "var(--font-geist-sans, sans-serif)",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <header
          className="glass-card"
          style={{
            background: "var(--card-background)",
            backdropFilter: "blur(20px)",
            boxShadow: "var(--shadow-lg)",
            padding: "24px 0",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                className="gradient-text"
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                Welcome, {user?.username}! 👋
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 16, margin: 0 }}>
                Ready to analyze medical images with AI
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <ThemeToggle />
              <button
                onClick={() => router.push("/settings")}
                className="interactive-button"
                style={{
                  background: "var(--card-background)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  padding: "12px 20px",
                  borderRadius: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  backdropFilter: "blur(20px)",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "var(--hover-background)";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "var(--card-background)";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <span style={{ fontSize: "16px" }}>⚙️</span>
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="interactive-button"
                style={{
                  background: "var(--card-background)",
                  color: "var(--error-color)",
                  border: "1px solid var(--error-color)",
                  padding: "12px 20px",
                  borderRadius: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  backdropFilter: "blur(20px)",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "var(--error-color)";
                  e.target.style.color = "white";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "var(--card-background)";
                  e.target.style.color = "var(--error-color)";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <span style={{ fontSize: "16px" }}>🚪</span>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
          {/* Quick Actions */}
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "white",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              ✨ Quick Actions
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 24,
              }}
            >
              {/* Upload Image Card */}
              <Link
                href="/upload-image"
                className="card-hover"
                style={{
                  textDecoration: "none",
                  background: "var(--card-background)",
                  borderRadius: 20,
                  padding: 32,
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--card-border)",
                  backdropFilter: "blur(20px)",
                  display: "block",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setHoveredCard('upload')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: hoveredCard === 'upload' 
                      ? "var(--hover-background)"
                      : "transparent",
                    transition: "all 0.3s ease",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: hoveredCard === 'upload' 
                        ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
                        : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                      boxShadow: hoveredCard === 'upload' 
                        ? "var(--shadow-lg)"
                        : "var(--shadow-md)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <span style={{ fontSize: 28, color: "white" }}>📤</span>
                  </div>
                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 12,
                    }}
                  >
                    Upload & Analyze Image
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.6 }}>
                    Upload a skin lesion image for AI-powered analysis and get instant results with confidence scores.
                  </p>
                </div>
              </Link>

              {/* View History Card */}
              <Link
                href="/image-history"
                className="card-hover"
                style={{
                  textDecoration: "none",
                  background: "var(--card-background)",
                  borderRadius: 20,
                  padding: 32,
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--card-border)",
                  backdropFilter: "blur(20px)",
                  display: "block",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setHoveredCard('history')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: hoveredCard === 'history' 
                      ? "var(--hover-background)"
                      : "transparent",
                    transition: "all 0.3s ease",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: hoveredCard === 'history' 
                        ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                        : "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                      boxShadow: hoveredCard === 'history' 
                        ? "var(--shadow-lg)"
                        : "var(--shadow-md)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <span style={{ fontSize: 28, color: "white" }}>📊</span>
                  </div>
                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 12,
                    }}
                  >
                    View Analysis History
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.6 }}>
                    Review your previous image analyses, compare results, and track patterns over time.
                  </p>
                </div>
              </Link>

              {/* Settings Card */}
              <Link
                href="/settings"
                className="card-hover"
                style={{
                  textDecoration: "none",
                  background: "var(--card-background)",
                  borderRadius: 20,
                  padding: 32,
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--card-border)",
                  backdropFilter: "blur(20px)",
                  display: "block",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setHoveredCard('settings')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: hoveredCard === 'settings' 
                      ? "var(--hover-background)"
                      : "transparent",
                    transition: "all 0.3s ease",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: hoveredCard === 'settings' 
                        ? "linear-gradient(135deg, #9333ea 0%, #a855f7 100%)"
                        : "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                      boxShadow: hoveredCard === 'settings' 
                        ? "var(--shadow-lg)"
                        : "var(--shadow-md)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <span style={{ fontSize: 28, color: "white" }}>⚙️</span>
                  </div>
                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 12,
                    }}
                  >
                    Account Settings
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.6 }}>
                    Manage your profile, preferences, and account security settings.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "white",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              📈 Recent Activity
            </h2>
            <div
              className="glass-card hover-lift"
              style={{
                background: "var(--card-background)",
                borderRadius: 20,
                padding: 40,
                boxShadow: "var(--shadow-lg)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--card-border)",
              }}
            >
              {loadingPredictions ? (
                // Loading state
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid var(--border-color)",
                    borderTop: "4px solid var(--info-color)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 20px"
                  }}></div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
                    Loading recent activity...
                  </p>
                  {/* Debug info */}
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>
                    User ID: {user?.userId || "No user ID"}
                  </div>
                </div>
              ) : recentPredictions.length === 0 ? (
                // No predictions state
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 48,
                      marginBottom: 16,
                      opacity: 0.7,
                    }}
                  >
                    📊
                  </div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 12,
                    }}
                  >
                    No recent activity yet
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 24 }}>
                    Start by uploading your first image for analysis!
                  </p>
                  <Link
                    href="/upload-image"
                    className="interactive-button"
                    style={{
                      display: "inline-block",
                      background: "var(--info-color)",
                      color: "white",
                      textDecoration: "none",
                      padding: "16px 32px",
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: 16,
                      boxShadow: "var(--shadow-sm)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    🚀 Get Started
                  </Link>
                </div>
              ) : (
                // Has predictions state - Horizontally scrollable prediction cards
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                  }}>
                    <h3
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      🔬 Recent Predictions
                    </h3>
                    <div style={{
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                      background: "var(--hover-background)",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}>
                      {recentPredictions.length} recent {recentPredictions.length === 1 ? 'analysis' : 'analyses'}
                      {recentPredictions.length > 3 && (
                        <span style={{ fontSize: "12px", opacity: 0.7 }}>→ Scroll</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Horizontally scrollable prediction cards */}
                  <div 
                    className="horizontal-scroll"
                    style={{
                    display: "flex",
                    gap: "20px",
                    overflowX: "auto",
                    overflowY: "hidden",
                    paddingBottom: "16px",
                    scrollBehavior: "smooth",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--text-muted) transparent",
                  }}>
                    {recentPredictions.map((prediction, index) => (
                      <div
                        key={prediction.prediction_id}
                        className="scale-on-hover prediction-card"
                        style={{
                          minWidth: "320px",
                          maxWidth: "320px",
                          background: "var(--card-background)",
                          borderRadius: "20px",
                          padding: "24px",
                          border: "1px solid var(--card-border)",
                          boxShadow: "var(--shadow-md)",
                          backdrop: "blur(20px)",
                          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                          e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                          e.currentTarget.style.background = "var(--hover-background)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0) scale(1)";
                          e.currentTarget.style.boxShadow = "var(--shadow-md)";
                          e.currentTarget.style.background = "var(--card-background)";
                        }}
                      >
                        {/* Status indicator */}
                        <div style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: prediction.predicted_class.toLowerCase().includes('benign') || prediction.predicted_class.toLowerCase().includes('nevus') 
                            ? "linear-gradient(135deg, #10b981, #34d399)" 
                            : "linear-gradient(135deg, #ef4444, #f87171)",
                          boxShadow: prediction.predicted_class.toLowerCase().includes('benign') || prediction.predicted_class.toLowerCase().includes('nevus') 
                            ? "0 0 12px var(--success-color)" 
                            : "0 0 12px var(--error-color)",
                        }}></div>

                        {/* Image section */}
                        <div style={{
                          width: "100%",
                          height: "160px",
                          borderRadius: "16px",
                          overflow: "hidden",
                          marginBottom: "16px",
                          background: "var(--hover-background)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}> 
                          {prediction.image_uri ? (
                            <>
                              <Image
                                src={prediction.image_uri}
                                alt={prediction.filename}
                                width={320}
                                height={160}
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div style={{
                                display: "none",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "48px",
                                color: "var(--text-muted)",
                                width: "100%",
                                height: "100%",
                              }}>
                                🖼️
                              </div>
                            </>
                          ) : (
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "48px",
                              color: "var(--text-muted)",
                              width: "100%",
                              height: "100%",
                            }}>
                              🖼️
                            </div>
                          )}
                          
                          {/* Gradient overlay */}
                          <div style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "40px",
                            background: "linear-gradient(to top, var(--shadow-sm) 0%, transparent 100%)",
                          }}></div>
                        </div>

                        {/* Prediction result section */}
                        <div style={{
                          marginBottom: "16px",
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                          }}>
                            <span style={{
                              fontSize: "20px",
                            }}>
                              {prediction.predicted_class.toLowerCase().includes('benign') || prediction.predicted_class.toLowerCase().includes('nevus') ? "✅" : "⚠️"}
                            </span>
                            <h4 style={{
                              fontSize: "16px",
                              fontWeight: "700",
                              color: "var(--text-primary)",
                              margin: 0,
                              flex: 1,
                              lineHeight: "1.2",
                            }}>
                              {prediction.confidence_scores?.lesion_type || prediction.predicted_class}
                            </h4>
                          </div>
                          
                          {/* Confidence meter */}
                          <div style={{
                            marginBottom: "8px",
                          }}>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "4px",
                            }}>
                              <span style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "var(--text-secondary)",
                              }}>
                                Confidence
                              </span>
                              <span style={{
                                fontSize: "14px",
                                fontWeight: "700",
                                color: prediction.predicted_class.toLowerCase().includes('benign') || prediction.predicted_class.toLowerCase().includes('nevus') ? "#059669" : "#dc2626",
                              }}>
                                {(() => {
                                  if (typeof prediction.confidence_score === 'number') {
                                    return prediction.confidence_score.toFixed(2);
                                  } else if (
                                    prediction.confidence_scores &&
                                    typeof prediction.confidence_scores === 'object' &&
                                    prediction.confidence_scores.confidence_scores &&
                                    typeof prediction.confidence_scores.confidence_scores === 'object'
                                  ) {
                                    // Extract the highest numeric value from confidence_scores.confidence_scores
                                    const vals = Object.values(prediction.confidence_scores.confidence_scores)
                                      .map(v => parseFloat(v))
                                      .filter(v => !isNaN(v));
                                    if (vals.length > 0) return Math.max(...vals).toFixed(2);
                                  }
                                  return '0.00';
                                })()}%
                              </span>
                            </div>
                            <div style={{
                              width: "100%",
                              height: "6px",
                              background: "var(--hover-background)",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}>
                              <div style={{
                                width: `${(() => {
                                  if (typeof prediction.confidence_score === 'number') {
                                    return prediction.confidence_score * 100;
                                  } else if (
                                    prediction.confidence_scores &&
                                    typeof prediction.confidence_scores === 'object' &&
                                    prediction.confidence_scores.confidence_scores &&
                                    typeof prediction.confidence_scores.confidence_scores === 'object'
                                  ) {
                                    const vals = Object.values(prediction.confidence_scores.confidence_scores)
                                      .map(v => parseFloat(v))
                                      .filter(v => !isNaN(v));
                                    if (vals.length > 0) return Math.max(...vals) * 100;
                                  }
                                  return 0;
                                })()}%`,
                                height: "100%",
                                background: prediction.predicted_class.toLowerCase().includes('benign') || prediction.predicted_class.toLowerCase().includes('nevus') 
                                  ? "var(--success-color)" 
                                  : "var(--error-color)",
                                borderRadius: "3px",
                                transition: "width 0.8s ease-out",
                              }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Metadata section */}
                        <div style={{
                          padding: "12px",
                          background: "var(--hover-background)",
                          borderRadius: "12px",
                          marginBottom: "16px",
                        }}>
                          <div style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            marginBottom: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}>
                            <span>📅</span>
                            {new Date(prediction.upload_timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}>
                            <span>📄</span>
                            {prediction.filename}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{
                          display: "flex",
                          gap: "8px",
                        }}>
                          <Link
                            href={`/image-detail?image_id=${prediction.image_id}`}
                            className="interactive-button"
                            style={{
                              flex: 1,
                              background: "var(--info-color)",
                              color: "white",
                              textDecoration: "none",
                              padding: "10px 16px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              fontWeight: "600",
                              textAlign: "center",
                              boxShadow: "var(--shadow-sm)",
                              transition: "all 0.3s ease",
                            }}
                          >
                            📊 View Details
                          </Link>
                          <button
                            className="interactive-button"
                            style={{
                              flex: 1,
                              background: "var(--success-color)",
                              color: "white",
                              textDecoration: "none",
                              padding: "10px 16px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              fontWeight: "600",
                              textAlign: "center",
                              boxShadow: "var(--shadow-sm)",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                            }}
                            title="Ask AI to explain this result"
                            onClick={() => {
                              // Build a simple, user-friendly question
                              const question = "Can you explain my latest skin analysis result?";
                              // Build rich context for the API (not shown to user)
                              const confidence = typeof prediction.confidence_score === 'number'
                                ? prediction.confidence_score.toFixed(2)
                                : (prediction.confidence_scores?.confidence_scores
                                  ? Math.max(...Object.values(prediction.confidence_scores.confidence_scores).map(v => parseFloat(v)).filter(v => !isNaN(v))).toFixed(2)
                                  : 'N/A');
                              const date = prediction.upload_timestamp
                                ? new Date(prediction.upload_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Unknown';
                              const filename = prediction.filename || 'Unknown';
                              const imageQuality = prediction.image_quality || prediction?.additional_metrics?.image_quality || undefined;
                              const modelVersion = prediction.model_version || undefined;
                              let extraMetrics = undefined;
                              if (prediction.additional_metrics) {
                                extraMetrics = Object.entries(prediction.additional_metrics)
                                  .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                                  .join('; ');
                              }
                              const predictionDetails = {
                                lesion_type: prediction.predicted_class,
                                confidence,
                                date,
                                filename,
                                ...(imageQuality ? { image_quality: imageQuality } : {}),
                                ...(modelVersion ? { model_version: modelVersion } : {}),
                                ...(extraMetrics ? { additional_metrics: extraMetrics } : {}),
                              };
                              window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { question, predictionDetails } }));
                            }}
                          >
                            💬 Ask AI to explain
                          </button>
                          {prediction.gradcam_uri && (
                            <div
                              style={{
                                background: "var(--warning-color)",
                                color: "white",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                boxShadow: "var(--shadow-sm)",
                                transition: "all 0.3s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Has Grad-CAM visualization"
                            >
                              🔍
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* View all link */}
                  <div style={{
                    textAlign: "center",
                    marginTop: "32px",
                    paddingTop: "24px",
                    borderTop: "1px solid var(--border-color)",
                  }}>
                    <Link
                      href="/image-history"
                      className="interactive-button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "var(--info-color)",
                        color: "white",
                        textDecoration: "none",
                        padding: "16px 32px",
                        borderRadius: 16,
                        fontWeight: 600,
                        fontSize: 16,
                        boxShadow: "var(--shadow-sm)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      📊 View Complete History
                      <span style={{
                        fontSize: "12px",
                        opacity: 0.8,
                        background: "var(--hover-background)",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        color: "var(--text-secondary)",
                      }}>
                        All {recentPredictions.length}+ analyses
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Proactive Prompt Toast - Explaining Latest Prediction */}
        {showProactiveToast && proactiveToastPrediction && (
          <ProactivePromptToast
            prediction={proactiveToastPrediction}
            onAccept={handleProactiveAccept}
            onDismiss={handleProactiveDismiss}
          />
        )}
      </div>
      {/* Proactive AI prompt toast */}
      <ProactivePromptToast
        visible={showProactiveToast}
        onAccept={handleProactiveAccept}
        onDismiss={handleProactiveDismiss}
        prediction={proactiveToastPrediction}
      />
      {/* Feedback floating button */}
      <FeedbackButton feature="dashboard" position="bottom-left" style={{ bottom: 20, left: 20, position: 'fixed', zIndex: 1001 }} />
    </>
  );
}

// Export the component
export default Dashboard;
