"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "../utils/auth";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    notifications: true,
    emailUpdates: true,
    darkMode: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Load user data
    const userData = auth.getCurrentUser();
    setUser(userData);
    
    // Populate form with existing data
    setFormData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      bio: userData?.bio || '',
      notifications: userData?.notifications !== false,
      emailUpdates: userData?.emailUpdates !== false,
      darkMode: userData?.darkMode === true
    });
    
    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update localStorage
      Object.keys(formData).forEach(key => {
        localStorage.setItem(key, formData[key]);
      });
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
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
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'preferences', label: '⚙️ Preferences', icon: '⚙️' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' }
  ];

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
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .slide-in {
          animation: slideIn 0.4s ease-out;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .interactive-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .interactive-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
        }
        
        .tab-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .tab-button:hover {
          transform: translateY(-2px);
        }
        
        .input-field {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .input-field:focus {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "var(--font-geist-sans, sans-serif)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Header */}
        <header className="glass-card" style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          padding: "24px 0",
          borderBottom: "1px solid rgba(37, 99, 235, 0.1)",
        }}>
          <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <h1 style={{
                fontSize: 32,
                fontWeight: 700,
                background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                marginBottom: 4,
              }}>
                ⚙️ Account Settings
              </h1>
              <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>
                Manage your profile and preferences
              </p>
            </div>
            <Link
              href="/dashboard"
              className="interactive-button"
              style={{
                background: "linear-gradient(135deg, #6b7280, #4b5563)",
                color: "white",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(107, 114, 128, 0.3)",
              }}
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: "40px",
            alignItems: "start"
          }}>
            {/* Sidebar */}
            <div className="glass-card fade-in-up" style={{
              borderRadius: 20,
              padding: 30,
              boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
              position: "sticky",
              top: "20px"
            }}>
              <div style={{
                textAlign: "center",
                marginBottom: 30,
                paddingBottom: 20,
                borderBottom: "2px solid rgba(229, 231, 235, 0.5)"
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "32px",
                  color: "white",
                  boxShadow: "0 8px 25px rgba(37, 99, 235, 0.3)"
                }}>
                  👤
                </div>
                <h3 style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#1f2937",
                  margin: "0 0 4px 0"
                }}>
                  {user?.username || 'User'}
                </h3>
                <p style={{
                  color: "#6b7280",
                  fontSize: "14px",
                  margin: 0
                }}>
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              <nav>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="tab-button"
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      border: "none",
                      borderRadius: "12px",
                      background: activeTab === tab.id 
                        ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                        : "transparent",
                      color: activeTab === tab.id ? "white" : "#6b7280",
                      textAlign: "left",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      boxShadow: activeTab === tab.id 
                        ? "0 4px 16px rgba(37, 99, 235, 0.3)" 
                        : "none"
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="glass-card fade-in-up" style={{
              borderRadius: 20,
              padding: 40,
              boxShadow: "0 15px 35px rgba(0,0,0,0.1)"
            }}>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="slide-in">
                  <h2 style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: 30
                  }}>
                    👤 Profile Information
                  </h2>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                    marginBottom: "24px"
                  }}>
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: 8,
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: "16px",
                      }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="input-field"
                        style={{
                          width: "100%",
                          padding: "16px",
                          border: "2px solid #e5e7eb",
                          borderRadius: 12,
                          fontSize: 16,
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: 8,
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: "16px",
                      }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="input-field"
                        style={{
                          width: "100%",
                          padding: "16px",
                          border: "2px solid #e5e7eb",
                          borderRadius: 12,
                          fontSize: 16,
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "16px",
                    }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field"
                      style={{
                        width: "100%",
                        padding: "16px",
                        border: "2px solid #e5e7eb",
                        borderRadius: 12,
                        fontSize: 16,
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                      onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "16px",
                    }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                      style={{
                        width: "100%",
                        padding: "16px",
                        border: "2px solid #e5e7eb",
                        borderRadius: 12,
                        fontSize: 16,
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                      onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  <div style={{ marginBottom: "32px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "16px",
                    }}>
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      className="input-field"
                      style={{
                        width: "100%",
                        padding: "16px",
                        border: "2px solid #e5e7eb",
                        borderRadius: 12,
                        fontSize: 16,
                        boxSizing: "border-box",
                        minHeight: "120px",
                        resize: "vertical"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                      onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                    />
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="slide-in">
                  <h2 style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: 30
                  }}>
                    ⚙️ Preferences
                  </h2>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px"
                  }}>
                    <div style={{
                      padding: "20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}>
                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer"
                      }}>
                        <input
                          type="checkbox"
                          name="notifications"
                          checked={formData.notifications}
                          onChange={handleInputChange}
                          style={{
                            width: "20px",
                            height: "20px",
                            accentColor: "#2563eb"
                          }}
                        />
                        <div>
                          <span style={{
                            fontWeight: 600,
                            color: "#374151",
                            fontSize: "16px"
                          }}>
                            🔔 Push Notifications
                          </span>
                          <p style={{
                            color: "#6b7280",
                            fontSize: "14px",
                            margin: "4px 0 0 0"
                          }}>
                            Receive notifications about analysis results and updates
                          </p>
                        </div>
                      </label>
                    </div>

                    <div style={{
                      padding: "20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}>
                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer"
                      }}>
                        <input
                          type="checkbox"
                          name="emailUpdates"
                          checked={formData.emailUpdates}
                          onChange={handleInputChange}
                          style={{
                            width: "20px",
                            height: "20px",
                            accentColor: "#2563eb"
                          }}
                        />
                        <div>
                          <span style={{
                            fontWeight: 600,
                            color: "#374151",
                            fontSize: "16px"
                          }}>
                            📧 Email Updates
                          </span>
                          <p style={{
                            color: "#6b7280",
                            fontSize: "14px",
                            margin: "4px 0 0 0"
                          }}>
                            Get weekly summaries and important announcements via email
                          </p>
                        </div>
                      </label>
                    </div>

                    <div style={{
                      padding: "20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}>
                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer"
                      }}>
                        <input
                          type="checkbox"
                          name="darkMode"
                          checked={formData.darkMode}
                          onChange={handleInputChange}
                          style={{
                            width: "20px",
                            height: "20px",
                            accentColor: "#2563eb"
                          }}
                        />
                        <div>
                          <span style={{
                            fontWeight: 600,
                            color: "#374151",
                            fontSize: "16px"
                          }}>
                            🌙 Dark Mode
                          </span>
                          <p style={{
                            color: "#6b7280",
                            fontSize: "14px",
                            margin: "4px 0 0 0"
                          }}>
                            Switch to dark theme for better viewing in low light
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="slide-in">
                  <h2 style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: 30
                  }}>
                    🔒 Security Settings
                  </h2>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px"
                  }}>
                    <div style={{
                      padding: "24px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "16px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}>
                      <h3 style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "12px"
                      }}>
                        🔑 Change Password
                      </h3>
                      <p style={{
                        color: "#6b7280",
                        marginBottom: "16px"
                      }}>
                        Update your password to keep your account secure
                      </p>
                      <button
                        className="interactive-button"
                        style={{
                          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                          color: "white",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 4px 16px rgba(37, 99, 235, 0.3)",
                        }}
                      >
                        Change Password
                      </button>
                    </div>

                    <div style={{
                      padding: "24px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "16px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}>
                      <h3 style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "12px"
                      }}>
                        📱 Two-Factor Authentication
                      </h3>
                      <p style={{
                        color: "#6b7280",
                        marginBottom: "16px"
                      }}>
                        Add an extra layer of security to your account
                      </p>
                      <button
                        className="interactive-button"
                        style={{
                          background: "linear-gradient(135deg, #10b981, #34d399)",
                          color: "white",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        Enable 2FA
                      </button>
                    </div>

                    <div style={{
                      padding: "24px",
                      border: "2px solid #fecaca",
                      borderRadius: "16px",
                      background: "rgba(254, 242, 242, 0.5)"
                    }}>
                      <h3 style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#dc2626",
                        marginBottom: "12px"
                      }}>
                        ⚠️ Delete Account
                      </h3>
                      <p style={{
                        color: "#991b1b",
                        marginBottom: "16px"
                      }}>
                        Permanently delete your account and all associated data
                      </p>
                      <button
                        className="interactive-button"
                        style={{
                          background: "linear-gradient(135deg, #ef4444, #f87171)",
                          color: "white",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="slide-in">
                  <h2 style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: 30
                  }}>
                    🔔 Notification Settings
                  </h2>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px"
                  }}>
                    <div style={{
                      padding: "20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}>
                      <h3 style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "8px"
                      }}>
                        📊 Analysis Complete
                      </h3>
                      <p style={{
                        color: "#6b7280",
                        fontSize: "14px",
                        marginBottom: "12px"
                      }}>
                        Get notified when your image analysis is complete
                      </p>
                      <select style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: "white"
                      }}>
                        <option>Push + Email</option>
                        <option>Push only</option>
                        <option>Email only</option>
                        <option>Off</option>
                      </select>
                    </div>

                    <div style={{
                      padding: "20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}>
                      <h3 style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "8px"
                      }}>
                        🆕 New Features
                      </h3>
                      <p style={{
                        color: "#6b7280",
                        fontSize: "14px",
                        marginBottom: "12px"
                      }}>
                        Stay updated on new platform features and improvements
                      </p>
                      <select style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: "white"
                      }}>
                        <option>Email only</option>
                        <option>Push + Email</option>
                        <option>Off</option>
                      </select>
                    </div>

                    <div style={{
                      padding: "20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}>
                      <h3 style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "8px"
                      }}>
                        📈 Weekly Summary
                      </h3>
                      <p style={{
                        color: "#6b7280",
                        fontSize: "14px",
                        marginBottom: "12px"
                      }}>
                        Receive weekly reports of your analysis activity
                      </p>
                      <select style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: "white"
                      }}>
                        <option>Email only</option>
                        <option>Off</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Section */}
              <div style={{
                marginTop: "40px",
                paddingTop: "24px",
                borderTop: "2px solid rgba(229, 231, 235, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                {saveMessage && (
                  <div style={{
                    color: saveMessage.includes('Error') ? "#dc2626" : "#10b981",
                    fontWeight: 600,
                    fontSize: "16px"
                  }}>
                    {saveMessage.includes('Error') ? "❌" : "✅"} {saveMessage}
                  </div>
                )}
                
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="interactive-button"
                  style={{
                    background: isSaving 
                      ? "linear-gradient(135deg, #9ca3af, #6b7280)" 
                      : "linear-gradient(135deg, #2563eb, #3b82f6)",
                    color: "white",
                    border: "none",
                    padding: "16px 32px",
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    boxShadow: isSaving 
                      ? "none" 
                      : "0 4px 16px rgba(37, 99, 235, 0.3)",
                    marginLeft: "auto"
                  }}
                >
                  {isSaving ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "20px",
                        height: "20px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}></div>
                      Saving...
                    </span>
                  ) : (
                    "💾 Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
