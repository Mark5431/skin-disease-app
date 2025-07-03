"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminProtection({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setError('Please log in to access admin features');
          setIsLoading(false);
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/login?redirect=admin');
          }, 2000);
          return;
        }

        const response = await fetch(`${nodeApiBase}/check-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.role === 'admin') {
            setUserInfo(data);
            setIsAuthorized(true);
            setError(null);
          } else {
            setError('Admin privileges required to access this page');
            // Redirect to dashboard after a delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          }
        } else {
          setError('Authentication failed. Please log in again.');
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/login?redirect=admin');
          }, 2000);
        }
      } catch (err) {
        setError('Connection error. Please try again.');
        console.error('Admin auth check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [router, nodeApiBase]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "60px",
            height: "60px",
            border: "4px solid rgba(255,255,255,0.3)",
            borderTop: "4px solid white",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <h2 style={{ margin: "0 0 10px 0" }}>Verifying Admin Access...</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>Please wait while we check your permissions</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state (unauthorized access)
  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        padding: "20px"
      }}>
        <div style={{ 
          textAlign: "center",
          maxWidth: "500px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "40px",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}>
          <div style={{
            fontSize: "60px",
            marginBottom: "20px"
          }}>
            🚫
          </div>
          <h1 style={{ 
            margin: "0 0 20px 0",
            fontSize: "28px",
            fontWeight: "600"
          }}>
            Access Denied
          </h1>
          <p style={{ 
            margin: "0 0 30px 0",
            fontSize: "16px",
            opacity: 0.9,
            lineHeight: "1.5"
          }}>
            {error}
          </p>
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: "12px 24px",
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.3)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: "12px 24px",
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.3)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render the protected content
  if (isAuthorized && userInfo) {
    return (
      <div>
        {/* Optional: Add admin header/navigation */}
        <div style={{
          position: "sticky",
          top: 0,
          background: "rgba(102, 126, 234, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "12px 20px",
          color: "white",
          fontSize: "14px",
          fontWeight: "500",
          zIndex: 100,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto"
          }}>
            <span>
              🛡️ Admin Mode - Logged in as <strong>{userInfo.username}</strong>
            </span>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "white",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.2)";
              }}
            >
              Exit Admin
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Fallback
  return null;
}
