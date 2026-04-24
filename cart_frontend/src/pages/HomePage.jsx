import React, { useMemo, useEffect, useRef, useState } from "react";
import "./HomePage.css";
import MapDisplay from "../components/MapDisplay";
import { routingService } from "../services/routing.service";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_CACHE_KEY = "smartcart:lastRoute";

const safeParseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const manualRouteRef = useRef(false);

  const [cartItems, setCartItems] = useState([]);

  const lastFetchedNodeRef = useRef(null);

  const [mapNodes, setMapNodes] = useState({});
  const [storeLayout, setStoreLayout] = useState(null);
  const [route, setRoute] = useState(() => {
    const fromNav = location.state?.routeData;
    if (fromNav) return fromNav;
    return safeParseJson(sessionStorage.getItem(ROUTE_CACHE_KEY));
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [hasBackendPosition, setHasBackendPosition] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offers, setOffers] = useState([]);

  // ✅ FETCH CART ITEMS
  const fetchCartItems = async () => {
    try {
      const res = await fetch("http://localhost:3500/cart/items");
      const data = await res.json();
      setCartItems(data);
    } catch (err) {
      console.log("❌ Cart fetch error", err);
    }
  };

  // ✅ FETCH MAP DATA (nodes + aisles)
  const fetchMapData = async () => {
    try {
      const [nodes, layout] = await Promise.all([
        routingService.fetchMapNodes(),
        routingService.fetchStoreLayout(),
      ]);
      setMapNodes(nodes || {});
      setStoreLayout(layout || null);
    } catch (err) {
      console.log("❌ Map fetch error", err);
    }
  };

  // ✅ FETCH PRODUCTS FOR SUGGESTIONS
  const fetchSuggestions = async () => {
    try {
      const res = await fetch("http://localhost:3500/products");
      const all = await res.json();
      setSuggestions(Array.isArray(all) ? all : []);
    } catch (err) {
      console.log("❌ Suggestions fetch error", err);
    }
  };

  // ✅ FETCH SHOPPING LIST (for Upnext + route)
  const fetchShoppingList = async () => {
    try {
      const res = await fetch("http://localhost:3500/shopping-list/items");
      const data = await res.json();
      setShoppingItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("❌ Shopping list fetch error", err);
      setShoppingItems([]);
    }
  };

  // ✅ FETCH OFFERS FROM DB (based on current node)
  const fetchOffers = async (nodeId = 1) => {
    if (lastFetchedNodeRef.current === nodeId) return;

    try {
      const res = await fetch("http://localhost:3500/recommend/near", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentNode: nodeId })
      });
      const data = await res.json();
      setOffers(Array.isArray(data.recommendations) ? data.recommendations : []);
      lastFetchedNodeRef.current = nodeId;
    } catch (err) {
      console.log("❌ Offers fetch error", err);
      setOffers([]);
    }
  };

  // ✅ React to movement and fetch nearby offers
  useEffect(() => {
    if (currentPosition?.nodeId) {
      fetchOffers(currentPosition.nodeId);
    }
  }, [currentPosition?.nodeId]);

  useEffect(() => {
    fetchCartItems();
    fetchMapData();
    fetchSuggestions();
    fetchShoppingList();
    fetchOffers();
  }, []);

  // If we arrived from the route planner, prefer that route and persist it.
  useEffect(() => {
    const incoming = location.state?.routeData;
    if (!incoming) return;

    setRoute(incoming);
    manualRouteRef.current = true;
    try {
      sessionStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(incoming));
    } catch {
      // ignore
    }
  }, [location.state]);

  // ✅ GENERATE STORE ROUTE FOR SHOPPING LIST
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // If we arrived from the route planner with a generated route, don't override it.
        if (manualRouteRef.current) return;

        if (!shoppingItems || shoppingItems.length === 0) {
          setRoute(null);
          return;
        }

        const productIds = shoppingItems
          .map((i) => i.product_id)
          .filter((id) => id !== null && id !== undefined);

        if (productIds.length === 0) {
          setRoute(null);
          return;
        }

        const data = await routingService.generateRoute(1, productIds);
        if (!cancelled) {
          setRoute(data);
          try {
            sessionStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.log("❌ Route generation error", err);
        if (!cancelled) setRoute(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [shoppingItems]);

  const upNextItems = useMemo(() => {
    const raw = shoppingItems;
    if (!Array.isArray(raw)) return [];

    const q = search.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((i) => String(i?.name || "").toLowerCase().includes(q));
  }, [shoppingItems, search]);

  const smartSuggestions = useMemo(() => {
    const inList = new Set((shoppingItems || []).map((i) => i.product_id));
    return (suggestions || []).filter((p) => !inList.has(p.product_id)).slice(0, 2);
  }, [suggestions, shoppingItems]);

  const progress = useMemo(() => {
    const total = shoppingItems?.length || 0;
    if (total === 0) return { total: 0, scanned: 0, percent: 0 };
    const inCart = new Set((cartItems || []).map((i) => i.product_id));
    const scanned = (shoppingItems || []).filter((i) => inCart.has(i.product_id)).length;
    return {
      total,
      scanned,
      percent: Math.round((scanned / total) * 100),
    };
  }, [shoppingItems, cartItems]);

  const approxTimeMin = useMemo(() => {
    if (route?.path?.length) return Math.max(1, Math.round(route.path.length * 0.6));
    return 0;
  }, [route]);

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
      .map((id) => {
        const n = mapNodes[id];
        return n ? { x: n.x, y: n.y, nodeId: parseInt(id, 10) } : null;
      })
      .filter(Boolean);

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
      segments.push({ a, b, len, start: total, end: total + len, nodeId: a.nodeId });
      total += len;
    }

    if (total <= 0) {
      setCurrentPosition(null);
      return;
    }

    const speedUnitsPerSec = 1.25; // store-coordinate units per second (visual playback)
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
      setCurrentPosition({ x, y, heading, nodeId: seg.nodeId });

      // When user is halfway (50%) between aisles, fetch offers for the upcoming aisle
      const nextNodeId = seg.b?.nodeId;
      if (t >= 0.5 && nextNodeId && lastFetchedNodeRef.current !== nextNodeId) {
        fetchOffers(nextNodeId);
      }

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
        setCurrentPosition({ x: snapshot.x, y: snapshot.y, heading: snapshot.heading, nodeId: snapshot.nodeId });
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


  // ✅ REMOVE ITEM
  const removeItem = async (product_id) => {
    try {
      await fetch("http://localhost:3500/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id }),
      });

      fetchCartItems();
    } catch (err) {
      console.log("❌ Remove error", err);
    }
  };

  return (
    <div className={`home ${fullscreen ? "fullscreen-active" : ""} ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

      {/* SIDEBAR OPEN BUTTON (only visible when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <span className="hamburger">
            <span />
            <span />
            <span />
          </span>
        </button>
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? "visible" : ""}`}>
        <div className="sidebar-header">
          <h2 className="logo"><span className="logo-icon">🛒</span> Smart Cart</h2>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
        <div className="menu">
          <button type="button" className="menu-item active">
            <span className="menu-icon">🏠</span>
            <span>Home</span>
          </button>
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/routing")}
          >
            <span className="menu-icon">🗺️</span>
            <span>Routes</span>
          </button>
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/create-list")}
          >
            <span className="menu-icon">🧭</span>
            <span>Explore</span>
          </button>
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/cart")}
            style={{ position: "relative" }}
          >
            <span className="menu-icon">🧺</span>
            <span>ItemsAdded</span>
            {cartItems.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "0.35rem",
                  right: "0.5rem",
                  background: "#22c55e",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  minWidth: "1.25rem",
                  height: "1.25rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 0.3rem",
                  lineHeight: 1,
                }}
              >
                {cartItems.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/review-list")}
          >
            <span className="menu-icon">📋</span>
            <span>List</span>
          </button>
          <button type="button" className="menu-item">
            <span className="menu-icon">🏷️</span>
            <span onClick={() => navigate("/offers")}>Offers</span>
          </button>
        </div>
      </div>

      {/* CENTER */}
      <div className="center">

        <h1>Home</h1>

        <div className="map-wrapper">
          <MapDisplay
            storeLayout={storeLayout}
            nodes={mapNodes}
            path={route?.path}
            currentPosition={currentPosition}
            fullscreen={fullscreen}
            onFullscreenToggle={() => setFullscreen((v) => !v)}
            showLegend={false}
          />
        </div>

        {fullscreen && (
          <div className="map-fullscreen-overlay" role="dialog">
            <div className="overlay-left">
              <MapDisplay
                storeLayout={storeLayout}
                nodes={mapNodes}
                path={route?.path}
                currentPosition={currentPosition}
                fullscreen={true}
                onFullscreenToggle={() => setFullscreen(false)}
                showLegend={true}
              />
            </div>

            <div className="overlay-right">
              <div className="offers-panel">
                <div className="offers-header">
                  <h3>Offers Near You</h3>
                  <button className="close-overlay" onClick={() => setFullscreen(false)}>✕</button>
                </div>

                <div className="offers-list">
                  {offers.length === 0 ? (
                    <p className="empty">No offers available</p>
                  ) : (
                    offers.map((o) => (
                      <div key={o.product_id} className="offer-row">
                        <img src={o.image_url} alt={o.name} />
                        <div className="offer-info">
                          <div className="offer-name">{o.name}</div>
                          <div className="offer-price">₹{Number(o.price || 0).toFixed(2)}</div>
                          <div className="offer-discount">{o.discount}% OFF</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bottom-section">

          <div className="status-box">
            <h3>Status</h3>

            <div className="status-grid">
              <div className="status-progress">
                <p className="status-label">Shopping Progress</p>
                <div className="gauge" aria-label="Shopping progress">
                  <div className="gauge-ring" style={{ "--p": `${progress.percent}` }} />
                  <div className="gauge-center">
                    <strong>{progress.percent}%</strong>
                  </div>
                </div>
              </div>

              <div className="status-stats">
                <div className="stat-card">
                  <strong>{String(progress.scanned).padStart(2, "0")}/{String(progress.total).padStart(2, "0")}</strong>
                  <span>Items Scanned</span>
                </div>
                <div className="stat-card">
                  <strong>{approxTimeMin || 0} Min</strong>
                  <span>Approx Time</span>
                </div>
              </div>
            </div>
          </div>

          <div className="suggestion-box">
            <h3>Offers</h3>
            <p className="offer">Check out our latest deals!</p>

            {offers.length === 0 ? (
              <p className="empty">No offers available</p>
            ) : (
              offers.map((o) => {
                const discountedPrice = (o.price * (1 - o.discount / 100)).toFixed(2);
                return (
                  <div className="suggestion-item" key={o.product_id}>
                    <div className="suggestion-left">
                      <img className="suggestion-img" src={o.image_url} alt={o.name} />
                      <div className="offer-details">
                        <span className="suggestion-name">{o.name}</span>
                        <span className="offer-prices">
                          <span className="offer-original">₹{o.price}</span>
                          <span className="offer-discounted">₹{discountedPrice}</span>
                        </span>
                      </div>
                    </div>
                    <span className="offer-badge">{o.discount}% OFF</span>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right">

        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true">🔎</span>
          <input
            className="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <h3 className="upnext-title">Upnext:</h3>

        {upNextItems.length === 0 ? (
          <p className="empty">No items</p>
        ) : (
          upNextItems.map((item, idx) => {
            const key = item.product_id || `${item.name}-${idx}`;
            const aisleLabel = item.category_name || item.aisle || "?";
            const qtyLabel = item.quantity || 1;

            // Featured first card (matches screenshot)
            if (idx === 0) {
              return (
                <div className="upnext-featured" key={key}>
                  <img
                    className="upnext-featured-img"
                    src={item.image_url}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div className="upnext-featured-info">
                    <div className="upnext-featured-top">
                      <strong className="upnext-name">{item.name}</strong>
                      <span className="aisle-badge">Aisle {aisleLabel}</span>
                    </div>
                    <p className="qty">Quantity: {qtyLabel}</p>
                    <div className="upnext-actions">
                      <button type="button" className="upnext-later">Later</button>
                      <button
                        type="button"
                        className="upnext-remove"
                        onClick={() => item.product_id && removeItem(item.product_id)}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Compact cards for the rest
            return (
              <div className="upnext-compact" key={key}>
                <img
                  className="upnext-compact-img"
                  src={item.image_url}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="upnext-compact-info">
                  <strong className="upnext-name">{item.name}</strong>
                  <p className="qty">Quantity: {qtyLabel}</p>
                </div>
                <button type="button" className="upnext-compact-later">Later</button>
                <button
                  type="button"
                  className="upnext-compact-x"
                  onClick={() => item.product_id && removeItem(item.product_id)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default HomePage;