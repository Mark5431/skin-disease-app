"use client";
import React, { useEffect } from 'react';
import { useSidebar } from './SidebarContext';
import styles from '../styles/HamburgerButton.module.css';

export default function HamburgerButton() {
  const { sidebarOpen, toggleSidebar, openSidebar } = useSidebar();
  
  // No debugging logs needed in production
  
  // Direct, simplified click handler
  const handleClick = () => {
    openSidebar();
  };
  
  return (
    <button 
      className={`${styles.hamburgerButton} ${sidebarOpen ? styles.hidden : ''}`}
      onClick={handleClick}
      type="button"
      aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
    >
      <div className={`${styles.hamburgerIcon} ${sidebarOpen ? styles.active : ''}`}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
  );
}
