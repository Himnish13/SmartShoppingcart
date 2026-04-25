import React, { useEffect, useState } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const TAX_RATE = 0.08;
  const SHIPPING = 0;

  // ─── fetch cart ──────────────────────────────────────────────────────────────
  const fetchCart = async () => {
    try {
      const res = await fetch("http://localhost:3500/cart/items");
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Cart fetch error", err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ─── remove item ─────────────────────────────────────────────────────────────
  const handleRemove = async (barcode, qtyToRemove) => {
    // remove entire line (send quantity equal to current qty)
    setRemoving(barcode);
    try {
      await fetch("http://localhost:3500/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, quantity: qtyToRemove }),
      });
      await fetchCart();
    } catch (err) {
      console.error("❌ Remove error", err);
    } finally {
      setRemoving(null);
    }
  };

  const handleIncrease = async (barcode) => {
    try {
      await fetch("http://localhost:3500/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, quantity: 1 }),
      });
      await fetchCart();
    } catch (err) {
      console.error("❌ Increase error", err);
    }
  };

  const handleDecrease = async (barcode) => {
    try {
      await fetch("http://localhost:3500/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, quantity: 1 }),
      });
      await fetchCart();
    } catch (err) {
      console.error("❌ Decrease error", err);
    }
  };

  // ─── totals ───────────────────────────────────────────────────────────────────
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price_at_scan || 0) * (item.quantity || 1),
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + SHIPPING;

  const fmt = (n) =>
    n.toLocaleString("en-IN", { style: "currency", currency: "INR" });

  return (
    <div className={`cart-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      
      {/* SIDEBAR OPEN BUTTON */}
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
          <button type="button" className="menu-item" onClick={() => navigate("/home")}>
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
            onClick={() => navigate("/explore")}
          >
            <span className="menu-icon">🧭</span>
            <span>Explore</span>
          </button>
          <button
            type="button"
            className="menu-item active"
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
            onClick={() => navigate("/remaining")}
          >
            <span className="menu-icon">📋</span>
            <span>Remaining</span>
          </button>
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/list")}
          >
            <span className="menu-icon">📋</span>
            <span>List</span>
          </button>
          <button type="button" className="menu-item" onClick={() => navigate("/offers")}>
            <span className="menu-icon">🏷️</span>
            <span>Offers</span>
          </button>
        </div>
      </div>

      <div className="cart-content-wrapper">
        {/* ── HEADER ── */}
        <div className="cart-page-header">
          <div className="cart-page-title-wrap">
            <span className="cart-page-icon">🛒</span>
            <h1 className="cart-page-title">
              Your Shopping Cart
              <span className="cart-page-count">
                &nbsp;({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})
              </span>
            </h1>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="cart-page-body">
          {/* ── LEFT: ITEMS LIST ── */}
          <div className="cart-items-panel">
            {loading ? (
              <div className="cart-loading">
                <div className="cart-spinner" />
                <p>Loading cart…</p>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty-icon">🛒</span>
                <h2>Your cart is empty</h2>
                <p>Scan a product to add it here.</p>
                <button
                  className="cart-shop-btn"
                  onClick={() => navigate("/home")}
                  type="button"
                >
                  ← Back to Shopping
                </button>
              </div>
            ) : (
              <div className="cart-list">
                {cartItems.map((item, idx) => (
                  <div className="cart-row" key={item.product_id ?? idx}>
                    {/* index badge */}
                    <span className="cart-row-idx">{idx + 1}</span>

                    {/* product image */}
                    <div className="cart-row-img-wrap">
                      {item.image_url ? (
                        <img
                          className="cart-row-img"
                          src={item.image_url}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="cart-row-img-placeholder">📦</div>
                      )}
                    </div>

                    {/* info */}
                    <div className="cart-row-info">
                      <p className="cart-row-name">{item.name}</p>
                      <p className="cart-row-sub">
                        {item.name} {item.variant ? `— ${item.variant}` : ""}
                      </p>
                      <p className="cart-row-unit">
                        {fmt(parseFloat(item.price_at_scan || 0))} / unit
                      </p>
                    </div>

                    {/* qty controls */}
                    <div className="cart-row-qty-wrap">
                      <button className="cart-qty-btn" type="button" onClick={() => handleDecrease(item.barcode)}>-</button>
                      <span className="cart-row-qty-label">{item.quantity || 1}</span>
                      <button className="cart-qty-btn" type="button" onClick={() => handleIncrease(item.barcode)}>+</button>
                    </div>

                    {/* price */}
                    <p className="cart-row-price">
                      {fmt(
                        parseFloat(item.price_at_scan || 0) * (item.quantity || 1)
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: SUMMARY ── */}
          <aside className="cart-summary">
            <h2 className="cart-summary-title">Cart Summary</h2>

            <div className="cart-summary-rows">
              <div className="cart-summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span className="cart-summary-free">
                  {SHIPPING === 0 ? "₹0.00" : fmt(SHIPPING)}
                </span>
              </div>
              <div className="cart-summary-row">
                <span>
                  Estimated Tax
                </span>
                <span>{fmt(tax)}</span>
              </div>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total">
              <span>Order Total:</span>
              <strong>{fmt(total)}</strong>
            </div>

            <button
              className="cart-continue-btn"
              type="button"
              onClick={() => navigate("/home")}
            >
              ← Continue Shopping
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
