"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "../utils/auth";
import ThemeToggle from "../components/ThemeToggle";
import useIsMobile from "../hooks/useIsMobile";
import styles from "./Settings.module.css";

export default function Settings() {
  const isMobile = useIsMobile(768);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    try {
      // Check authentication
      if (!auth.isAuthenticated()) {
        router.push("/login");
        return;
      }

      // Get user data and profile
      loadUserData();
    } catch (error) {
      console.error("Error in settings useEffect:", error);
      setError(error.message);
      setLoading(false);
    }
  }, [router]);

  const loadUserData = async () => {
    try {
      const userData = auth.getCurrentUser();
      setUser(userData);
      
      // Load full user profile from server
      const profile = await auth.getUserProfile();
      setUserProfile(profile);
      
      // Trigger entrance animation
      setTimeout(() => setIsVisible(true), 100);
    } catch (error) {
      console.error("Error loading user data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      auth.logout();
    } catch (error) {
      console.error("Error during logout:", error);
      // Force logout by clearing localStorage and redirecting
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  };

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Settings Error</h2>
          <p className={styles.errorMessage}>
            There was an error loading the settings: {error}
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className={styles.errorButton}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.settingsContainer} ${isVisible ? styles.visible : ''}`}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            {!isMobile && (
              <Link href="/dashboard" className={styles.backLink}>
                ← Back to Dashboard
              </Link>
            )}
            <h1>⚙️ Account Settings</h1>
            <p>Manage your profile and account preferences</p>
          </div>
          <div className={styles.headerRight}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <ThemeToggle />
              <button onClick={handleLogout} className={styles.logoutButton}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Account Information */}
        <div className={styles.accountCard}>
          <h2 className={styles.sectionTitle}>
            👤 Account Information
          </h2>
        
          <div className={styles.profileGrid}>
            {userProfile?.firstName || userProfile?.lastName ? (
              <div className={styles.profileItem}>
                <div className={styles.profileLabel}>Full Name</div>
                <div className={styles.profileValue}>
                  {[userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || 'Not provided'}
                </div>
              </div>
            ) : null}

            <div className={styles.profileItem}>
              <div className={styles.profileLabel}>Username</div>
              <div className={styles.profileValue}>
                {userProfile?.username || user?.username || 'Not available'}
              </div>
            </div>

            <div className={styles.profileItem}>
              <div className={styles.profileLabel}>Email Address</div>
              <div className={styles.profileValue}>
                {user?.email}
              </div>
            </div>

            {userProfile?.created_at && (
              <div className={styles.profileItem}>
                <div className={styles.profileLabel}>Member Since</div>
                <div className={styles.profileValue}>
                  {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Grid */}
        <div className={styles.settingsGrid}>
          {/* Security */}
          <div className={styles.settingCard}>
            <span className={styles.settingIcon}>🔒</span>
            <h3 className={styles.settingTitle}>Security</h3>
            <p className={styles.settingDescription}>
              Manage your password and account security settings.
            </p>
          </div>

          {/* Notifications */}
          <div className={styles.settingCard}>
            <span className={styles.settingIcon}>🔔</span>
            <h3 className={styles.settingTitle}>Notifications</h3>
            <p className={styles.settingDescription}>
              Control how you receive notifications and updates.
            </p>
          </div>

          {/* Privacy */}
          <div className={styles.settingCard}>
            <span className={styles.settingIcon}>🛡️</span>
            <h3 className={styles.settingTitle}>Privacy</h3>
            <p className={styles.settingDescription}>
              Manage your privacy preferences and data settings.
            </p>
          </div>

          {/* Appearance */}
          <div className={styles.settingCard}>
            <span className={styles.settingIcon}>🎨</span>
            <h3 className={styles.settingTitle}>Appearance</h3>
            <p className={styles.settingDescription}>
              Customize the look and feel of your dashboard.
            </p>
          </div>
        </div>

        {/* Account Stats */}
        <div className={styles.statsContainer}>
          <h2 className={styles.sectionTitle}>
            📊 Account Statistics
          </h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{userProfile?.analysis_count || 0}</div>
              <div className={styles.statLabel}>Analyses</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {userProfile?.created_at ? 
                  Math.floor((new Date() - new Date(userProfile.created_at)) / (1000 * 60 * 60 * 24)) : 0}
              </div>
              <div className={styles.statLabel}>Days Active</div>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} ${styles.pulseAnimation}`}>Active</div>
              <div className={styles.statLabel}>Status</div>
            </div>
          </div>
        </div>

        {/* Account Deletion */}
        <div className={styles.deleteAccountContainer}>
          <h2 className={styles.sectionTitle} style={{ color: 'var(--error-color)' }}>🗑️ Delete Account</h2>
          <p className={styles.deleteAccountDescription}>
            Deleting your account is <b>permanent</b> and will remove all your data (analyses, summaries, feedback, etc.) from our system. <br />
            <b>Audit logs</b> will be anonymized for compliance and security. This action cannot be undone.
          </p>
          <button
            className={styles.deleteAccountButton}
            onClick={async () => {
              if (!window.confirm('Are you sure you want to permanently delete your account and all associated data? This cannot be undone.')) return;
              try {
                const res = await fetch('/api/delete-account', { method: 'DELETE', credentials: 'include' });
                if (res.ok) {
                  // Clear local/session storage and redirect
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/goodbye';
                } else {
                  alert('Failed to delete account. Please try again or contact support.');
                }
              } catch (err) {
                alert('Error deleting account: ' + err.message);
              }
            }}
          >
            Delete My Account
          </button>
        </div>
      </main>
    </div>
  );
}