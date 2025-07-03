"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Check password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "#ef4444";
    if (passwordStrength < 50) return "#f59e0b";
    if (passwordStrength < 75) return "#eab308";
    return "#10b981";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Weak";
    if (passwordStrength < 50) return "Fair";
    if (passwordStrength < 75) return "Good";
    return "Strong";
  };

  const validateStep1 = () => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError("Username must be 3-20 characters long and contain only letters, numbers, underscores, or hyphens");
      return false;
    }
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!validateStep2()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
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
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }
        
        .slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }
        
        .float {
          animation: float 3s ease-in-out infinite;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .interactive-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .interactive-input:focus {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
        }
        
        .interactive-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .interactive-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
        }
        
        .step-indicator {
          transition: all 0.3s ease;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          fontFamily: "var(--font-geist-sans, sans-serif)",
          padding: "20px",
        }}
      >
        {/* Background Elements */}
        <div style={{
          position: "absolute",
          top: "15%",
          left: "15%",
          fontSize: "120px",
          opacity: "0.08",
          color: "white"
        }} className="float">
          🎯
        </div>
        <div style={{
          position: "absolute",
          bottom: "15%",
          right: "15%",
          fontSize: "100px",
          opacity: "0.08",
          color: "white"
        }} className="float">
          🚀
        </div>

        <div
          className="glass-card fade-in-up"
          style={{
            maxWidth: 500,
            width: "100%",
            borderRadius: 24,
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            padding: "50px 40px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Progress Indicator */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "40px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}>
              <div 
                className="step-indicator"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: currentStep >= 1 
                    ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                    : "rgba(229, 231, 235, 0.5)",
                  color: currentStep >= 1 ? "white" : "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "16px",
                  boxShadow: currentStep >= 1 
                    ? "0 4px 16px rgba(37, 99, 235, 0.3)" 
                    : "none"
                }}
              >
                1
              </div>
              <div style={{
                width: "40px",
                height: "3px",
                background: currentStep >= 2 
                  ? "linear-gradient(90deg, #2563eb, #3b82f6)"
                  : "rgba(229, 231, 235, 0.5)",
                borderRadius: "2px"
              }} />
              <div 
                className="step-indicator"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: currentStep >= 2 
                    ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                    : "rgba(229, 231, 235, 0.5)",
                  color: currentStep >= 2 ? "white" : "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "16px",
                  boxShadow: currentStep >= 2 
                    ? "0 4px 16px rgba(37, 99, 235, 0.3)" 
                    : "none"
                }}
              >
                2
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{
              fontSize: "60px",
              marginBottom: "20px"
            }}>
              {currentStep === 1 ? "👤" : "🔐"}
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: 12,
              }}
            >
              {currentStep === 1 ? "Create Account" : "Account Security"}
            </h1>
            <p style={{ color: "#6b7280", fontSize: 18, lineHeight: "1.6" }}>
              {currentStep === 1 
                ? "Join our medical analysis platform"
                : "Set up your login credentials"
              }
            </p>
          </div>

          <form onSubmit={currentStep === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="slide-in-right">
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 12,
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    👤 Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Choose a unique username"
                    className="interactive-input"
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.9)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.background = "white";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "rgba(255,255,255,0.9)";
                    }}
                  />
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "32px"
                }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 12,
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: "16px",
                      }}
                    >
                      📝 First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      placeholder="First name"
                      className="interactive-input"
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        border: "2px solid #e5e7eb",
                        borderRadius: 12,
                        fontSize: 16,
                        boxSizing: "border-box",
                        background: "rgba(255,255,255,0.9)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#2563eb";
                        e.target.style.background = "white";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.background = "rgba(255,255,255,0.9)";
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 12,
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: "16px",
                      }}
                    >
                      📝 Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Last name"
                      className="interactive-input"
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        border: "2px solid #e5e7eb",
                        borderRadius: 12,
                        fontSize: 16,
                        boxSizing: "border-box",
                        background: "rgba(255,255,255,0.9)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#2563eb";
                        e.target.style.background = "white";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.background = "rgba(255,255,255,0.9)";
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Account Security */}
            {currentStep === 2 && (
              <div className="slide-in-left">
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 12,
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    📧 Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    className="interactive-input"
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.9)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.background = "white";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "rgba(255,255,255,0.9)";
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 12,
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    🔑 Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create a strong password"
                    className="interactive-input"
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.9)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.background = "white";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "rgba(255,255,255,0.9)";
                    }}
                  />
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div style={{ marginTop: "12px" }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px"
                      }}>
                        <span style={{
                          fontSize: "14px",
                          color: "#6b7280"
                        }}>
                          Password Strength:
                        </span>
                        <span style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: getPasswordStrengthColor()
                        }}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div style={{
                        width: "100%",
                        height: "4px",
                        background: "rgba(229, 231, 235, 0.5)",
                        borderRadius: "2px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${passwordStrength}%`,
                          height: "100%",
                          background: getPasswordStrengthColor(),
                          transition: "all 0.3s ease",
                          borderRadius: "2px"
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 12,
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    🔒 Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                    className="interactive-input"
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.9)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.background = "white";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "rgba(255,255,255,0.9)";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="fade-in-up"
                style={{
                  background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                  fontSize: 15,
                  fontWeight: 500,
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.1)"
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                className="fade-in-up"
                style={{
                  background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                  border: "1px solid #bbf7d0",
                  color: "#15803d",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                  fontSize: 15,
                  fontWeight: 500,
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(21, 128, 61, 0.1)"
                }}
              >
                ✅ {success}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "16px",
              justifyContent: currentStep === 1 ? "flex-end" : "space-between"
            }}>
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="interactive-button"
                  style={{
                    background: "rgba(107, 114, 128, 0.1)",
                    color: "#6b7280",
                    border: "2px solid #6b7280",
                    padding: "16px 24px",
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="interactive-button"
                style={{
                  background: loading 
                    ? "linear-gradient(135deg, #9ca3af, #6b7280)" 
                    : "linear-gradient(135deg, #2563eb, #3b82f6)",
                  color: "white",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading 
                    ? "none" 
                    : "0 4px 16px rgba(37, 99, 235, 0.3)",
                  flex: currentStep === 1 ? "none" : "1"
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                    <div style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}></div>
                    Creating Account...
                  </span>
                ) : currentStep === 1 ? (
                  "Next →"
                ) : (
                  "🚀 Create Account"
                )}
              </button>
            </div>
          </form>

          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <p style={{ color: "#6b7280", fontSize: 16, marginBottom: "16px" }}>
              Already have an account?
            </p>
            <Link
              href="/login"
              className="interactive-button"
              style={{
                display: "inline-block",
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "16px",
                padding: "12px 24px",
                border: "2px solid #2563eb",
                borderRadius: "12px",
                background: "rgba(37, 99, 235, 0.05)",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#2563eb";
                e.target.style.color = "white";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(37, 99, 235, 0.05)";
                e.target.style.color = "#2563eb";
              }}
            >
              🔐 Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;
