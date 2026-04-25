import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: "📦",
      title: "Products",
      description: "Add, edit, delete & manage product inventory",
      path: "/products",
      color: "#FF6B6B"
    },
    {
      icon: "🎁",
      title: "Offers",
      description: "Create and manage promotional discounts",
      path: "/offers",
      color: "#FF9F43"
    },
    {
      icon: "📝",
      title: "Shopping Lists",
      description: "Manage customer shopping lists & items",
      path: "/shopping-lists",
      color: "#54A0FF"
    },
    {
      icon: "🛒",
      title: "Carts",
      description: "Monitor active carts & real-time tracking",
      path: "/carts",
      color: "#48DBFB"
    },
    {
      icon: "💰",
      title: "Bills",
      description: "Generate & print customer invoices",
      path: "/bills",
      color: "#1ABC9C"
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Smart Shopping Cart Admin</h1>
          <p>Manage your entire system from one place</p>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="features-section">
          <h2 className="section-title">✨ Management Features</h2>
          <div className="features-grid">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="feature-card"
                onClick={() => navigate(feature.path)}
                style={{ "--accent-color": feature.color }}
              >
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">{feature.icon}</div>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-arrow">→</div>
              </div>
            ))}
          </div>
        </section>

        <section className="info-section">
          <div className="info-card">
            <h3>📚 How to Use</h3>
            <ul>
              <li><strong>Products:</strong> Manage your product database - add new items, update details, control inventory</li>
              <li><strong>Offers:</strong> Create promotional discounts and special deals for products</li>
              <li><strong>Shopping Lists:</strong> View and manage customer shopping lists in real-time</li>
              <li><strong>Carts:</strong> Track active shopping carts and monitor customer activity</li>
              <li><strong>Bills:</strong> Generate itemized invoices and print customer receipts</li>
            </ul>
          </div>

          <div className="info-card stats-card">
            <h3>🎯 Quick Stats</h3>
            <div className="stats-mini">
              <div className="mini-stat">
                <span className="stat-value">5</span>
                <span className="stat-label">Features</span>
              </div>
              <div className="mini-stat">
                <span className="stat-value">24/7</span>
                <span className="stat-label">Available</span>
              </div>
              <div className="mini-stat">
                <span className="stat-value">∞</span>
                <span className="stat-label">Scalable</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
