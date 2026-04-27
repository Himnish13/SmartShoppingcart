import React, { useEffect, useMemo, useState } from "react";
import "./CartPage.css";
import "./OffersPage.css";
import { useNavigate } from "react-router-dom";

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMap, setSortMap] = useState({});
  const [globalSort, setGlobalSort] = useState("desc");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const navigate = useNavigate();

  const fetchCartItems = async () => {
    try {
      const res = await fetch("http://localhost:3500/cart/items");
      const data = await res.json();
      setCartItems(data);
    } catch (err) {
      console.log("❌ Cart fetch error", err);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchCartItems();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch("http://localhost:3500/offers");
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Fetch error", e);
      setOffers([]);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return offers;
    return offers.filter((o) =>
      (o.name || "").toLowerCase().includes(q)
    );
  }, [offers, search]);

  const categories = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      const key = o.category_name || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [filtered]);

  const sortList = (arr, dir) => {
    return [...arr].sort((a, b) => {
      if (a.discount === b.discount) {
        return dir === "asc"
          ? (a.price || 0) - (b.price || 0)
          : (b.price || 0) - (a.price || 0);
      }
      return dir === "asc"
        ? a.discount - b.discount
        : b.discount - a.discount;
    });
  };

  const toggleSort = (cat) => {
    setSortMap((prev) => ({
      ...prev,
      [cat]: prev[cat] === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className={`cart-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* SIDEBAR TOGGLE */}
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
          <h2 className="logo">
            <span className="logo-icon">🛒</span> Smart Cart
          </h2>
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
          <button type="button" className="menu-item" onClick={() => navigate("/home")}>
            <span className="menu-icon">🏠</span>
            <span>Home</span>
          </button>
          <button type="button" className="menu-item" onClick={() => navigate("/routing")}>
            <span className="menu-icon">🗺️</span>
            <span>Routes</span>
          </button>
          <button type="button" className="menu-item" onClick={() => navigate("/explore")}>
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
          <button type="button" className="menu-item" onClick={() => navigate("/remaining")}>
            <span className="menu-icon">📋</span>
            <span>Remaining</span>
          </button>
          <button type="button" className="menu-item" onClick={() => navigate("/list")}>
            <span className="menu-icon">📋</span>
            <span>List</span>
          </button>
          <button type="button" className="menu-item active" onClick={() => navigate("/offers")}>
            <span className="menu-icon">🏷️</span>
            <span>Offers</span>
          </button>
        </div>
      </div>

      <div className="cart-content-wrapper">
        <div className="cart-page-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="cart-page-title-wrap">
            <span className="cart-page-icon"></span>
            <h1 className="cart-page-title">Special Offers</h1>
          </div>

          <div className="offers-actions">
            <input
              className="search-input"
              placeholder="Search offers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className={`sort-btn ${globalSort}`}
              onClick={() => setGlobalSort(globalSort === "asc" ? "desc" : "asc")}
            >
              {globalSort === "asc" ? "Sort: Price ↑" : "Sort: Price ↓"}
            </button>
          </div>
        </div>

        <div className="offers-body">

        {/* ALL OFFERS */}
        <section>
          <div className="cart-page-title-wrap" style={{ marginBottom: '1.25rem' }}>
            <h2 className="cart-page-title" style={{ fontSize: '1.5rem' }}>All Offers</h2>
          </div>

          <div className="offers-grid">
            {filtered.length === 0 ? (
              <p className="empty">No offers found</p>
            ) : (
              sortList(filtered, globalSort).map((o) => (
                <div key={o.product_id} className="offer-card">
                  <div className="offer-img-wrapper">
                    <img src={o.image_url} alt={o.name} />
                    <span className="discount-badge-absolute">{o.discount}% OFF</span>
                  </div>

                  <div className="offer-content">
                    <div className="offer-name">{o.name}</div>

                    <div className="offer-row">
                      <span className="price-original">
                        ₹{Number(o.price || 0).toFixed(2)}
                      </span>
                      <span className="price-discounted">
                        ₹{(o.price * (1 - o.discount / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* BY CATEGORY */}
        <section>
          <div className="cart-page-title-wrap" style={{ marginTop: '2.5rem', marginBottom: '1.25rem' }}>
            <h2 className="cart-page-title" style={{ fontSize: '1.5rem' }}>By Category</h2>
          </div>

          {Object.keys(categories).map((cat) => (
            <div key={cat} className="category-block">
              <div className="category-head">
                <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>{cat}</h4>

                <button
                  className={`sort-btn ${sortMap[cat] || "desc"}`}
                  onClick={() => toggleSort(cat)}
                >
                  {sortMap[cat] === "asc" ? "Sort: Price ↑" : "Sort: Price ↓"}
                </button>
              </div>

              <div className="offers-grid">
                {sortList(categories[cat], sortMap[cat] || "desc").map((o) => (
                  <div key={o.product_id} className="offer-card small">
                    <div className="offer-img-wrapper">
                      <img src={o.image_url} alt={o.name} />
                      <span className="discount-badge-absolute">{o.discount}% OFF</span>
                    </div>

                    <div className="offer-content">
                      <div className="offer-name">{o.name}</div>

                      <div className="offer-row">
                        <span className="price-original">
                          ₹{Number(o.price || 0).toFixed(2)}
                        </span>
                        <span className="price-discounted">
                          ₹{(o.price * (1 - o.discount / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        </div>
      </div>
    </div>
  );
};

export default OffersPage;