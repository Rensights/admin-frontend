"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient } from "@/lib/api";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedUsers, setExpandedUsers] = useState(false);
  const [expandedDeals, setExpandedDeals] = useState(false);

  const handleLogout = () => {
    adminApiClient.logout();
  };

  // Check if path matches a section
  const isUsersSection = pathname?.startsWith('/users');
  const isDealsSection = pathname?.startsWith('/deals');

  // Auto-expand sections when pathname changes
  useEffect(() => {
    if (isUsersSection) setExpandedUsers(true);
    if (isDealsSection) setExpandedDeals(true);
  }, [pathname, isUsersSection, isDealsSection]);

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { 
      section: 'users',
      icon: '👥',
      label: 'Users',
      children: [
        { path: '/dashboard?tab=users', icon: '📋', label: 'User List' },
        { path: '/dashboard?tab=subscriptions', icon: '💳', label: 'Subscriptions' },
      ]
    },
    { path: '/analysis-requests', icon: '📋', label: 'Analysis Requests' },
    {
      section: 'deals',
      icon: '🔥',
      label: 'Deals',
      children: [
        { path: '/deals', icon: '🔥', label: "Today's Deals" },
        { path: '/available-deals', icon: '✅', label: 'Available Deals' },
        { path: '/deals/archive', icon: '📦', label: 'Archive Deals' },
      ]
    },
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo-section">
          <h1 className="logo">Rensights</h1>
          <p className="logo-subtitle">Admin Panel</p>
        </div>
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if ('section' in item && item.children) {
            const isExpanded = item.section === 'users' ? expandedUsers : expandedDeals;
            const setIsExpanded = item.section === 'users' ? setExpandedUsers : setExpandedDeals;
            const isActive = item.section === 'users' ? isUsersSection : isDealsSection;

            return (
              <div key={item.section} className="nav-section">
                <button
                  className={`nav-item nav-section-header ${isActive ? 'active' : ''}`}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="nav-text">{item.label}</span>
                      <span className="nav-expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    </>
                  )}
                </button>
                {sidebarOpen && isExpanded && (
                  <div className="nav-section-children">
                    {item.children.map((child) => (
                      <button
                        key={child.path}
                        className={`nav-item nav-child-item ${pathname === child.path ? 'active' : ''}`}
                        onClick={() => router.push(child.path)}
                      >
                        <span className="nav-icon">{child.icon}</span>
                        <span className="nav-text">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <button
                key={item.path}
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                onClick={() => router.push(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-text">{item.label}</span>}
              </button>
            );
          }
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn-sidebar">
          <span className="nav-icon">🚪</span>
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
