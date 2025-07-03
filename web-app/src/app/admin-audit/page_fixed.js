"use client";

import React, { useState, useEffect } from "react";

export default function AdminAudit() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [filters, setFilters] = useState({
    user_id: "",
    action_filter: "",
    limit: 50
  });

  const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  // Check authentication and get user info
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthError('Please log in to access admin features');
        return;
      }

      try {
        const response = await fetch(`${nodeApiBase}/check-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.role !== 'admin') {
            setAuthError('Admin privileges required');
            return;
          }
          setUserInfo(data);
          setAuthError(null);
        } else {
          setAuthError('Authentication failed');
        }
      } catch (error) {
        setAuthError('Authentication error');
      }
    };

    checkAuth();
  }, [nodeApiBase]);

  const fetchAuditLogs = async () => {
    if (!userInfo) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${nodeApiBase}/admin/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...filters,
          admin_token: token
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
      } else if (response.status === 401 || response.status === 403) {
        setAuthError('Admin authentication required');
      } else {
        console.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!userInfo) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${nodeApiBase}/admin/audit-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_token: token
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401 || response.status === 403) {
        setAuthError('Admin authentication required');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (userInfo && !authError) {
      const loadInitialData = async () => {
        await fetchAuditLogs();
        await fetchStats();
      };
      loadInitialData();
    }
  }, [userInfo, authError]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    const colors = {
      'USER_REGISTRATION': '#10b981',
      'USER_LOGIN_SUCCESS': '#3b82f6', 
      'USER_LOGIN_FAILED': '#ef4444',
      'USER_LOGOUT': '#f59e0b',
      'PREDICTION_MADE': '#8b5cf6',
      'IMAGE_UPLOAD': '#06b6d4',
      'GRADCAM_UPLOAD': '#06b6d4',
      'PREDICTION_HISTORY_ACCESSED': '#6b7280',
      'AUDIT_LOGS_ACCESSED': '#f97316',
      'ADMIN_ACCESS_GRANTED': '#10b981',
      'ADMIN_ACCESS_DENIED': '#ef4444'
    };
    return colors[action] || '#6b7280';
  };

  if (authError) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          maxWidth: "400px",
          width: "100%"
        }}>
          <h1 style={{ color: "#dc2626", marginBottom: "20px" }}>Access Denied</h1>
          <p style={{ color: "#374151", marginBottom: "30px" }}>{authError}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: "12px 24px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "40px 20px"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <h1 style={{
          fontSize: "36px",
          fontWeight: "bold",
          color: "white",
          textAlign: "center",
          marginBottom: "40px"
        }}>
          🔍 Audit Logs Dashboard
        </h1>

        {/* User Info */}
        {userInfo && (
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            color: "white",
            textAlign: "center"
          }}>
            <p style={{ margin: 0 }}>
              Logged in as: <strong>{userInfo.username}</strong> ({userInfo.role})
            </p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "40px"
          }}>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>Total Logs</h3>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#3b82f6", margin: 0 }}>
                {stats.total_logs}
              </p>
            </div>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>Last 24 Hours</h3>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981", margin: 0 }}>
                {stats.logs_last_24h}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0, color: "#374151" }}>Filters</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "20px"
          }}>
            <input
              type="text"
              placeholder="User ID"
              value={filters.user_id}
              onChange={(e) => setFilters({...filters, user_id: e.target.value})}
              style={{
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
            <select
              value={filters.action_filter}
              onChange={(e) => setFilters({...filters, action_filter: e.target.value})}
              style={{
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            >
              <option value="">All Actions</option>
              <option value="USER_REGISTRATION">User Registration</option>
              <option value="USER_LOGIN_SUCCESS">Login Success</option>
              <option value="USER_LOGIN_FAILED">Login Failed</option>
              <option value="USER_LOGOUT">User Logout</option>
              <option value="PREDICTION_MADE">Prediction Made</option>
              <option value="IMAGE_UPLOAD">Image Upload</option>
              <option value="GRADCAM_UPLOAD">GradCAM Upload</option>
              <option value="AUDIT_LOGS_ACCESSED">Audit Logs Accessed</option>
            </select>
            <input
              type="number"
              placeholder="Limit"
              value={filters.limit}
              onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value) || 50})}
              style={{
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={loading || !userInfo}
            style={{
              padding: "12px 24px",
              background: loading ? "#9ca3af" : "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{
            textAlign: "center",
            padding: "40px",
            color: "white"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255,255,255,0.3)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px"
            }}></div>
            <p>Loading audit logs...</p>
          </div>
        )}

        {/* Audit Logs Table */}
        {!loading && auditLogs.length > 0 && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            overflowX: "auto"
          }}>
            <h3 style={{ marginTop: 0, color: "#374151" }}>
              Audit Logs ({auditLogs.length} records)
            </h3>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px"
            }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Timestamp</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Action</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>User ID</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>IP Address</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Browser</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, index) => (
                  <tr key={index} style={{
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: index % 2 === 0 ? "#f9fafb" : "white"
                  }}>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "white",
                        backgroundColor: getActionColor(log.action)
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      {log.user_id || 'N/A'}
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      {log.ip_address || 'N/A'}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px" }}>
                      {log.browser || 'Unknown'}
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px", maxWidth: "200px" }}>
                      <pre style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word"
                      }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
