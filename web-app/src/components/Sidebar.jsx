import React from 'react';
import { FaTachometerAlt, FaUpload, FaHistory, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './sidebar.css';

const navItems = [
  { label: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
  { label: 'Upload Image', icon: <FaUpload />, path: '/dashboard/upload' },
  { label: 'History', icon: <FaHistory />, path: '/dashboard/history' },
  { label: 'Settings', icon: <FaCog />, path: '/dashboard/settings' },
  { label: 'Logout', icon: <FaSignOutAlt />, path: '/logout' },
];

const Sidebar = () => {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">IDP</div>
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.label} className="sidebar-nav-item">
            <a href={item.path} className="sidebar-link">
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
