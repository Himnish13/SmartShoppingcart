import React, { useEffect, useState } from "react";
import "./RoutingPage.css";
import { useNavigate } from "react-router-dom";

const RoutingPage = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [crowdData, setCrowdData] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState("select"); // "select" or "route"
  const navigate = useNavigate();

  const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    const text = await res.text();

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ${res.statusText} for ${url}: ${text.slice(0, 200)}`
      );
    }

    try {
      return text ? JSON.parse(text) : null;
    } catch {
      throw new Error(
        `Expected JSON from ${url} but got: ${text.slice(0, 80)}`
      );
    }
  };

  // ✅ FETCH SHOPPING LIST ITEMS
  const fetchShoppingList = async () => {
    try {
      const data = await fetchJson("http://localhost:3500/shopping-list/items");
      setItems(data);
      if (data.length > 0) {
        setSelectedItems(new Set(data.map(item => item.product_id)));
        setSelectAll(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load shopping list");
    }
  };

  useEffect(() => {
    fetchShoppingList();
  }, []);

  // ✅ HANDLE SELECT ALL
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(items.map(item => item.product_id));
      setSelectedItems(allIds);
      setSelectAll(true);
    }
  };

  // ✅ HANDLE INDIVIDUAL ITEM SELECTION
  const handleItemToggle = (productId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === items.length);
  };

  // ✅ GENERATE ROUTE
  const handleGenerateRoute = async () => {
    if (selectedItems.size === 0) {
      setError("Please select at least one product");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const startNode = 1; // Starting point (entrance)

      console.log("📍 Generating route for products:", Array.from(selectedItems));

      const response = await fetch("http://localhost:3500/routing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNode: startNode,
          productIds: Array.from(selectedItems),
        }),
      });

      console.log("🔄 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Backend error:", errorData);
        throw new Error(errorData.message || "Failed to generate route");
      }

      const routeData = await response.json();
      console.log("✅ Route generated:", routeData);
      setRoute(routeData);
      setCrowdData(routeData.crowd);
      setStep("route");
    } catch (err) {
      console.error("❌ Full error:", err);
      setError(err.message || "Failed to generate route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ RENDER SELECTION STEP
  if (step === "select") {
    return (
      <div className="routing-container">
        <div className="routing-header">
          <button 
            type="button"
            className="routing-back-btn"
            onClick={() => navigate("/review-list")}
          >
            ← Back
          </button>
          <h1>Plan Your Shopping Route</h1>
          <p>Select products you want to visit</p>
        </div>

        <div className="routing-content">
          <div className="selection-panel">
            <div className="selection-header">
              <h2>Shopping Items ({selectedItems.size} / {items.length})</h2>
              <button
                type="button"
                className={`select-all-btn ${selectAll ? "active" : ""}`}
                onClick={handleSelectAll}
              >
                {selectAll ? "✓ Deselect All" : "Select All"}
              </button>
            </div>

            {items.length === 0 ? (
              <div className="empty-state">
                <p>No items in your shopping list</p>
                <button 
                  type="button"
                  className="action-btn"
                  onClick={() => navigate("/create-list")}
                >
                  Add Items
                </button>
              </div>
            ) : (
              <div className="items-list">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className={`selection-item ${
                      selectedItems.has(item.product_id) ? "selected" : ""
                    }`}
                    onClick={() => handleItemToggle(item.product_id)}
                  >
                    <div className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.product_id)}
                        onChange={() => handleItemToggle(item.product_id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="item-image">
                      <img src={item.image_url} alt={item.name} />
                    </div>

                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity}</p>
                    </div>

                    <div className="item-section">
                      <span className="section-badge">Aisle {item.aisle || "?"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="selection-actions">
              <button
                type="button"
                className="action-btn secondary"
                onClick={() => navigate("/review-list")}
              >
                Back to Review
              </button>
              <button
                type="button"
                className={`action-btn primary ${
                  selectedItems.size === 0 || loading ? "disabled" : ""
                }`}
                onClick={handleGenerateRoute}
                disabled={selectedItems.size === 0 || loading}
              >
                {loading ? "Generating Route..." : "Generate Route"}
              </button>
            </div>
          </div>

          <div className="routing-info-panel">
            <div className="info-card">
              <h3>Route Optimization</h3>
              <p>Our AI calculates the most efficient path based on:</p>
              <ul>
                <li>✓ Product locations in store</li>
                <li>✓ Current crowd density</li>
                <li>✓ Walking distance</li>
                <li>✓ Store layout</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Selected Items</h3>
              <p className="selected-count">{selectedItems.size} items selected</p>
              <p className="info-text">
                {selectAll
                  ? "All items in your shopping list are selected for routing."
                  : "You can select all items at once or choose specific products."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ RENDER ROUTE STEP
  return (
    <div className="routing-container">
      <div className="routing-header">
        <button 
          type="button"
          className="routing-back-btn"
          onClick={() => setStep("select")}
        >
          ← Back to Selection
        </button>
        <h1>Your Shopping Route</h1>
        <p>Follow the route for an optimized shopping experience</p>
      </div>

      <div className="route-content">
        <div className="route-display">
          <div className="route-map">
            <div className="map-placeholder">
              <svg viewBox="0 0 400 300" className="store-map">
                {/* Simple store layout */}
                <rect x="10" y="10" width="380" height="280" fill="#f5f5f5" stroke="#999" strokeWidth="2" />
                
                {/* Aisles */}
                {[1, 2, 3, 4, 5].map((aisle) => (
                  <g key={aisle}>
                    <line
                      x1={50 + aisle * 60}
                      y1="40"
                      x2={50 + aisle * 60}
                      y2="260"
                      stroke="#ddd"
                      strokeWidth="1"
                    />
                    <text
                      x={50 + aisle * 60}
                      y="35"
                      textAnchor="middle"
                      fontSize="12"
                      fill="#666"
                    >
                      A{aisle}
                    </text>
                  </g>
                ))}

                {/* Start point */}
                <circle cx="20" cy="150" r="8" fill="#6159c9" />
                <text x="20" y="180" textAnchor="middle" fontSize="12" fill="#666">
                  START
                </text>

                {/* Route path */}
                {route?.path && route.path.length > 1 && (
                  <polyline
                    points={route.path.map(node => `${node.x || 100},${node.y || 150}`).join(" ")}
                    fill="none"
                    stroke="#f6d38b"
                    strokeWidth="3"
                    opacity="0.7"
                  />
                )}
              </svg>
            </div>
          </div>

          <div className="route-details">
            <div className="route-info-card">
              <h3>📍 Route Information</h3>
              <div className="route-stat">
                <span>Type:</span>
                <strong>{route?.type === "multi" ? "Multi-Location Route" : "Single Location Route"}</strong>
              </div>
              <div className="route-stat">
                <span>Stops:</span>
                <strong>{route?.targets?.length || 0} locations</strong>
              </div>
              <div className="route-stat">
                <span>Total Steps:</span>
                <strong>{route?.path?.length || 0}</strong>
              </div>
            </div>

            <div className="route-info-card">
              <h3>👥 Crowd Data</h3>
              {crowdData ? (
                <>
                  <div className="crowd-info">
                    {Object.entries(crowdData).map(([zone, density]) => (
                      <div key={zone} className="crowd-zone">
                        <span className="zone-name">{zone}:</span>
                        <span className={`density ${density > 0.7 ? "high" : density > 0.4 ? "medium" : "low"}`}>
                          {Math.round(density * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p>No crowd data available</p>
              )}
            </div>

            <div className="route-info-card">
              <h3>🛒 Selected Products ({selectedItems.size})</h3>
              <div className="selected-items-preview">
                {items
                  .filter(item => selectedItems.has(item.product_id))
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.product_id} className="preview-item">
                      <img src={item.image_url} alt={item.name} />
                      <span title={item.name}>{item.name}</span>
                    </div>
                  ))}
                {selectedItems.size > 5 && (
                  <div className="preview-item more">
                    +{selectedItems.size - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="route-actions">
          <button
            type="button"
            className="action-btn secondary"
            onClick={() => setStep("select")}
          >
            Modify Selection
          </button>
          <button
            type="button"
            className="action-btn primary"
            onClick={() => navigate("/home")}
          >
            Start Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoutingPage;
