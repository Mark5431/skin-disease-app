"use client";

import React, { useState, useEffect } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

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

  const fetchUsers = async () => {
    if (!userInfo) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${nodeApiBase}/admin/list-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_token: token,
          limit: 100
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else if (response.status === 401 || response.status === 403) {
        setAuthError('Admin authentication required');
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const promoteUser = async (username) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${nodeApiBase}/admin/promote-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_token: token,
          target_username: username
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Successfully promoted ${username} to admin`);
        setMessageType('success');
        fetchUsers(); // Refresh user list
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to promote user');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error promoting user');
      setMessageType('error');
    }
  };

  const demoteUser = async (username) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${nodeApiBase}/admin/demote-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_token: token,
          target_username: username
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Successfully demoted ${username} to regular user`);
        setMessageType('success');
        fetchUsers(); // Refresh user list
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to demote user');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error demoting user');
      setMessageType('error');
    }
  };

  useEffect(() => {
    if (userInfo && !authError) {
      fetchUsers();
    }
  }, [userInfo, authError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (authError) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--primary-gradient)",
        padding: "40px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "var(--card-background)",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          maxWidth: "400px",
          width: "100%",
          border: "1px solid var(--card-border)"
        }}>
          <h1 style={{ color: "var(--error-color)", marginBottom: "20px" }}>Access Denied</h1>
          <p style={{ color: "var(--text-primary)", marginBottom: "30px" }}>{authError}</p>
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
          👥 User Management
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

        {/* Message Display */}
        {message && (
          <div style={{
            background: messageType === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${messageType === 'success' ? '#34d399' : '#fecaca'}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            <p style={{ 
              color: messageType === 'success' ? '#059669' : '#dc2626', 
              margin: 0, 
              fontWeight: "600" 
            }}>
              {message}
            </p>
          </div>
        )}

        {/* Controls */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <button
            onClick={fetchUsers}
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
            {loading ? 'Loading...' : 'Refresh Users'}
          </button>
        </div>

        {/* Users Table */}
        {!loading && users.length > 0 && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            overflowX: "auto"
          }}>
            <h3 style={{ marginTop: 0, color: "#374151" }}>
              System Users ({users.length} users)
            </h3>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px"
            }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Username</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Role</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Created</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Last Login</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id} style={{
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: index % 2 === 0 ? "#f9fafb" : "white"
                  }}>
                    <td style={{ padding: "12px", fontWeight: "600" }}>
                      {user.username}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {user.email}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {user.firstName} {user.lastName}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "white",
                        backgroundColor: user.role === 'admin' ? '#dc2626' : '#3b82f6'
                      }}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => demoteUser(user.username)}
                          disabled={user._id === userInfo.user_id}
                          style={{
                            padding: "6px 12px",
                            background: user._id === userInfo.user_id ? "#9ca3af" : "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: user._id === userInfo.user_id ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          {user._id === userInfo.user_id ? "You" : "Demote"}
                        </button>
                      ) : (
                        <button
                          onClick={() => promoteUser(user.username)}
                          style={{
                            padding: "6px 12px",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          Promote
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
            <p>Loading users...</p>
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
