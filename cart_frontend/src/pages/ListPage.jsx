import React, { useEffect, useMemo, useState } from "react";
import "./CartPage.css";
import "./ReviewListPage.css";
import { useNavigate } from "react-router-dom";

const ListPage = () => {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAutocomplete, setSearchAutocomplete] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const navigate = useNavigate();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

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

  const visibleCategories = useMemo(() => {
    return (categories || []).filter((cat) => {
      const name = String(cat?.category_name || "").trim().toLowerCase();
      return name !== "billing";
    });
  }, [categories]);

  const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Expected JSON`);
    }
  };

  // ✅ FETCH FULL LIST
  const fetchAllList = async ({ updateVisible = selectedCategory === null } = {}) => {
    try {
      const data = await fetchJson("http://localhost:3500/shopping-list/items");
      setAllItems(data);
      if (updateVisible) setItems(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // ✅ FETCH LIST BY CATEGORY
  const fetchListByCategory = async (categoryId) => {
    try {
      const data = await fetchJson(
        `http://localhost:3500/shopping-list/categoryItems/${categoryId}`
      );
      setItems(data);
      return data;
    } catch (err) {
      console.error(err);
      setItems([]);
      return [];
    }
  };

  // ✅ FETCH SUGGESTIONS
  const fetchSuggestions = async (shoppingItems) => {
    try {
      const allProducts = await fetchJson("http://localhost:3500/products");
      const ids = shoppingItems.map((i) => i.product_id);
      const filtered = allProducts.filter((p) => !ids.includes(p.product_id));
      const random = filtered.sort(() => 0.5 - Math.random()).slice(0, 4);
      setSuggestions(random);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      const list = await fetchAllList();
      fetchSuggestions(list);
      try {
        const allProds = await fetchJson("http://localhost:3500/products");
        setAllProducts(allProds);
      } catch (err) {
        console.log(err);
      }
    };
    load();
    fetchCartItems();

    fetchJson("http://localhost:3500/products/categories")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.log(err));
  }, []);

  // ❌ REMOVE
  const removeItem = async (id) => {
    await fetch("http://localhost:3500/shopping-list/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id }),
    });

    const list = await fetchAllList();
    if (selectedCategory !== null) {
      await fetchListByCategory(selectedCategory);
    }
    fetchSuggestions(list);
  };

  // ➕ INCREASE
  const increaseQty = async (id, qty) => {
    const res = await fetch("http://localhost:3500/shopping-list/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id, quantity: qty + 1 }),
    });

    const data = await res.json();
    if (data.status === "insufficient_stock") {
      setStockError({ name: data.product_name, available: data.available_stock });
      return;
    }

    const list = await fetchAllList();
    if (selectedCategory !== null) {
      await fetchListByCategory(selectedCategory);
    }
    fetchSuggestions(list);
  };

  // ➖ DECREASE
  const decreaseQty = async (id, qty) => {
    if (qty === 1) {
      await removeItem(id);
      return;
    }

    await fetch("http://localhost:3500/shopping-list/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id, quantity: qty - 1 }),
    });

    const list = await fetchAllList();
    if (selectedCategory !== null) {
      await fetchListByCategory(selectedCategory);
    }
    fetchSuggestions(list);
  };

  // ➕ ADD FROM SUGGESTIONS
  const addSuggestion = async (item) => {
    const res = await fetch("http://localhost:3500/shopping-list/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: item.product_id,
        quantity: 1,
      }),
    });

    const data = await res.json();
    if (data.status === "insufficient_stock") {
      setStockError({ name: data.product_name, available: data.available_stock });
      return;
    }

    const list = await fetchAllList();
    if (selectedCategory !== null) {
      await fetchListByCategory(selectedCategory);
    }
    fetchSuggestions(list);
  };

  const filteredItems = items.filter((item) => {
    const name = (item?.name ?? "").toString().toLowerCase();
    if (!search.trim()) return true;
    return name.includes(search.trim().toLowerCase());
  });

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    
    if (value.trim().length === 0) {
      setSearchAutocomplete([]);
      setShowAutocomplete(false);
      return;
    }

    const filtered = allProducts.filter((product) =>
      product.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setSearchAutocomplete(filtered.slice(0, 6));
    setShowAutocomplete(true);
  };

  const handleAddSearchResult = async (product) => {
    const res = await fetch("http://localhost:3500/shopping-list/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id,
        quantity: 1,
      }),
    });

    const data = await res.json();
    if (data.status === "insufficient_stock") {
      setStockError({ name: data.product_name, available: data.available_stock });
      return;
    }

    const list = await fetchAllList();
    if (selectedCategory !== null) {
      await fetchListByCategory(selectedCategory);
    }
    fetchSuggestions(list);
    setSearchQuery("");
    setShowAutocomplete(false);
  };

  const handleCategorySelect = async (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      await fetchAllList({ updateVisible: true });
      return;
    }
    await fetchListByCategory(categoryId);
  };

  useEffect(() => {
    if (selectedCategory === null) return;
    const selected = (categories || []).find(
      (c) => Number(c?.category_id) === Number(selectedCategory)
    );
    if (!selected) return;
    const name = String(selected?.category_name || "").trim().toLowerCase();
    if (name === "billing") {
      handleCategorySelect(null);
    }
  }, [categories]);

  return (
    <div className={`cart-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* SIDEBAR OPEN BUTTON */}
      {!sidebarOpen && (
        <button
          type="button"
          className="sidebar-toggle list-page-toggle"
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
            className="menu-item"
            onClick={() => navigate("/remaining")}
          >
            <span className="menu-icon">📋</span>
            <span>Remaining</span>
          </button>
          <button
            type="button"
            className="menu-item active"
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
        <div className="review-container" style={{ width: "100%" }}>
          
          {/* LEFT */}
          <div className="left">
            <div className="header-row">
              <h2>Shopping List</h2>
              <div className="total-items">Total Items : {allItems.length}</div>
            </div>

            <div className="search-row">
              <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M10 18a8 8 0 1 1 5.293-14.002A8 8 0 0 1 10 18Zm11 3-6.2-6.2a9.5 9.5 0 1 0-1.4 1.4L19.6 22 21 21Z"
                />
              </svg>
              <input
                className="search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="category-row">
              <span className="category-label">Category</span>
              <button
                type="button"
                className={`category-pill ${selectedCategory === null ? "active" : ""}`}
                onClick={() => handleCategorySelect(null)}
              >
                All
              </button>
              {visibleCategories.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  className={`category-pill ${
                    Number(selectedCategory) === Number(cat.category_id) ? "active" : ""
                  }`}
                  onClick={() => handleCategorySelect(cat.category_id)}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>

            <div className="items">
              {filteredItems.map((item) => (
                <div key={item.product_id} className="item-card">
                  <div className="item-image">
                    <img src={item.image_url} alt={item.name} />
                  </div>

                  <div className="info">
                    <h4>{item.name}</h4>
                    <p>Quantity : {item.quantity}</p>

                    <div className="qty-controls" aria-label={`Quantity controls for ${item.name}`}>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => decreaseQty(item.product_id, item.quantity)}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="qty-value" aria-label={`Current quantity ${item.quantity}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => increaseQty(item.product_id, item.quantity)}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    className="remove"
                    onClick={() => removeItem(item.product_id)}
                    aria-label={`Remove ${item.name}`}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="right">
            <div className="right-top">
              <h2>Add more items</h2>
              <p>Search or pick from suggestions</p>
            </div>

            <div className="search-product-section">
              <div className="search-product-container">
                <svg className="search-product-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                  <line x1="14" y1="14" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  className="search-product-input"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery && setShowAutocomplete(true)}
                />
                {showAutocomplete && searchAutocomplete.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {searchAutocomplete.map((product) => (
                      <div key={product.product_id} className={`autocomplete-item ${product.stock === 0 ? 'out-of-stock' : ''}`} style={{ opacity: product.stock === 0 ? 0.6 : 1 }}>
                        <div className="autocomplete-item-content">
                          <img src={product.image_url} alt={product.name} className="autocomplete-img" />
                          <div className="autocomplete-text">
                            <div className="autocomplete-name">
                              {product.name}
                              {product.stock === 0 && (
                                <span style={{ color: '#ef4444', fontSize: '10px', marginLeft: '6px', fontWeight: 700 }}>OUT OF STOCK</span>
                              )}
                            </div>
                            <div className="autocomplete-price">Rs. {product.price}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="autocomplete-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.stock > 0) {
                              handleAddSearchResult(product);
                            } else {
                              setSearchQuery("");
                              setShowAutocomplete(false);
                            }
                          }}
                          style={{ background: product.stock === 0 ? '#fee2e2' : undefined, color: product.stock === 0 ? '#ef4444' : undefined }}
                        >
                          {product.stock === 0 ? '×' : '+'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="smart-title">Smart suggestions</div>

            <div className="suggestions">
              {suggestions.map((item) => (
                <div key={item.product_id} className="suggestion-card" style={{ opacity: item.stock === 0 ? 0.6 : 1 }}>
                  <div className="suggestion-left">
                    <div className="suggestion-img">
                      <img src={item.image_url} alt={item.name} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="suggestion-name">{item.name}</span>
                      {item.stock === 0 && (
                        <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: 700 }}>OUT OF STOCK</span>
                      )}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => item.stock > 0 && addSuggestion(item)}
                    disabled={item.stock === 0}
                    style={{ background: item.stock === 0 ? '#ccc' : undefined }}
                  >
                    {item.stock === 0 ? 'No Stock' : '+ Add'}
                  </button>
                </div>
              ))}
            </div>
            
            {/* The Plan Route & Shop button was removed here */}
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

export default ListPage;
