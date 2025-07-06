"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Sidebar.module.css";
import { useSidebar } from "./SidebarContext";

const navLinks = [
  { 
    href: "/dashboard", 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ), 
    label: "Dashboard" 
  },
  { 
    href: "/upload-image", 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
        <line x1="16" y1="5" x2="22" y2="5" />
        <line x1="19" y1="2" x2="19" y2="8" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ), 
    label: "Upload Image" 
  },
  { 
    href: "/image-history", 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ), 
    label: "Analysis History" 
  },
  { 
    href: "/settings", 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ), 
    label: "Account Settings" 
  },
];

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const pathname = usePathname();

  // Debug sidebar state
  useEffect(() => {
    console.log('Sidebar component - sidebarOpen:', sidebarOpen);
  }, [sidebarOpen]);

  // Close sidebar on route change, but not on initial render
  useEffect(() => {
    if (pathname) {
      console.log('Route changed to:', pathname);
    }
  }, [pathname, closeSidebar]);

  return (
    <div className={styles.sidebarContainer}>
      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}
      
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}
        aria-hidden={!sidebarOpen}
      >
        <div className={styles.sidebarHeader}>
          <button
            className={styles.toggleBtn}
            aria-label="Close sidebar"
            onClick={closeSidebar}
            tabIndex={sidebarOpen ? 0 : -1}
          >
            <span className={styles.closeIcon}>×</span>
          </button>
          <h1 className={styles.sidebarTitle}>DermaScope</h1>
        </div>
        
        <div className={styles.separator}></div>
        
        <nav aria-label="Main Navigation">
          <ul className={styles.navList}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href} className={styles.navItem}>
                  <Link
                    href={link.href}
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        closeSidebar();
                      }
                    }}
                  >
                    <span className={styles.icon}>{link.icon}</span>
                    <span className={styles.label}>{link.label}</span>
                    {isActive && <span className={styles.activeIndicator}></span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className={styles.sidebarFooter}>
          <div className={styles.footerContent}>
            <p>DermaScope v2.0</p>
            <p className={styles.footerSubtext}>AI-powered skin analysis</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
