"use client";

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';

export default function ThemeDemo() {
  const { isDarkMode } = useTheme();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--primary-gradient)",
      padding: "40px 20px",
      transition: "all 0.3s ease"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        {/* Header with Theme Toggle */}
        <div style={{
          background: "var(--card-background)",
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "32px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--card-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{
              color: "var(--text-primary)",
              margin: "0 0 8px 0",
              fontSize: "32px",
              fontWeight: "700"
            }}>
              🌙 Dark Mode Demo
            </h1>
            <p style={{
              color: "var(--text-secondary)",
              margin: 0,
              fontSize: "16px"
            }}>
              Currently using: <strong>{isDarkMode ? 'Dark' : 'Light'}</strong> theme
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Feature Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
          marginBottom: "32px"
        }}>
          <div style={{
            background: "var(--card-background)",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--card-border)"
          }}>
            <h3 style={{ color: "var(--text-primary)", margin: "0 0 12px 0" }}>
              🎨 Adaptive Colors
            </h3>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              All colors automatically adjust based on the selected theme.
            </p>
          </div>

          <div style={{
            background: "var(--card-background)",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--card-border)"
          }}>
            <h3 style={{ color: "var(--text-primary)", margin: "0 0 12px 0" }}>
              💾 Persistent Storage
            </h3>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              Your theme preference is saved and restored on page reload.
            </p>
          </div>

          <div style={{
            background: "var(--card-background)",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--card-border)"
          }}>
            <h3 style={{ color: "var(--text-primary)", margin: "0 0 12px 0" }}>
              ⚡ Smooth Transitions
            </h3>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              Elegant animations when switching between themes.
            </p>
          </div>
        </div>

        {/* Sample Form */}
        <div style={{
          background: "var(--card-background)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--card-border)",
          marginBottom: "32px"
        }}>
          <h2 style={{
            color: "var(--text-primary)",
            margin: "0 0 24px 0",
            fontSize: "24px"
          }}>
            Sample Form Elements
          </h2>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              color: "var(--text-primary)",
              fontWeight: "600",
              marginBottom: "8px"
            }}>
              Text Input
            </label>
            <input
              type="text"
              placeholder="Type something here..."
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid var(--input-border)",
                borderRadius: "8px",
                background: "var(--input-background)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--info-color)"}
              onBlur={(e) => e.target.style.borderColor = "var(--input-border)"}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              color: "var(--text-primary)",
              fontWeight: "600",
              marginBottom: "8px"
            }}>
              Select Dropdown
            </label>
            <select style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid var(--input-border)",
              borderRadius: "8px",
              background: "var(--input-background)",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none"
            }}>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button style={{
              background: "var(--success-color)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}>
              Success Button
            </button>
            
            <button style={{
              background: "var(--error-color)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}>
              Error Button
            </button>
            
            <button style={{
              background: "var(--warning-color)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}>
              Warning Button
            </button>

            <button style={{
              background: "var(--info-color)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}>
              Info Button
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          background: "var(--card-background)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--card-border)",
          textAlign: "center"
        }}>
          <h3 style={{
            color: "var(--text-primary)",
            margin: "0 0 16px 0",
            fontSize: "20px"
          }}>
            Navigation
          </h3>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" style={{
              background: "var(--primary-gradient)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              display: "inline-block"
            }}>
              🏠 Dashboard
            </Link>
            <Link href="/admin-audit" style={{
              background: "var(--card-background)",
              color: "var(--text-primary)",
              border: "1px solid var(--card-border)",
              padding: "12px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              display: "inline-block"
            }}>
              🔍 Admin Audit
            </Link>
            <Link href="/upload-image" style={{
              background: "var(--card-background)",
              color: "var(--text-primary)",
              border: "1px solid var(--card-border)",
              padding: "12px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              display: "inline-block"
            }}>
              📸 Upload Image
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
