import React, { useEffect, useMemo, useState } from "react";
import "./RoutingPage.css";
import { useLocation, useNavigate } from "react-router-dom";
import MapDisplay from "../components/MapDisplay";
import ProgressTracker from "../components/ProgressTracker";
import { routingService } from "../services/routing.service";

const ROUTE_CACHE_KEY = "smartcart:lastRoute";

const safeParseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const MapPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [route, setRoute] = useState(() => {
    const fromNav = location.state?.routeData;
    if (fromNav) return fromNav;
    return safeParseJson(sessionStorage.getItem(ROUTE_CACHE_KEY));
  });

  const [crowdData, setCrowdData] = useState(() => {
    const fromNav = location.state?.routeData?.crowd;
    if (fromNav) return fromNav;
    return safeParseJson(sessionStorage.getItem(ROUTE_CACHE_KEY))?.crowd || null;
  });

  const [storeLayout, setStoreLayout] = useState(null);
  const [mapNodes, setMapNodes] = useState({});
  const [currentPosition, setCurrentPosition] = useState(null);
  const [hasBackendPosition, setHasBackendPosition] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [search, setSearch] = useState("");

  // Keep route state in sync with navigation state + persist for refresh.
  useEffect(() => {
    const incoming = location.state?.routeData;
    if (!incoming) return;

    setRoute(incoming);
    setCrowdData(incoming.crowd || null);
    try {
      sessionStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(incoming));
    } catch {
      // ignore
    }
  }, [location.state]);

  // ✅ FETCH MAP DATA
  useEffect(() => {
    let alive = true;

    async function fetchMapData() {
      try {
        const [nodesResponse, layoutResponse] = await Promise.all([
          routingService.fetchMapNodes(),
          routingService.fetchStoreLayout(),
        ]);
        if (!alive) return;
        if (nodesResponse) setMapNodes(nodesResponse);
        if (layoutResponse) setStoreLayout(layoutResponse);
      } catch (err) {
        console.error("Failed to fetch map data:", err);
      }
    }

    fetchMapData();
    return () => {
      alive = false;
    };
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

      const seg =
        segments.find((s) => dist >= s.start && dist <= s.end) || segments[0];
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

      if (
        snapshot &&
        snapshot.x !== null &&
        snapshot.x !== undefined &&
        snapshot.y !== null &&
        snapshot.y !== undefined
      ) {
        setHasBackendPosition(true);
        setCurrentPosition({
          x: snapshot.x,
          y: snapshot.y,
          heading: snapshot.heading,
        });
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

  const routeItems = useMemo(() => {
    if (Array.isArray(route?.items)) return route.items;
    if (Array.isArray(route?.selectedProducts)) return route.selectedProducts;
    return [];
  }, [route]);

  const remainingItems = useMemo(() => {
    return routeItems.filter((i) => {
      const picked = Number(i?.picked_quantity || 0);
      const qty = Number(i?.quantity || 0);
      return qty > picked;
    });
  }, [routeItems]);

  const filteredRemaining = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return remainingItems;
    return remainingItems.filter((i) =>
      String(i?.name || "")
        .toLowerCase()
        .includes(q)
    );
  }, [remainingItems, search]);

  if (!route) {
    return (
      <div className="routing-container">
        <div className="routing-header">
          <button
            type="button"
            className="routing-back-btn"
            onClick={() => navigate("/routing")}
          >
            ← Back
          </button>
          <h1>Map</h1>
          <p>No route found. Generate a route first.</p>
        </div>

        <div className="routing-content">
          <div className="empty-state">
            <button
              type="button"
              className="action-btn"
              onClick={() => navigate("/routing")}
            >
              Go to Route Planner
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`routing-shell ${fullscreen ? "fullscreen-active" : ""}`}>
      {/* LEFT SIDEBAR (5 options) */}
      {!fullscreen && (
        <aside className="routing-sidebar">
          <h2 className="routing-logo">
            <span className="routing-logo-icon">🛒</span> Smart Cart
          </h2>
          <nav className="routing-menu">
            <button
              type="button"
              className="routing-menu-item"
              onClick={() => navigate("/home")}
              title="Home"
            >
              <span className="routing-menu-icon">🏠</span>
              <span>Home</span>
            </button>
            <button
              type="button"
              className="routing-menu-item routing-menu-item-active"
              title="Explore"
            >
              <span className="routing-menu-icon">🧭</span>
              <span>Explore</span>
            </button>
            <button type="button" className="routing-menu-item" title="ItemsAdded">
              <span className="routing-menu-icon">🧺</span>
              <span>ItemsAdded</span>
            </button>
            <button
              type="button"
              className="routing-menu-item"
              onClick={() => navigate("/review-list")}
              title="List"
            >
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

        <div className="routing-map-card" style={{ padding: 0 ,height:490}}>
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
            <div className="routing-card routing-status-card">
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
                        <span
                          className={`density ${
                            density > 0.7
                              ? "high"
                              : density > 0.4
                                ? "medium"
                                : "low"
                          }`}
                        >
                          {Math.round(density * 100)}%
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="routing-muted">No crowd data</p>
              )}

              <div className="routing-actions">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => navigate("/routing")}
                >
                  Modify Route
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
          </section>
        )}
      </main>

      {/* RIGHT PANEL: Items Remaining */}
      {!fullscreen && (
        <aside className="routing-right">
          <div className="routing-search-wrap">
            <span className="routing-search-icon" aria-hidden="true">
              🔎
            </span>
            <input
              className="routing-search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <h3 className="routing-right-title">Upnext:</h3>

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
                      <span className="routing-remaining-qty">
                        Remaining: {remaining}
                      </span>
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

export default MapPage;
