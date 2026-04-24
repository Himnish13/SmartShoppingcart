import React, { useEffect, useMemo, useState } from "react";
import "./ReviewListPage.css";
import { useNavigate, useLocation } from "react-router-dom";

const ReviewListPage = () => {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAutocomplete, setSearchAutocomplete] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const [missingItems, setMissingItems] = useState(
    location.state?.missingItems || []
  );
  const [showMissingPopup, setShowMissingPopup] = useState(
    (location.state?.missingItems || []).length > 0
  );

  const handleCloseMissingPopup = () => {
    setShowMissingPopup(false);
    navigate(".", { replace: true, state: {} });
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
      throw new Error(
        `HTTP ${res.status} ${res.statusText} for ${url}: ${text.slice(0, 200)}`
      );
    }

    try {
      return text ? JSON.parse(text) : null;
    } catch {
      throw new Error(
        `Expected JSON from ${url} but got: ${text.slice(0, 80)}`
      );
    }
  };

  // ✅ FETCH FULL LIST (used for Total Items + Suggestions)
  const fetchAllList = async ({ updateVisible = selectedCategory === null } = {}) => {
    try {
      const data = await fetchJson("http://localhost:3500/shopping-list/items");
      setAllItems(data);
      if (updateVisible) setItems(data);
      return data; // needed for suggestions
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // ✅ FETCH LIST BY CATEGORY (used for the left list when a category is selected)
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

  // ✅ FETCH ALL PRODUCTS FOR SUGGESTIONS
  const fetchSuggestions = async (shoppingItems) => {
    try {
      const allProducts = await fetchJson("http://localhost:3500/products");

      // ❌ remove already added items
      const ids = shoppingItems.map((i) => i.product_id);

      const filtered = allProducts.filter(
        (p) => !ids.includes(p.product_id)
      );

      // ✅ take only few random items
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
      
      // Fetch all products for search autocomplete
      try {
        const allProds = await fetchJson("http://localhost:3500/products");
        setAllProducts(allProds);
      } catch (err) {
        console.log(err);
      }
    };
    load();

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
    await fetch("http://localhost:3500/shopping-list/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id, quantity: qty + 1 }),
    });

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
    await fetch("http://localhost:3500/shopping-list/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: item.product_id,
        quantity: 1,
      }),
    });

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

  // Handle search autocomplete
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
    
    setSearchAutocomplete(filtered.slice(0, 6)); // Limit to 6 suggestions
    setShowAutocomplete(true);
  };

  const handleAddSearchResult = async (product) => {
    await fetch("http://localhost:3500/shopping-list/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id,
        quantity: 1,
      }),
    });

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

  // If Billing was previously selected (e.g., stale state), fall back to All.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  return (
    <div className="review-container">

      {/* LEFT */}
      <div className="left">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/create-list")}
        >
          ← Add More Items
        </button>

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

        <div className="right-indicator" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="right-top">
          <h2>Review your list</h2>
          <p>Check if anything missing in the list</p>
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
                  <div key={product.product_id} className="autocomplete-item">
                    <div className="autocomplete-item-content">
                      <img src={product.image_url} alt={product.name} className="autocomplete-img" />
                      <div className="autocomplete-text">
                        <div className="autocomplete-name">{product.name}</div>
                        <div className="autocomplete-price">Rs. {product.price}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="autocomplete-add-btn"
                      onClick={() => handleAddSearchResult(product)}
                    >
                      +
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
            <div key={item.product_id} className="suggestion-card">

              <div className="suggestion-left">
                <div className="suggestion-img">
                  <img src={item.image_url} alt={item.name} />
                </div>
                <span className="suggestion-name">{item.name}</span>
              </div>

              <button type="button" onClick={() => addSuggestion(item)}>
                + Add
              </button>

            </div>
          ))}
        </div>

        <button className="route-btn" onClick={() => navigate("/routing")}>
          Plan Route & Shop
        </button>

      </div>

      {showMissingPopup && (
        <div className="scan-modal-backdrop" onClick={handleCloseMissingPopup} style={{ zIndex: 9999 }}>
          <div className="scan-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <button className="scan-close" onClick={handleCloseMissingPopup}>
              ✕
            </button>
            <div className="scan-body" style={{ flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
              <div className="scan-info" style={{ width: '100%', margin: 0 }}>
                <div className="scan-header-row" style={{ justifyContent: 'center' }}>
                  <h3 style={{ color: '#b91c1c', fontSize: '1.25rem' }}>Items Not Found</h3>
                </div>
                <div style={{ color: '#666', background: 'transparent', textAlign: 'center', marginTop: '12px' }}>
                  The following items from your list are not available in the store:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', width: '100%' }}>
                  {missingItems.map((mi, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8f8f8', border: '1px solid #eaeaea', borderRadius: '8px' }}>
                      <strong style={{ color: '#333' }}>{mi.name}</strong>
                      <span style={{ color: '#666', fontWeight: 600 }}>Qty: {mi.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="scan-footer" style={{ justifyContent: 'center', marginTop: '16px', borderTop: 'none', padding: '16px' }}>
              <button onClick={handleCloseMissingPopup} style={{ background: '#5b5bd6', color: '#fff', border: 'none', padding: '14px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '1rem' }}>
                Continue to List
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReviewListPage;