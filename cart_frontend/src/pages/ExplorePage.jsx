import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CartPage.css";
import "./ExplorePage.css";

const ExplorePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stockError, setStockError] = useState(null);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const navigate = useNavigate();

  // Sidebar specific cart items fetch
  const fetchCartItems = async () => {
    try {
      const res = await fetch("http://localhost:3500/cart/items");
      const data = await res.json();
      setCartItems(data);
    } catch (err) {
      console.log("❌ Cart fetch error", err);
    }
  };

  const billingCategoryIds = useMemo(() => {
    const ids = (categories || [])
      .filter((cat) => String(cat?.category_name || "").trim().toLowerCase() === "billing")
      .map((cat) => Number(cat?.category_id))
      .filter(Number.isFinite);
    return new Set(ids);
  }, [categories]);

  const visibleCategories = useMemo(() => {
    return (categories || []).filter(
      (cat) => !billingCategoryIds.has(Number(cat?.category_id))
    );
  }, [categories, billingCategoryIds]);

  // ✅ FETCH ALL PRODUCTS
  const fetchAllProducts = () => {
    fetch("http://localhost:3500/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.log(err));
  };

  // ✅ FETCH CATEGORIES + PRELOAD EXISTING SHOPPING LIST
  useEffect(() => {
    fetch("http://localhost:3500/products/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.log(err));

    fetchAllProducts();
    fetchCartItems();

    fetch("http://localhost:3500/shopping-list/items")
      .then((res) => res.json())
      .then((items) => {
        if (!Array.isArray(items) || items.length === 0) return;
        const preloaded = {};
        items.forEach((p) => {
          preloaded[p.product_id] = { ...p, qty: p.quantity };
        });
        setCart(preloaded);
      })
      .catch(() => {});
  }, []);

  // ✅ FETCH BY CATEGORY
  const fetchByCategory = (id) => {
    if (id && billingCategoryIds.has(Number(id))) {
      fetchAllProducts();
      setSelectedCategory(null);
      return;
    }
    if (!id) {
      fetchAllProducts();
      setSelectedCategory(null);
    } else {
      fetch(`http://localhost:3500/products/category/${id}`)
        .then((res) => res.json())
        .then((data) => setProducts(data))
        .catch((err) => console.log(err));

      setSelectedCategory(id);
    }
  };

  // ➕ ADD (ONLY FIRST TIME)
  const addItem = async (item) => {
    const newQty = 1;
    try {
      const res = await fetch("http://localhost:3500/shopping-list/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: newQty,
        }),
      });

      const data = await res.json();
      if (data.status === "insufficient_stock") {
        setStockError({ name: data.product_name, available: data.available_stock });
        return;
      }

      setCart((prev) => ({
        ...prev,
        [item.product_id]: { ...item, qty: newQty },
      }));
    } catch (err) {
      console.log("Add error:", err);
    }
  };

  // ➕ INCREASE
  const increaseQty = async (id) => {
    const newQty = cart[id].qty + 1;
    try {
      const res = await fetch("http://localhost:3500/shopping-list/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: id,
          quantity: newQty,
        }),
      });

      const data = await res.json();
      if (data.status === "insufficient_stock") {
        setStockError({ name: data.product_name, available: data.available_stock });
        return;
      }

      setCart((prev) => ({
        ...prev,
        [id]: { ...prev[id], qty: newQty },
      }));
    } catch (err) {
      console.log("Update error:", err);
    }
  };

  // ➖ DECREASE
  const decreaseQty = async (id) => {
    const currentQty = cart[id].qty;
    const newQty = currentQty - 1;

    try {
      if (newQty === 0) {
        await fetch("http://localhost:3500/shopping-list/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: id }),
        });

        setCart((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      } else {
        await fetch("http://localhost:3500/shopping-list/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: id,
            quantity: newQty,
          }),
        });

        setCart((prev) => ({
          ...prev,
          [id]: { ...prev[id], qty: newQty },
        }));
      }
    } catch (err) {
      console.log("Decrease error:", err);
    }
  };

  // 🔍 SEARCH
  const filtered = products.filter((p) => {
    if (billingCategoryIds.has(Number(p?.category_id))) return false;
    return String(p?.name || "")
      .toLowerCase()
      .includes(String(search || "").toLowerCase());
  });

  // 🧠 GROUP BY CATEGORY
  const groupedProducts = filtered.reduce((acc, item) => {
    const cat = item.category_id;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

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
            className="menu-item active"
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

      {/* CENTER */}
      <div className="cart-content-wrapper" style={{ padding: 0 }}>
        <div className="explore-page-header" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.75rem' }}>
          <div className="cart-page-title-wrap">
            <span className="cart-page-icon"></span>
            <h1 className="cart-page-title">Explore Store</h1>
          </div>

          <div className="explore-actions">
            <div className="search-box-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="explore-body">
          {/* CATEGORIES */}
          <div className="explore-section">
            <h3 className="section-subtitle">Categories</h3>
            <div className="categories-row">
              <button
                type="button"
                className={`exploreCategory-pill ${selectedCategory === null ? "active" : ""}`}
                onClick={() => fetchByCategory(null)}
              >
                All
              </button>

              {visibleCategories.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  className={`exploreCategory-pill ${
                    selectedCategory === cat.category_id ? "active" : ""
                  }`}
                  onClick={() => fetchByCategory(cat.category_id)}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCTS */}
          <div className="products-container">
            {selectedCategory ? (
              <div className="category-group">
                <div className="category-header">
                  <h3 className="category-name">
                    {visibleCategories.find(c => c.category_id === selectedCategory)?.category_name}
                  </h3>
                </div>

                <div className="explore-grid">
                  {filtered.map((item) => (
                    <div key={item.product_id} className={`explore-card ${item.stock === 0 ? 'out-of-stock' : ''}`}>
                      <div className="explore-card-inner">
                        <div className="explore-image-wrapper">
                          <img src={item.image_url} alt={item.name} />
                          {item.stock === 0 && (
                            <div className="stock-overlay">OUT OF STOCK</div>
                          )}
                        </div>
                        
                        <div className="explore-info">
                          <h4 className="explore-name">{item.name}</h4>
                          <div className="explore-price-row">
                            <span className="explore-price">₹{Number(item.price || 0).toFixed(0)}</span>
                          </div>
                          
                          <div className="explore-actions-footer">
                            {!cart[item.product_id] ? (
                              <button 
                                className="explore-add-btn" 
                                onClick={() => item.stock > 0 && addItem(item)}
                                disabled={item.stock === 0}
                              >
                                {item.stock === 0 ? 'Sold Out' : 'Add to List'}
                              </button>
                            ) : (
                              <div className="explore-qty-control">
                                <button className="qty-btn minus" onClick={() => decreaseQty(item.product_id)}>−</button>
                                <span className="qty-value">{cart[item.product_id].qty}</span>
                                <button className="qty-btn plus" onClick={() => increaseQty(item.product_id)}>+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              Object.keys(groupedProducts).map((catId) => {
                const category = categories.find(
                  (c) => c.category_id === Number(catId)
                );

                if (billingCategoryIds.has(Number(catId))) return null;

                return (
                  <div key={catId} className="category-group">
                    <div className="category-header">
                      <h3 className="category-name">
                        {category ? category.category_name : `Category ${catId}`}
                      </h3>
                    </div>
                    <div className="explore-grid">
                      {groupedProducts[catId].map((item) => (
                        <div key={item.product_id} className={`explore-card ${item.stock === 0 ? 'out-of-stock' : ''}`}>
                          <div className="explore-card-inner">
                            <div className="explore-image-wrapper">
                              <img src={item.image_url} alt={item.name} />
                              {item.stock === 0 && (
                                <div className="stock-overlay">OUT OF STOCK</div>
                              )}
                            </div>
                            
                            <div className="explore-info">
                              <h4 className="explore-name">{item.name}</h4>
                              <div className="explore-price-row">
                                <span className="explore-price">₹{Number(item.price || 0).toFixed(0)}</span>
                              </div>
                              
                              <div className="explore-actions-footer">
                                {!cart[item.product_id] ? (
                                  <button 
                                    className="explore-add-btn" 
                                    onClick={() => item.stock > 0 && addItem(item)}
                                    disabled={item.stock === 0}
                                  >
                                    {item.stock === 0 ? 'Sold Out' : 'Add to List'}
                                  </button>
                                ) : (
                                  <div className="explore-qty-control">
                                    <button className="qty-btn minus" onClick={() => decreaseQty(item.product_id)}>−</button>
                                    <span className="qty-value">{cart[item.product_id].qty}</span>
                                    <button className="qty-btn plus" onClick={() => increaseQty(item.product_id)}>+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
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

export default ExplorePage;
