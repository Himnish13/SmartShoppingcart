import React, { useEffect, useState } from "react";
import "./RoutingPage.css";
import { useNavigate } from "react-router-dom";
import { routingService } from "../services/routing.service";

const ROUTE_CACHE_KEY = "smartcart:lastRoute";
const ROUTE_PRODUCTS_KEY = "smartcart:lastRouteProductIds";

const RoutingPage = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  // ✅ FETCH SHOPPING LIST ITEMS AND CART ITEMS
  const fetchShoppingList = async () => {
    try {
      const [shopData, cartData] = await Promise.all([
        fetchJson("http://localhost:3500/shopping-list/items"),
        fetchJson("http://localhost:3500/cart/items").catch(() => [])
      ]);

      const cartMap = {};
      (cartData || []).forEach((c) => {
        cartMap[c.product_id] = (cartMap[c.product_id] || 0) + c.quantity;
      });

      const rem = [];
      (shopData || []).forEach((s) => {
        const cartQty = cartMap[s.product_id] || 0;
        const remainingQty = s.quantity - cartQty;
        if (remainingQty > 0) {
          rem.push({
            ...s,
            remaining_quantity: remainingQty,
            shopping_quantity: s.quantity,
            quantity: remainingQty, // Override for display and routing
          });
        }
      });

      setItems(rem);
      if (rem.length > 0) {
        setSelectedItems(new Set(rem.map(item => item.product_id)));
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

      console.log(
        "📍 Generating route for products:",
        Array.from(selectedItems)
      );

      const routeData = await routingService.generateRoute(
        startNode,
        Array.from(selectedItems)
      );

      console.log("✅ Route data received:", routeData);

      try {
        sessionStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(routeData));
        sessionStorage.setItem(
          ROUTE_PRODUCTS_KEY,
          JSON.stringify(Array.from(selectedItems))
        );
      } catch {
        // ignore
      }

      navigate("/home", { state: { routeData } });
    } catch (err) {
      console.error("❌ Full error:", err);
      setError(err.message || "Failed to generate route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="routing-container">
      <div className="routing-header">
        <div className="routing-header-buttons">
          <button
            type="button"
            className="routing-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
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
        <div className="routing-header-text">
          <h1>Plan Your Shopping Route</h1>
          <p>Select products you want to visit</p>
        </div>
      </div>

      <div className="routing-content">
        <div className="selection-panel">
          <div className="selection-header">
            <h2>
              Shopping Items ({selectedItems.size} / {items.length})
            </h2>
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
                    <span className="section-badge">
                      Aisle {item.aisle || "?"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
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
};

export default RoutingPage;