"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "./utils/auth";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        if (auth.isAuthenticated()) {
          // If authenticated, redirect to dashboard
          router.push("/dashboard");
        } else {
          // Show welcome screen for unauthenticated users
          setIsChecking(false);
          setTimeout(() => setShowWelcome(true), 200);
        }
      } catch (error) {
        setIsChecking(false);
        setTimeout(() => setShowWelcome(true), 200);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.95)",
          padding: "30px 50px",
          borderRadius: "20px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
          backdropFilter: "blur(20px)",
          textAlign: "center"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid #e2e8f0",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <p style={{ color: "#374151", fontSize: "18px", fontWeight: "600" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

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
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .float {
          animation: float 4s ease-in-out infinite;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .interactive-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .interactive-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
        }
        
        .feature-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "var(--font-geist-sans, sans-serif)",
        opacity: showWelcome ? 1 : 0,
        transform: showWelcome ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Hero Section */}
        <div style={{
          padding: "60px 20px",
          textAlign: "center",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <div className="fade-in-up" style={{ marginBottom: "40px" }}>
            <div className="float" style={{
              fontSize: "80px",
              marginBottom: "20px"
            }}>
              🏥
            </div>
            <h1 style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: "800",
              background: "linear-gradient(90deg, #ffffff, #e0e7ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "20px",
              lineHeight: "1.2"
            }}>
              Medical Image Analysis Platform
            </h1>
            <p style={{
              fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
              color: "rgba(255,255,255,0.9)",
              maxWidth: "600px",
              margin: "0 auto 40px",
              lineHeight: "1.6"
            }}>
              Advanced AI-powered skin lesion analysis for early detection and accurate diagnosis
            </p>
            
            <div style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              <Link
                href="/login"
                className="interactive-button"
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                  color: "white",
                  textDecoration: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontSize: "18px",
                  boxShadow: "0 8px 25px rgba(37, 99, 235, 0.3)",
                }}
              >
                🚀 Get Started
              </Link>
              
              <Link
                href="/about"
                className="interactive-button"
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  textDecoration: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontSize: "18px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                📖 Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{
          padding: "40px 20px",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <h2 style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            color: "white",
            textAlign: "center",
            marginBottom: "50px"
          }}>
            ✨ Key Features
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px"
          }}>
            <div className="feature-card glass-card" style={{
              padding: "30px",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "50px", marginBottom: "20px" }}>🤖</div>
              <h3 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "15px"
              }}>
                AI-Powered Analysis
              </h3>
              <p style={{
                color: "#6b7280",
                lineHeight: "1.6",
                fontSize: "16px"
              }}>
                Advanced machine learning algorithms for accurate skin lesion classification and risk assessment
              </p>
            </div>

            <div className="feature-card glass-card" style={{
              padding: "30px",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "50px", marginBottom: "20px" }}>⚡</div>
              <h3 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "15px"
              }}>
                Instant Results
              </h3>
              <p style={{
                color: "#6b7280",
                lineHeight: "1.6",
                fontSize: "16px"
              }}>
                Get comprehensive analysis results in seconds with detailed confidence scores and recommendations
              </p>
            </div>

            <div className="feature-card glass-card" style={{
              padding: "30px",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "50px", marginBottom: "20px" }}>📊</div>
              <h3 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "15px"
              }}>
                Detailed Reports
              </h3>
              <p style={{
                color: "#6b7280",
                lineHeight: "1.6",
                fontSize: "16px"
              }}>
                Access comprehensive analysis history with visual comparisons and trend tracking
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{
          padding: "60px 20px",
          textAlign: "center"
        }}>
          <div className="glass-card" style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "20px"
            }}>
              Ready to get started?
            </h2>
            <p style={{
              color: "#6b7280",
              fontSize: "18px",
              marginBottom: "30px",
              lineHeight: "1.6"
            }}>
              Join healthcare professionals using our platform for accurate medical image analysis
            </p>
            <Link
              href="/sign-up"
              className="interactive-button"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #10b981, #34d399)",
                color: "white",
                textDecoration: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "18px",
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
              }}
            >
              🎯 Create Account
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
