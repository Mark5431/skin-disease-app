"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    user_id: '',
    action_filter: '',
    limit: 100
  });
  const [error, setError] = useState(null);
  const router = useRouter();
  const nodeApiBase = "http://localhost:4000";

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${nodeApiBase}/admin/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }

      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [nodeApiBase, filters]);

  const fetchAuditStats = useCallback(async () => {
    try {
      const response = await fetch(`${nodeApiBase}/admin/audit-stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching audit stats:", error);
    }
  }, [nodeApiBase]);

  useEffect(() => {
    fetchAuditStats();
    fetchAuditLogs();
  }, [fetchAuditStats, fetchAuditLogs]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    fetchAuditLogs();
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    const colors = {
      'USER_REGISTRATION': '#10b981',
      'USER_LOGIN_SUCCESS': '#3b82f6',
      'USER_LOGIN_FAILED': '#ef4444',
      'PREDICTION_MADE': '#8b5cf6',
      'IMAGE_UPLOAD': '#f59e0b',
      'GRADCAM_UPLOAD': '#06b6d4',
      'PREDICTION_HISTORY_ACCESSED': '#6b7280',
      'AUDIT_LOGS_ACCESSED': '#f97316'
    };
    return colors[action] || '#6b7280';
  };

  if (error) {
    return (
      <div style={{ 
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          textAlign: "center",
          maxWidth: "500px"
        }}>
          <h2 style={{ color: "#ef4444", marginBottom: "16px" }}>Error</h2>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>{error}</p>
          <Link href="/admin-dashboard" style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            textDecoration: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "600"
          }}>
            Back to Admin Dashboard
          </Link>
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
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          padding: "40px",
          marginBottom: "30px",
          backdropFilter: "blur(20px)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h1 style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#1f2937",
              margin: 0
            }}>
              🔍 Audit Logs
            </h1>
            <Link href="/admin-dashboard" style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textDecoration: "none",
              padding: "12px 24px",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "14px"
            }}>
              ← Back to Admin
            </Link>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
                padding: "20px",
                borderRadius: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "28px", fontWeight: "700" }}>
                  {stats.total_logs}
                </div>
                <div style={{ fontSize: "14px", opacity: 0.9 }}>
                  Total Logs
                </div>
              </div>
              <div style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                padding: "20px",
                borderRadius: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "28px", fontWeight: "700" }}>
                  {stats.logs_last_24h}
                </div>
                <div style={{ fontSize: "14px", opacity: 0.9 }}>
                  Last 24 Hours
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "20px"
          }}>
            <input
              type="text"
              name="user_id"
              placeholder="Filter by User ID"
              value={filters.user_id}
              onChange={handleFilterChange}
              style={{
                padding: "12px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
            <select
              name="action_filter"
              value={filters.action_filter}
              onChange={handleFilterChange}
              style={{
                padding: "12px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            >
              <option value="">All Actions</option>
              <option value="USER_REGISTRATION">User Registration</option>
              <option value="USER_LOGIN_SUCCESS">Login Success</option>
              <option value="USER_LOGIN_FAILED">Login Failed</option>
              <option value="PREDICTION_MADE">Prediction Made</option>
              <option value="IMAGE_UPLOAD">Image Upload</option>
              <option value="GRADCAM_UPLOAD">GradCAM Upload</option>
              <option value="PREDICTION_HISTORY_ACCESSED">History Accessed</option>
            </select>
            <select
              name="limit"
              value={filters.limit}
              onChange={handleFilterChange}
              style={{
                padding: "12px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            >
              <option value="50">50 logs</option>
              <option value="100">100 logs</option>
              <option value="200">200 logs</option>
              <option value="500">500 logs</option>
            </select>
            <button
              onClick={applyFilters}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          padding: "40px",
          backdropFilter: "blur(20px)"
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "4px solid #e2e8f0",
                borderTop: "4px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px"
              }}></div>
              <p style={{ color: "#6b7280" }}>Loading audit logs...</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                      Timestamp
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                      Action
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                      User ID
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                      IP Address
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr key={log._id} style={{
                      borderBottom: "1px solid #e5e7eb",
                      background: index % 2 === 0 ? "white" : "#f9fafb"
                    }}>
                      <td style={{ padding: "16px", color: "#6b7280" }}>
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          background: getActionColor(log.action),
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: "#374151", fontFamily: "monospace" }}>
                        {log.user_id || 'N/A'}
                      </td>
                      <td style={{ padding: "16px", color: "#6b7280", fontFamily: "monospace" }}>
                        {log.ip_address || 'N/A'}
                      </td>
                      <td style={{ padding: "16px", color: "#6b7280", maxWidth: "300px" }}>
                        <details>
                          <summary style={{ cursor: "pointer", color: "#3b82f6" }}>
                            View Details
                          </summary>
                          <pre style={{
                            background: "#f3f4f6",
                            padding: "8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            marginTop: "8px",
                            overflow: "auto"
                          }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {auditLogs.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.7 }}>
                    📋
                  </div>
                  <h3 style={{ color: "#374151", marginBottom: "8px" }}>
                    No audit logs found
                  </h3>
                  <p style={{ color: "#6b7280" }}>
                    Try adjusting your filters or check back later.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
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
