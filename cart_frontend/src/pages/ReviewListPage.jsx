import React, { useEffect, useMemo, useState } from "react";
import "./ReviewListPage.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useScan } from "../context/ScanContext";

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
  const { isShoppingOosDisabled } = useScan();

  const [missingItems, setMissingItems] = useState(
    (location.state?.missingItems || []).map(it => ({ ...it, feedback: "" }))
  );
  const [showMissingPopup, setShowMissingPopup] = useState(
    (location.state?.missingItems || []).length > 0
  );
  const [ambiguousItems, setAmbiguousItems] = useState(
    location.state?.ambiguousItems || []
  );
  const [showAmbiguousPopup, setShowAmbiguousPopup] = useState(
    (location.state?.ambiguousItems || []).length > 0
  );
  const [stockError, setStockError] = useState(null);

  const handleCloseMissingPopup = () => {
    setShowMissingPopup(false);
    // If we have ambiguous items, show that popup next
    if (ambiguousItems.length > 0) {
      setShowAmbiguousPopup(true);
    } else {
      navigate(".", { replace: true, state: {} });
    }
  };

  const handleCloseAmbiguousPopup = () => {
    setShowAmbiguousPopup(false);
    // If we now have missing items (possibly from skipping), show that popup
    if (missingItems.length > 0) {
      setShowMissingPopup(true);
    } else {
      navigate(".", { replace: true, state: {} });
    }
  };

  const handleFeedbackChange = (idx, value) => {
    setMissingItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], feedback: value };
      return updated;
    });
  };

  const submitMissingFeedback = async () => {
    try {
      const promises = missingItems.map(item => 
        fetch("http://localhost:3500/feedback/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_name: item.name,
            product_id: item.product_id || null,
            message: item.feedback
          })
        })
      );
      
      await Promise.all(promises);
      handleCloseMissingPopup();
    } catch (err) {
      console.error("Feedback submission error:", err);
      // Still close the popup even if feedback fails
      handleCloseMissingPopup();
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

    // ❌ OUT OF STOCK → SHOW POPUP
    if (data.status === "out_of_stock") {
      setMissingItems(prev => [
        ...prev,
        { name: data.product_name, qty: 1, feedback: "" }
      ]);
      setShowMissingPopup(true);
      return;
    }

    if (data.status === "insufficient_stock") {
      setStockError({ name: data.product_name, available: data.available_stock });
      return;
    }

    // ✅ NORMAL FLOW
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

  const handleSelectAmbiguous = async (enteredName, product, qty) => {
    try {
      const res = await fetch("http://localhost:3500/shopping-list/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.product_id,
          quantity: qty || 1,
        }),
      });

      const data = await res.json();
      if (data.status === "insufficient_stock") {
        setStockError({ name: data.product_name, available: data.available_stock });
        return;
      }

      // Remove this item from the ambiguous list
      setAmbiguousItems(prev => {
        const updated = prev.filter(item => item.enteredName !== enteredName);
        if (updated.length === 0) {
          setShowAmbiguousPopup(false);
          navigate(".", { replace: true, state: {} });
        }
        return updated;
      });

      const list = await fetchAllList();
      if (selectedCategory !== null) {
        await fetchListByCategory(selectedCategory);
      }
      fetchSuggestions(list);
    } catch (err) {
      console.error("Select ambiguous error:", err);
    }
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
            <div
              key={item.product_id}
              className={`item-card ${isShoppingOosDisabled(item.product_id) ? "out-of-stock" : ""}`}
            >
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
                    disabled={isShoppingOosDisabled(item.product_id)}
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
                    disabled={isShoppingOosDisabled(item.product_id)}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="remove"
                onClick={() => removeItem(item.product_id)}
                disabled={isShoppingOosDisabled(item.product_id)}
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
                  The following items are unavailable or out of stock:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', width: '100%' }}>
                  {missingItems.map((mi, idx) => (
                    <div key={idx} style={{ padding: '16px', background: '#f8f8f8', border: '1px solid #eaeaea', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#333' }}>{mi.name}</strong>
                          {mi.reason === "out_of_stock" && (
                            <span style={{ 
                              color: '#ef4444', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              marginLeft: '8px',
                              background: '#fee2e2',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              Out of Stock
                            </span>
                          )}
                        </div>
                        <span style={{ color: '#666', fontWeight: 600 }}>Qty: {mi.qty}</span>
                      </div>
                      <textarea
                        placeholder="Write feedback... (e.g. need this brand, out of stock)"
                        value={mi.feedback}
                        onChange={(e) => handleFeedbackChange(idx, e.target.value)}
                        style={{
                          width: '100%',
                          height: '60px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          fontSize: '0.875rem',
                          resize: 'none',
                          marginTop: '4px',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="scan-footer" style={{ justifyContent: 'center', marginTop: '16px', borderTop: 'none', padding: '16px' }}>
              <button onClick={submitMissingFeedback} style={{ background: '#5b5bd6', color: '#fff', border: 'none', padding: '14px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '1rem' }}>
                Submit & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showAmbiguousPopup && ambiguousItems.length > 0 && (
        <div className="scan-modal-backdrop" onClick={handleCloseAmbiguousPopup} style={{ zIndex: 10000 }}>
          <div className="scan-modal ambiguous-modal" onClick={(e) => e.stopPropagation()} style={{ width: '700px', maxWidth: '90vw' }}>
            <button className="scan-close" onClick={handleCloseAmbiguousPopup}>
              ✕
            </button>
            <div className="ambiguous-header" style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ color: '#1e1b4b', margin: 0 }}>Select Correct Item</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                We found multiple matches for "<strong>{ambiguousItems[0].enteredName}</strong>". Please choose the right one:
              </p>
            </div>
            <div className="ambiguous-list" style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {ambiguousItems[0].matches.map((product) => {
                const isOutOfStock = product.stock <= 0;
                return (
                  <div 
                    key={product.product_id} 
                    className={`ambiguous-item-card ${isOutOfStock ? 'out-of-stock' : ''}`} 
                    onClick={() => !isOutOfStock && handleSelectAmbiguous(ambiguousItems[0].enteredName, product, ambiguousItems[0].qty)}
                    style={{ opacity: isOutOfStock ? 0.7 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="ambiguous-image-box">
                      <img src={product.image_url} alt={product.name} />
                    </div>
                    <div className="ambiguous-info">
                      <div className="ambiguous-name">
                        {product.name}
                        {isOutOfStock && (
                          <div style={{ color: '#ef4444', fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>OUT OF STOCK</div>
                        )}
                      </div>
                      <div className="ambiguous-price">Price: ₹{product.price}</div>
                      <button 
                        className="ambiguous-select-btn" 
                        disabled={isOutOfStock}
                        style={{ background: isOutOfStock ? '#ccc' : undefined }}
                      >
                        {isOutOfStock ? 'Unavailable' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ambiguous-footer" style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#64748b', fontSize: '14px' }}>
                Item {ambiguousItems.length} more to disambiguate
              </div>
              <button onClick={() => {
                const current = ambiguousItems[0];
                setMissingItems(prev => [...prev, { name: current.enteredName, qty: current.qty, feedback: "" }]);
                setAmbiguousItems(prev => prev.slice(1));
                if (ambiguousItems.length === 1) {
                  setShowAmbiguousPopup(false);
                  setShowMissingPopup(true);
                }
              }} style={{ background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                Skip this item
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ReviewListPage;