"use client";

import { ThemeProvider } from '../contexts/ThemeContext';
import { SidebarProvider } from './SidebarContext';

export default function ClientWrapper({ children }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </ThemeProvider>
  );
}
