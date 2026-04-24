import React, { useEffect, useState } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";

const RemainingPage = () => {
  const navigate = useNavigate();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [remaining, setRemaining] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

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
    const cartSet = new Set((cartItems || []).map((c) => c.product_id));
    const rem = (shoppingItems || []).filter((s) => !cartSet.has(s.product_id));
    setRemaining(rem);
  }, [shoppingItems, cartItems]);

  const addToCart = async (item) => {
    const barcode = item.barcode;
    if (!barcode) return;
    try {
      await fetch("http://localhost:3500/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, quantity: 1 }),
      });
      // refresh lists
      await fetchCart();
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
    <div className="cart-page">
      <div className="cart-page-header">
        <button className="cart-back-btn" onClick={() => navigate('/home')} type="button">← Back</button>
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

                  <div className="cart-row-qty-wrap">
                    <button className="cart-qty-btn action-decrease" type="button" onClick={() => removeFromShoppingList(item.product_id)}>-</button>
                    <span className="cart-row-qty-label">{item.quantity || 1}</span>
                    <button className="cart-qty-btn action-add" type="button" onClick={() => addToCart(item)}>+</button>
                  </div>
                  <button
                    className="cart-row-remove action-remove"
                    onClick={() => removeFromShoppingList(item.product_id)}
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemainingPage;
