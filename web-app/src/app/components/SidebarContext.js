"use client";
import { createContext, useContext, useState, useEffect } from "react";

// Create context with default values to avoid null checks
const SidebarContext = createContext({
  sidebarOpen: false,
  openSidebar: () => {},
  closeSidebar: () => {},
  toggleSidebar: () => {}
});

export function SidebarProvider({ children }) {
  // Initialize sidebar as closed by default
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Debug state changes
  useEffect(() => {
    console.log('SidebarContext state changed:', sidebarOpen);
  }, [sidebarOpen]);
  
  // Effect to handle initial state
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      console.log('SidebarContext initialized');
      
      // Listen for window resize events only - don't change state
      window.addEventListener('resize', () => {
        console.log('Window resized');
      });
      
      return () => {
        window.removeEventListener('resize', () => {});
      };
    }
  }, []);
  
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((v) => !v);
  
  return (
    <SidebarContext.Provider value={{ sidebarOpen, openSidebar, closeSidebar, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
