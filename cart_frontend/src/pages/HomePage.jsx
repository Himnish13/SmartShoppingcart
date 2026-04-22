import React, { useMemo, useEffect, useRef, useState } from "react";
import "./HomePage.css";
import MapDisplay from "../components/MapDisplay";
import { routingService } from "../services/routing.service";

const HomePage = () => {

  const [popup, setPopup] = useState(null);
  const [barcode, setBarcode] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const lastScannedRef = useRef(null);

  const [mapNodes, setMapNodes] = useState({});
  const [storeLayout, setStoreLayout] = useState(null);
  const [route, setRoute] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [hasBackendPosition, setHasBackendPosition] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);

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

  useEffect(() => {
    fetchCartItems();
    fetchMapData();
    fetchSuggestions();
    fetchShoppingList();
  }, []);

  // ✅ GENERATE STORE ROUTE FOR SHOPPING LIST
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
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
        if (!cancelled) setRoute(data);
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

  // ✅ SCANNER LISTENER
  useEffect(() => {

    const interval = setInterval(async () => {

      try {
        const res = await fetch("http://127.0.0.1:5200/event");
        const data = await res.json();

        // 🚫 ignore duplicate scans
        if (data.barcode && data.barcode === lastScannedRef.current) {
          return;
        }

        if (data.type === "add") {

          if (data.status === "scanning") {
            setPopup("scan");
          }

          else if (data.status === "failed") {
            setPopup("retry");
          }

          else if (data.status === "success") {

            const scannedBarcode = String(data.barcode).trim();

            console.log("📦 SCANNED:", scannedBarcode);

            setPopup("success");
            setBarcode(scannedBarcode);
            lastScannedRef.current = scannedBarcode;

            // 🔥 CALL BACKEND
            try {
              const resAdd = await fetch("http://localhost:3500/cart/add", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  barcode: scannedBarcode,
                  quantity: 1
                }),
              });

              const result = await resAdd.json();

              console.log("🟢 ADD API RESPONSE:", result);

              if (!resAdd.ok) {
                console.log("❌ Add failed:", result);
                setPopup("retry");
                return;
              }

              // ✅ ONLY REFRESH AFTER SUCCESS
              await fetchCartItems();

            } catch (err) {
              console.log("❌ API ERROR:", err);
            }

            // 🔁 reset scan after 2 sec (IMPORTANT)
            setTimeout(() => {
              lastScannedRef.current = null;
            }, 2000);
          }
        }

        // REMOVE FLOW (optional for now)
        if (data.type === "remove") {
          setPopup("remove");
        }

      } catch (err) {
        console.log("⚠️ Event server not running");
      }

    }, 1500);

    return () => clearInterval(interval);

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
    <div className={`home ${fullscreen ? "fullscreen-active" : ""}`}>

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo"><span className="logo-icon">🛒</span> Smart Cart</h2>
        <div className="menu">
          <button type="button" className="menu-item active">
            <span className="menu-icon">🏠</span>
            <span>Home</span>
          </button>
          <button type="button" className="menu-item">
            <span className="menu-icon">🧭</span>
            <span>Explore</span>
          </button>
          <button type="button" className="menu-item">
            <span className="menu-icon">🧺</span>
            <span>ItemsAdded</span>
          </button>
          <button type="button" className="menu-item">
            <span className="menu-icon">📋</span>
            <span>List</span>
          </button>
          <button type="button" className="menu-item">
            <span className="menu-icon">🏷️</span>
            <span>Offers</span>
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
            <h3>Smart suggestions</h3>
            <p className="offer">10% offer on items</p>

            {smartSuggestions.length === 0 ? (
              <p className="empty">No suggestions</p>
            ) : (
              smartSuggestions.map((p) => (
                <div className="suggestion-item" key={p.product_id}>
                  <div className="suggestion-left">
                    <img className="suggestion-img" src={p.image_url} alt={p.name} />
                    <span className="suggestion-name">{p.name}</span>
                  </div>
                  <button type="button">+ Add</button>
                </div>
              ))
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

      {/* POPUPS */}
      {popup === "scan" && <div className="popup">📷 Scan product</div>}
      {popup === "retry" && <div className="popup error">❌ Try again</div>}
      {popup === "success" && <div className="popup success">✅ Added ({barcode})</div>}
      {popup === "remove" && <div className="popup">⚠️ Remove detected</div>}

    </div>
  );
};

export default HomePage;