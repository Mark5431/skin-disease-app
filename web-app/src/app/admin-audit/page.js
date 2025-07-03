"use client";

import React, { useState, useEffect } from "react";
import AdminProtection from "../components/AdminProtection";

function AdminAuditContent() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [filters, setFilters] = useState({
    user_id: "",
    action_filter: "",
    limit: 50
  });

  const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    
    try {
      const token = localStorage.getItem('authToken');
      console.log('🔍 Fetching audit logs with token:', token ? 'Token present' : 'No token found');
      
      if (!token) {
        setError('No authentication token found. Please log in as an admin.');
        setConnectionStatus('error');
        return;
      }
      
      const response = await fetch(`${nodeApiBase}/admin/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...filters,
          admin_token: token
        })
      });

      console.log('📊 Audit logs response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Audit logs loaded successfully:', data.logs?.length || 0, 'entries');
        setAuditLogs(data.logs || []);
        setConnectionStatus('connected');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch audit logs:', response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          setError('Unauthorized: Admin privileges required to access audit logs.');
        } else if (response.status === 500) {
          setError('Server error: Please check if the backend server is running.');
        } else {
          setError(`Failed to fetch audit logs: ${response.status} ${errorText}`);
        }
        setConnectionStatus('error');
        setAuditLogs([]);
      }
    } catch (error) {
      console.error('🚨 Error fetching audit logs:', error);
      setError(`Connection error: ${error.message}. Please check if the backend server is running on port 4000.`);
      setConnectionStatus('error');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('📈 Fetching audit stats...');
      
      const response = await fetch(`${nodeApiBase}/admin/audit-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📈 Audit stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Stats loaded successfully:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch stats:', response.status, errorText);
      }
    } catch (error) {
      console.error('🚨 Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchAuditLogs();
      await fetchStats();
    };
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

        {/* Connection Status */}
        {connectionStatus === 'checking' && (
          <div style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            color: "#92400e"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "16px",
                height: "16px",
                border: "2px solid #f59e0b",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              Checking connection to backend server...
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            color: "#dc2626"
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
              ❌ Connection Error
            </h3>
            <p style={{ margin: "0", fontSize: "14px" }}>{error}</p>
            <div style={{ marginTop: "12px", fontSize: "12px", color: "#7f1d1d" }}>
              <strong>Troubleshooting tips:</strong>
              <ul style={{ margin: "4px 0 0 16px", paddingLeft: "0" }}>
                <li>Ensure the Node.js backend server is running on port 4000</li>
                <li>Check that you&apos;re logged in with admin privileges</li>
                <li>Verify your network connection</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setError(null);
                fetchAuditLogs();
              }}
              style={{
                marginTop: "12px",
                padding: "8px 16px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              🔄 Retry Connection
            </button>
          </div>
        )}

        {/* Connection Success */}
        {connectionStatus === 'connected' && !error && (
          <div style={{
            background: "#f0f9ff",
            border: "1px solid #0284c7",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            color: "#0c4a6e",
            fontSize: "14px"
          }}>
            ✅ Successfully connected to backend server
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
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>Total Logs</h3>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#3b82f6", margin: 0 }}>
                {stats.total_logs}
              </p>
            </div>
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)"
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
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
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
                fontSize: "14px",
                background: "white",
                color: "#374151"
              }}
            />
            <select
              value={filters.action_filter}
              onChange={(e) => setFilters({...filters, action_filter: e.target.value})}
              style={{
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                background: "white",
                color: "#374151"
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
                fontSize: "14px",
                background: "white",
                color: "#374151"
              }}
            />
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
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
            <div style={{
              maxHeight: "600px",
              overflowY: "auto",
              overflowX: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "8px"
            }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px"
              }}>
                <thead style={{ position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "2px solid #e5e7eb" }}>Timestamp</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "2px solid #e5e7eb" }}>Action</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "2px solid #e5e7eb" }}>User ID</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "2px solid #e5e7eb" }}>IP Address</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "2px solid #e5e7eb" }}>Browser</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "2px solid #e5e7eb" }}>Details</th>
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
          </div>
        )}

        {/* No logs message */}
        {!loading && auditLogs.length === 0 && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <p style={{ color: "#6b7280", fontSize: "16px" }}>No audit logs found with current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAudit() {
  return (
    <AdminProtection>
      <AdminAuditContent />
    </AdminProtection>
  );
}
