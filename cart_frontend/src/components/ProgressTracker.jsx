import React from "react";
import "./ProgressTracker.css";

const ProgressTracker = ({ totalItems, completed, items = [] }) => {
  const percentage =
    totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h3>Status</h3>
        <span className="progress-count">
          {completed}/{totalItems}
        </span>
      </div>

      <div className="progress-main">
        <div className="progress-circle">
          <span>{percentage}%</span>
        </div>

        <div className="progress-info-box">
          <div className="mini-card">
            <p>{completed}/{totalItems}</p>
            <span>Items Scanned</span>
          </div>

          <div className="mini-card">
            <p>12 Min</p>
            <span>Approx Time</span>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="items-breakdown">
          {items.slice(0, 4).map((item, index) => (
            <div
              key={index}
              className={`item-compact ${
                item.picked_quantity >= item.quantity ? "completed" : ""
              }`}
            >
              <span className="item-name">
                {item.name?.substring(0, 18)}
              </span>
              <span className="item-qty">
                {item.picked_quantity || 0}/{item.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;