"use client";

import { useRouter, usePathname } from "next/navigation";
import { adminApiClient } from "@/lib/api";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    adminApiClient.logout();
  };

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Overview' },
    { path: '/analysis-requests', icon: '📋', label: 'Analysis Requests' },
    { path: '/deals', icon: '🔥', label: "Today's Deals" },
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
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            onClick={() => router.push(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {sidebarOpen && <span className="nav-text">{item.label}</span>}
          </button>
        ))}
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

