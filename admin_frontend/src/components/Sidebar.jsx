import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: "📦", label: "Products", path: "/products" },
    { icon: "🎁", label: "Offers", path: "/offers" },
    { icon: "📝", label: "Shopping Lists", path: "/shopping-lists" },
    { icon: "🛒", label: "Carts", path: "/carts" },
    { icon: "💰", label: "Bills", path: "/bills" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar ${sidebarOpen ? "visible" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🔧</span>
            <span>Admin</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="menu">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`menu-item ${
                location.pathname === item.path ? "active" : ""
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Smart Shopping Cart Admin</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
