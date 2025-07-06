import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingChatbot from "./components/FloatingChatbot";
import ClientWrapper from "./components/ClientWrapper";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";
import HamburgerButton from "./components/HamburgerButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DermaScope - AI-powered Skin Analysis",
  description: "Advanced skin disease detection and analysis powered by AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientWrapper>
          <div className="app-container">
            <HamburgerButton />
            <Sidebar />
            <main className="page-content">
              {children}
            </main>
            <FloatingChatbot />
          </div>
        </ClientWrapper>
      </body>
    </html>
  );
}
