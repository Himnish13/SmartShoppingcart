import React from "react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Welcome to Admin Panel</h1>
        <p>Manage your Smart Shopping Cart system</p>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>Products</h3>
              <p className="stat-description">Manage inventory</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <h3>Shopping Lists</h3>
              <p className="stat-description">Manage items</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Bills</h3>
              <p className="stat-description">Generate invoices</p>
            </div>
          </div>
        </div>

        <div className="quick-guide">
          <h2>Quick Guide</h2>
          <ul>
            <li>📦 <strong>Products</strong> - Add, edit, or delete products from inventory</li>
            <li>🎁 <strong>Offers</strong> - Create and manage promotional offers</li>
            <li>📝 <strong>Shopping Lists</strong> - Manage customer shopping lists</li>
            <li>🛒 <strong>Carts</strong> - Monitor active carts in real-time</li>
            <li>💰 <strong>Bills</strong> - Generate and print customer bills</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
