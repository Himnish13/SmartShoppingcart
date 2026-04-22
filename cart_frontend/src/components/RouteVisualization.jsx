import React from "react";
import "./RouteVisualization.css";

const RouteVisualization = ({ route, items, storeLayout }) => {
  if (!route || route.length === 0) {
    return (
      <div className="route-visualization">
        <div className="no-route">No route generated yet</div>
      </div>
    );
  }

  return (
    <div className="route-visualization">
      <div className="route-header">
        <h3>Route Stops</h3>
        <span className="route-length">{route.length}</span>
      </div>

      <div className="route-simple-list">
        {route.map((node, index) => (
          <div key={index} className="route-row">
            <div className="route-dot" />
            <span>Stop {index + 1}</span>
          </div>
        ))}
      </div>

      {storeLayout?.aisles && (
        <div className="aisles-summary">
          <h4>Aisles</h4>
          <div className="aisles-grid">
            {storeLayout.aisles.map((a) => (
              <div key={a.category_id} className="aisle-card">
                {a.aisle_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteVisualization;