import React, { useEffect, useState } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";

const RemainingPage = () => {
  const navigate = useNavigate();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [remaining, setRemaining] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stockError, setStockError] = useState(null);

  const fetchShopping = async () => {
    try {
      const res = await fetch("http://localhost:3500/shopping-list/items");
      const data = await res.json();
      setShoppingItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setShoppingItems([]);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch("http://localhost:3500/cart/items");
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setCartItems([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      await Promise.all([fetchShopping(), fetchCart()]);
      if (!mounted) return;
      setLoading(false);
    }
    run();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    const cartMap = {};
    (cartItems || []).forEach((c) => {
      cartMap[c.product_id] = (cartMap[c.product_id] || 0) + c.quantity;
    });

    const rem = [];
    (shoppingItems || []).forEach((s) => {
      const cartQty = cartMap[s.product_id] || 0;
      const remainingQty = s.quantity - cartQty;
      if (remainingQty > 0) {
        rem.push({
          ...s,
          remaining_quantity: remainingQty,
          shopping_quantity: s.quantity,
        });
      }
    });
    setRemaining(rem);
  }, [shoppingItems, cartItems]);

  const updateShoppingQty = async (product_id, currentShoppingQty, delta) => {
    const newQty = currentShoppingQty + delta;
    if (newQty <= 0) {
      return removeFromShoppingList(product_id);
    }
    try {
      const res = await fetch("http://localhost:3500/shopping-list/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id, quantity: newQty }),
      });

      const data = await res.json();
      if (data.status === "insufficient_stock") {
        setStockError({ name: data.product_name, available: data.available_stock });
        return;
      }

      await fetchShopping();
    } catch (e) {
      console.error(e);
    }
  };

  const removeFromShoppingList = async (product_id) => {
    try {
      await fetch("http://localhost:3500/shopping-list/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id }),
      });
      await fetchShopping();
    } catch (e) {
      console.error(e);
    }
  };

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
            className="menu-item active"
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
        <div className="cart-page-header">
          <div className="cart-page-title-wrap">
            <span className="cart-page-icon">📋</span>
            <h1 className="cart-page-title">Remaining Items<span className="cart-page-count"> &nbsp;({remaining.length})</span></h1>
          </div>
        </div>

        <div className="cart-page-body">
          <div className="cart-items-panel">
            {loading ? (
              <div className="cart-loading"><div className="cart-spinner"/><p>Loading…</p></div>
            ) : remaining.length === 0 ? (
              <div className="cart-empty"><h2>All items picked</h2><p>You've added everything from your list to the cart.</p></div>
            ) : (
              <div className="cart-list">
                {remaining.map((item, idx) => (
                  <div className="cart-row" key={item.product_id ?? idx}>
                    <span className="cart-row-idx">{idx + 1}</span>

                    <div className="cart-row-img-wrap">
                      {item.image_url ? <img className="cart-row-img" src={item.image_url} alt={item.name} /> : <div className="cart-row-img-placeholder">📦</div>}
                    </div>

                    <div className="cart-row-info">
                      <p className="cart-row-name">{item.name}</p>
                      <p className="cart-row-sub">Aisle: {item.aisle || item.category_name || "?"}</p>
                    </div>

                    <div className="cart-row-qty-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <button 
                        type="button" 
                        style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: 'none', background: '#f3f1ff', color: '#2b2b2b', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        onClick={() => updateShoppingQty(item.product_id, item.shopping_quantity, -1)}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: '650', fontSize: '1rem', color: '#1f1f1f' }}>
                        {item.shopping_quantity}
                      </span>
                      <button 
                        type="button" 
                        style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: 'none', background: '#f3f1ff', color: '#2b2b2b', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        onClick={() => updateShoppingQty(item.product_id, item.shopping_quantity, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      style={{ width: '2.125rem', height: '2.125rem', borderRadius: '0.625rem', border: 'none', background: '#f6d38b', color: '#1f1f1f', fontSize: '1.25rem', cursor: 'pointer', marginLeft: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                      onClick={() => removeFromShoppingList(item.product_id)}
                      type="button"
                      aria-label={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {stockError && (
        <div className="scan-modal-backdrop" onClick={() => setStockError(null)} style={{ zIndex: 10001 }}>
          <div className="scan-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ color: '#1e1b4b', marginBottom: '10px' }}>Insufficient Stock</h3>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>
              Sorry, only <strong>{stockError.available}</strong> units of <strong>{stockError.name}</strong> are available in stock.
            </p>
            <button 
              onClick={() => setStockError(null)}
              style={{ 
                marginTop: '25px', 
                width: '100%', 
                padding: '14px', 
                background: '#5b5bd6', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '10px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default RemainingPage;
