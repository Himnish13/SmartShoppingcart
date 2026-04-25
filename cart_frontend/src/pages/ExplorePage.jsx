import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExplorePage.css"; // Custom layout for explore page
import "./HomePage.css"; // Import sidebar styles
import "./CreateListPage.css"; // Import product grid styles

const ExplorePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  
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
      await fetch("http://localhost:3500/shopping-list/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: newQty,
        }),
      });

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
    <div className={`explore-page ${sidebarOpen ? "sidebar-open" : ""}`}>
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
      <div className="center">
        {/* We use create-container styles for the inner layout */}
        <div className="create-container" style={{ padding: "0" }}>
          {/* NAVBAR */}
          <div className="navbar" style={{ paddingTop: "1rem" }}>
            <h2>Explore Store</h2>
            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* CATEGORIES */}
          <h3>Categories</h3>
          <div className="categories">
            <div
              className={`category-card ${selectedCategory === null ? "active" : ""}`}
              onClick={() => fetchByCategory(null)}
            >
              All
            </div>

            {visibleCategories.map((cat) => (
              <div
                key={cat.category_id}
                className={`category-card ${
                  selectedCategory === cat.category_id ? "active" : ""
                }`}
                onClick={() => fetchByCategory(cat.category_id)}
              >
                {cat.category_name}
              </div>
            ))}
          </div>

          {/* PRODUCTS */}
          <div className="products">
            {selectedCategory ? (
              <div className="category-section">
                <h3 className="category-title">
                  {
                    visibleCategories.find(c => c.category_id === selectedCategory)?.category_name
                  }
                </h3>

                <div className="products-grid">
                  {filtered.map((item) => (
                    <div key={item.product_id} className="product-card">
                      <div className="product-card-inner">
                        <div className="image-box">
                          <img src={item.image_url} alt={item.name} />
                        </div>
                        
                        <div className="product-info">
                          <h4 className="product-name">{item.name}</h4>
                          <p className="product-price">Price: ₹{Number(item.price || 0).toFixed(0)}</p>
                          
                          <div className="product-actions">
                            {!cart[item.product_id] ? (
                              <button className="add-btn" onClick={() => addItem(item)}>Add</button>
                            ) : (
                              <div className="qty-control">
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
                  <div key={catId} className="category-section">
                    <h3 className="category-title">
                      {category ? category.category_name : `Category ${catId}`}
                    </h3>
                    <div className="products-grid">
                      {groupedProducts[catId].map((item) => (
                        <div key={item.product_id} className="product-card">
                          <div className="product-card-inner">
                            <div className="image-box">
                              <img src={item.image_url} alt={item.name} />
                            </div>
                            
                            <div className="product-info">
                              <h4 className="product-name">{item.name}</h4>
                              <p className="product-price">Price: ₹{Number(item.price || 0).toFixed(0)}</p>
                              
                              <div className="product-actions">
                                {!cart[item.product_id] ? (
                                  <button className="add-btn" onClick={() => addItem(item)}>Add</button>
                                ) : (
                                  <div className="qty-control">
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
    </div>
  );
};

export default ExplorePage;
