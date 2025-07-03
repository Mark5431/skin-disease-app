"use client";

import Link from "next/link";
import AdminProtection from "../components/AdminProtection";

function AdminDashboardContent() {
  const adminCards = [
    {
      title: "🔍 Audit Logs",
      description: "View system audit logs and user activity tracking",
      href: "/admin-audit",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      title: "� User Management",
      description: "Manage user accounts, roles, and permissions",
      href: "/admin-users", 
      color: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
    },
    {
      title: "�📊 System Stats", 
      description: "Monitor system performance and usage statistics",
      href: "/admin-dashboard/stats",
      color: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    },
    {
      title: "🤖 Model Performance",
      description: "Monitor AI model accuracy and performance metrics",
      href: "/admin-dashboard/models",
      color: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
    },
    {
      title: "🔐 Security Center",
      description: "Security settings and compliance monitoring",
      href: "/admin-dashboard/security",
      color: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
    },
    {
      title: "⚙️ System Settings",
      description: "Configure system-wide settings and preferences", 
      href: "/admin-dashboard/settings",
      color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
    },
    {
      title: "📝 Feedback Analytics",
      description: "Monitor user feedback and satisfaction metrics", 
      href: "/admin-dashboard/feedback",
      color: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
    },
    {
      title: "🩺 Healthcare Chat Analytics",
      description: "Monitor AI healthcare assistant usage and interactions", 
      href: "/admin-dashboard/healthcare-chat",
      color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
    }
  ];

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "var(--primary-gradient)",
      padding: "40px 20px"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{
          fontSize: "48px",
          fontWeight: "700",
          color: "white",
          textAlign: "center",
          marginBottom: "16px"
        }}>
          🔧 Admin Dashboard
        </h1>
        <p style={{
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.9)",
          textAlign: "center",
          marginBottom: "60px"
        }}>
          Comprehensive system administration and monitoring
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          marginBottom: "40px"
        }}>
          {adminCards.map((card, index) => (
            <Link 
              key={index}
              href={card.href}
              style={{
                textDecoration: "none",
                display: "block"
              }}
            >
              <div style={{
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "20px",
                padding: "32px",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.1)";
              }}
              >
                <h3 style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  background: card.color,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "12px",
                  textAlign: "center"
                }}>
                  {card.title}
                </h3>
                <p style={{
                  color: "#6b7280",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  textAlign: "center",
                  margin: 0
                }}>
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          padding: "32px",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          textAlign: "center"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "20px"
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap"
          }}>
            <Link 
              href="/dashboard"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                textDecoration: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              🏠 User Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminProtection>
      <AdminDashboardContent />
    </AdminProtection>
  );
}