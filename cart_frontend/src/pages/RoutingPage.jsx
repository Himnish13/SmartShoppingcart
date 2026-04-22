import React, { useEffect, useState } from "react";
import "./RoutingPage.css";
import { useNavigate } from "react-router-dom";
import MapDisplay from "../components/MapDisplay";
import ProgressTracker from "../components/ProgressTracker";
import RouteVisualization from "../components/RouteVisualization";
import { routingService } from "../services/routing.service";

const RoutingPage = () => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [crowdData, setCrowdData] = useState(null);
  const [storeLayout, setStoreLayout] = useState(null);
  const [mapNodes, setMapNodes] = useState({});
  const [currentPosition, setCurrentPosition] = useState(null);
  const [hasBackendPosition, setHasBackendPosition] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("select"); // "select" or "route"
  const [fullscreen, setFullscreen] = useState(false);
  const [search, setSearch] = useState("");
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

  // ✅ FETCH MAP DATA
  const fetchMapData = async () => {
    try {
      const [nodesResponse, layoutResponse] = await Promise.all([
        routingService.fetchMapNodes(),
        routingService.fetchStoreLayout(),
      ]);
      if (nodesResponse) setMapNodes(nodesResponse);
      if (layoutResponse) setStoreLayout(layoutResponse);
    } catch (err) {
      console.error("Failed to fetch map data:", err);
    }
  };

  useEffect(() => {
    fetchShoppingList();
    fetchMapData();
  }, []);

  // ✅ LIVE MOVEMENT (smooth playback along the generated path)
  useEffect(() => {
    if (hasBackendPosition) return;
    if (!route?.path || !mapNodes || Object.keys(mapNodes).length === 0) {
      setCurrentPosition(null);
      return;
    }

    const ids = route.path
      .map((id) => (id === null || id === undefined ? null : String(id)))
      .filter(Boolean);

    const points = ids
      .map((id) => mapNodes[id])
      .filter(Boolean)
      .map((n) => ({ x: n.x, y: n.y }));

    if (points.length < 2) {
      setCurrentPosition(null);
      return;
    }

    const segments = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      segments.push({ a, b, len, start: total, end: total + len });
      total += len;
    }

    if (total <= 0) {
      setCurrentPosition(null);
      return;
    }

    const speedUnitsPerSec = 1.25;
    let raf = 0;
    let startTs = 0;
    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const elapsed = (ts - startTs) / 1000;
      const dist = (elapsed * speedUnitsPerSec) % total;

      const seg = segments.find((s) => dist >= s.start && dist <= s.end) || segments[0];
      const t = seg.len > 0 ? (dist - seg.start) / seg.len : 0;
      const x = seg.a.x + (seg.b.x - seg.a.x) * t;
      const y = seg.a.y + (seg.b.y - seg.a.y) * t;
      const heading = Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x);
      setCurrentPosition({ x, y, heading });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [route, mapNodes, hasBackendPosition]);

  // ✅ REALTIME POSITION FROM BACKEND (BLE+IMU fusion)
  useEffect(() => {
    let alive = true;
    let timer = null;

    async function poll() {
      const snapshot = await routingService.fetchCurrentPosition();
      if (!alive) return;

      if (snapshot && snapshot.x !== null && snapshot.x !== undefined && snapshot.y !== null && snapshot.y !== undefined) {
        setHasBackendPosition(true);
        setCurrentPosition({ x: snapshot.x, y: snapshot.y, heading: snapshot.heading });
      } else {
        setHasBackendPosition(false);
      }
    }

    poll();
    timer = setInterval(poll, 300);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
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

      const routeData = await routingService.generateRoute(
        startNode,
        Array.from(selectedItems)
      );

      console.log("✅ Route data received:", routeData);
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

  // ✅ RENDER ROUTE STEP WITH MAP
  const routeItems = Array.isArray(route?.items)
    ? route.items
    : Array.isArray(route?.selectedProducts)
      ? route.selectedProducts
      : [];

  const remainingItems = routeItems.filter((i) => {
    const picked = Number(i?.picked_quantity || 0);
    const qty = Number(i?.quantity || 0);
    return qty > picked;
  });

  const filteredRemaining = (() => {
    const q = search.trim().toLowerCase();
    if (!q) return remainingItems;
    return remainingItems.filter((i) => String(i?.name || "").toLowerCase().includes(q));
  })();

  return (
    <div className={`routing-shell ${fullscreen ? "fullscreen-active" : ""}`}>
      {/* LEFT SIDEBAR (5 options) */}
      {!fullscreen && (
        <aside className="routing-sidebar">
          <h2 className="routing-logo">
            <span className="routing-logo-icon">🛒</span> Smart Cart
          </h2>
          <nav className="routing-menu">
            <button type="button" className="routing-menu-item" onClick={() => navigate("/home")}
              title="Home">
              <span className="routing-menu-icon">🏠</span>
              <span>Home</span>
            </button>
            <button type="button" className="routing-menu-item routing-menu-item-active" title="Explore">
              <span className="routing-menu-icon">🧭</span>
              <span>Explore</span>
            </button>
            <button type="button" className="routing-menu-item" title="ItemsAdded">
              <span className="routing-menu-icon">🧺</span>
              <span>ItemsAdded</span>
            </button>
            <button type="button" className="routing-menu-item" onClick={() => navigate("/review-list")} title="List">
              <span className="routing-menu-icon">📋</span>
              <span>List</span>
            </button>
            <button type="button" className="routing-menu-item" title="Offers">
              <span className="routing-menu-icon">🏷️</span>
              <span>Offers</span>
            </button>
          </nav>
        </aside>
      )}

      {/* CENTER */}
      <main className="routing-main">
        {!fullscreen && (
          <div className="routing-main-header">
            <h1>Explore</h1>
          </div>
        )}

        <div className="routing-map-card">
          <MapDisplay
            storeLayout={storeLayout}
            nodes={mapNodes}
            path={route?.path}
            currentPosition={currentPosition}
            fullscreen={fullscreen}
            onFullscreenToggle={() => setFullscreen(!fullscreen)}
          />
        </div>

        {!fullscreen && (
          <section className="routing-bottom">
            <div className="routing-card">
              <ProgressTracker
                totalItems={route?.totalItems || routeItems.length || 0}
                completed={route?.completed || 0}
                items={routeItems}
              />
            </div>

            <div className="routing-card routing-crowd-card">
              <div className="routing-card-header">
                <h3>Crowd detection</h3>
                <span className="routing-card-sub">Live aisle density</span>
              </div>

              {crowdData ? (
                <div className="routing-crowd-list">
                  {Object.entries(crowdData)
                    .slice(0, 4)
                    .map(([zone, density]) => (
                      <div key={zone} className="routing-crowd-row">
                        <span className="routing-crowd-zone">{zone}</span>
                        <span className={`density ${density > 0.7 ? "high" : density > 0.4 ? "medium" : "low"}`}>
                          {Math.round(density * 100)}%
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="routing-muted">No crowd data</p>
              )}

              <div className="routing-actions">
                <button type="button" className="action-btn secondary" onClick={() => setStep("select")}>
                  Modify Route
                </button>
                <button type="button" className="action-btn primary" onClick={() => navigate("/home")}>
                  Start Shopping
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* RIGHT PANEL: Items Remaining */}
      {!fullscreen && (
        <aside className="routing-right">
          <div className="routing-search-wrap">
            <span className="routing-search-icon" aria-hidden="true">🔎</span>
            <input
              className="routing-search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <h3 className="routing-right-title">Items remaining:</h3>

          {filteredRemaining.length === 0 ? (
            <p className="routing-muted">No remaining items</p>
          ) : (
            <div className="routing-remaining-list">
              {filteredRemaining.slice(0, 8).map((item, idx) => {
                const key = item.product_id || `${item.name}-${idx}`;
                const picked = Number(item?.picked_quantity || 0);
                const qty = Number(item?.quantity || 0);
                const remaining = Math.max(0, qty - picked);
                return (
                  <div key={key} className="routing-remaining-row">
                    <img
                      className="routing-remaining-img"
                      src={item.image_url}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="routing-remaining-info">
                      <strong className="routing-remaining-name">{item.name}</strong>
                      <span className="routing-remaining-qty">Remaining: {remaining}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredRemaining.length > 8 && (
            <div className="routing-more">+{filteredRemaining.length - 8} more</div>
          )}
        </aside>
      )}
    </div>
  );
};

export default RoutingPage;