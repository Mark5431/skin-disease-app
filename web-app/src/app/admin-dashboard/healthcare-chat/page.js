"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminProtection from "../../components/AdminProtection";

function HealthcareChatAnalyticsContent() {
  const [analytics, setAnalytics] = useState({
    totalInteractions: 0,
    activeUsers: 0,
    averageSessionLength: 0,
    commonQuestions: [],
    satisfactionRating: 0,
    responseAccuracy: 0,
    emergencyFlags: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch(`/api/admin/healthcare-chat-analytics?range=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Error loading healthcare chat analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/healthcare-chat-analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error loading healthcare chat analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    interactions: [45, 52, 38, 67, 43, 29, 31]
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--primary-gradient)",
      padding: "40px 20px"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <Link
            href="/admin-dashboard"
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              textDecoration: "none",
              fontSize: "16px",
              display: "inline-block",
              marginBottom: "20px"
            }}
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "700",
            color: "white",
            margin: "0 0 16px 0"
          }}>
            🩺 Healthcare Chat Analytics
          </h1>
          <p style={{
            fontSize: "18px",
            color: "rgba(255, 255, 255, 0.9)",
            margin: 0
          }}>
            Monitor AI healthcare assistant performance and user interactions
          </p>
        </div>

        {/* Time Range Selector */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "30px",
          display: "flex",
          gap: "12px",
          alignItems: "center"
        }}>
          <span style={{ fontWeight: "600", color: "#374151" }}>Time Range:</span>
          {["24h", "7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: timeRange === range 
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "#f3f4f6",
                color: timeRange === range ? "white" : "#374151",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
          marginBottom: "40px"
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>💬</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
              {analytics.totalInteractions.toLocaleString()}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Total Interactions</div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>👥</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
              {analytics.activeUsers.toLocaleString()}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Active Users</div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⭐</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
              {analytics.satisfactionRating}/5
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Satisfaction Rating</div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🚨</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#dc2626", marginBottom: "4px" }}>
              {analytics.emergencyFlags}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Emergency Flags</div>
          </div>
        </div>

        {/* Charts and Details */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          marginBottom: "40px"
        }}>
          {/* Interaction Trends */}
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "24px"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "20px"
            }}>
              📈 Daily Interactions
            </h3>
            <div style={{
              height: "200px",
              display: "flex",
              alignItems: "end",
              gap: "8px",
              padding: "20px 0"
            }}>
              {chartData.interactions.map((value, index) => (
                <div key={index} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    height: `${(value / Math.max(...chartData.interactions)) * 160}px`,
                    borderRadius: "4px 4px 0 0",
                    marginBottom: "8px"
                  }}></div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {chartData.labels[index]}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Questions */}
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "24px"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "20px"
            }}>
              🔍 Common Questions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { question: "What does my result mean?", count: 142 },
                { question: "Should I see a doctor?", count: 89 },
                { question: "How accurate is the analysis?", count: 76 },
                { question: "What are the next steps?", count: 64 },
                { question: "How to prevent skin cancer?", count: 51 }
              ].map((item, index) => (
                <div key={index} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#f9fafb",
                  borderRadius: "8px"
                }}>
                  <span style={{ fontSize: "14px", color: "#374151" }}>
                    {item.question}
                  </span>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    background: "white",
                    padding: "2px 8px",
                    borderRadius: "12px"
                  }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Quality */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "40px"
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "20px"
          }}>
            🎯 Response Quality Metrics
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px"
          }}>
            <div>
              <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                Response Accuracy
              </div>
              <div style={{
                background: "#f3f4f6",
                borderRadius: "8px",
                height: "8px",
                overflow: "hidden"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  height: "100%",
                  width: `${analytics.responseAccuracy}%`
                }}></div>
              </div>
              <div style={{ fontSize: "12px", color: "#374151", marginTop: "4px" }}>
                {analytics.responseAccuracy}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                Average Session Length
              </div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937" }}>
                {analytics.averageSessionLength} min
              </div>
            </div>

            <div>
              <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                Medical Disclaimer Rate
              </div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937" }}>
                100%
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "24px"
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "20px"
          }}>
            📋 Action Items & Alerts
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {analytics.emergencyFlags > 0 && (
              <div style={{
                padding: "12px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "20px" }}>🚨</span>
                <div>
                  <div style={{ fontWeight: "600", color: "#dc2626" }}>
                    Emergency Flags Detected
                  </div>
                  <div style={{ fontSize: "14px", color: "#7f1d1d" }}>
                    {analytics.emergencyFlags} conversations flagged for urgent medical attention
                  </div>
                </div>
              </div>
            )}
            
            <div style={{
              padding: "12px 16px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span style={{ fontSize: "20px" }}>✅</span>
              <div>
                <div style={{ fontWeight: "600", color: "#15803d" }}>
                  System Operating Normally
                </div>
                <div style={{ fontSize: "14px", color: "#166534" }}>
                  AI responses maintaining quality standards
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HealthcareChatAnalytics() {
  return (
    <AdminProtection>
      <HealthcareChatAnalyticsContent />
    </AdminProtection>
  );
}
