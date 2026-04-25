import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import "./CartTracking.css";

const CartTracking = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchCarts();
    if (autoRefresh) {
      const interval = setInterval(fetchCarts, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchCarts = async () => {
    try {
      const data = await apiService.getActiveCarts();
      setCarts(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Failed to load cart data");
      setCarts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#28a745";
      case "inactive":
        return "#6c757d";
      case "in-transit":
        return "#ffc107";
      default:
        return "#6b63c6";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "🟢 Active";
      case "inactive":
        return "⚪ Inactive";
      case "in-transit":
        return "🟡 In Transit";
      default:
        return "❓ Unknown";
    }
  };

  return (
    <div className="cart-tracking-page">
      <div className="page-header">
        <h1>🛒 Cart Tracking</h1>
        <div className="header-controls">
          <label className="refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh
          </label>
          <button className="refresh-btn" onClick={fetchCarts}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tracking-container">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Loading cart data...
          </div>
        ) : carts.length === 0 ? (
          <div className="empty-state">
            <p>No active carts at the moment</p>
          </div>
        ) : (
          <>
            <div className="stats-bar">
              <div className="stat">
                <span className="stat-label">Total Carts</span>
                <span className="stat-value">{carts.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Active</span>
                <span className="stat-value" style={{ color: "#28a745" }}>
                  {carts.filter((c) => c.status === "active").length}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">In Transit</span>
                <span className="stat-value" style={{ color: "#ffc107" }}>
                  {carts.filter((c) => c.status === "in-transit").length}
                </span>
              </div>
            </div>

            <div className="carts-grid">
              {carts.map((cart) => (
                <div
                  key={cart.id}
                  className="cart-card"
                  style={{
                    borderLeftColor: getStatusColor(cart.status),
                  }}
                >
                  <div className="cart-header">
                    <h3>Cart {cart.id}</h3>
                    <span className="status-badge">
                      {getStatusLabel(cart.status)}
                    </span>
                  </div>

                  <div className="cart-details">
                    <div className="detail-row">
                      <span className="label">Location:</span>
                      <span className="value">
                        {cart.location || "Not available"}
                      </span>
                    </div>

                    {cart.last_seen && (
                      <div className="detail-row">
                        <span className="label">Last Seen:</span>
                        <span className="value">
                          {new Date(cart.last_seen).toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {cart.customer_name && (
                      <div className="detail-row">
                        <span className="label">Customer:</span>
                        <span className="value">{cart.customer_name}</span>
                      </div>
                    )}

                    {cart.items_count !== undefined && (
                      <div className="detail-row">
                        <span className="label">Items:</span>
                        <span className="value">{cart.items_count}</span>
                      </div>
                    )}

                    {cart.total_value && (
                      <div className="detail-row">
                        <span className="label">Value:</span>
                        <span className="value">₹{cart.total_value}</span>
                      </div>
                    )}

                    {cart.battery_level !== undefined && (
                      <div className="detail-row">
                        <span className="label">Battery:</span>
                        <div className="battery-bar">
                          <div
                            className="battery-fill"
                            style={{
                              width: `${cart.battery_level}%`,
                              backgroundColor:
                                cart.battery_level > 50
                                  ? "#28a745"
                                  : cart.battery_level > 20
                                  ? "#ffc107"
                                  : "#dc3545",
                            }}
                          />
                        </div>
                        <span className="battery-text">{cart.battery_level}%</span>
                      </div>
                    )}
                  </div>

                  {cart.notes && (
                    <div className="cart-notes">
                      <strong>Notes:</strong> {cart.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartTracking;
