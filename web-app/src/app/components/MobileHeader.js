"use client";
import React, { useEffect } from 'react';
import styles from '../styles/MobileHeader.module.css';
import ThemeToggle from './ThemeToggle';

export default function MobileHeader() {
  // Add body class for proper content padding when header is present
  useEffect(() => {
    document.body.classList.add('has-mobile-header');
    
    return () => {
      document.body.classList.remove('has-mobile-header');
    };
  }, []);
  
  return (
    <header className={styles.mobileHeader}>
      <div className={styles.logoContainer}>
        <h1 className={styles.logo}>DermaCare</h1>
      </div>
      
      <div className={styles.actions}>
        <ThemeToggle />
      </div>
    </header>
  );
}
