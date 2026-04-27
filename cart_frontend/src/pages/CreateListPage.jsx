import React, { useEffect, useMemo, useRef, useState } from "react";
import "./CreateListPage.css";
import { useNavigate } from "react-router-dom";

const CreateListPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pasteSuggestions, setPasteSuggestions] = useState([]);
  const textareaRef = useRef(null);
  const pasteSelection = useRef({ start: 0, end: 0 });
  const [showVK, setShowVK] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stockError, setStockError] = useState(null);
  const navigate = useNavigate();

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

    // Preload any items already in shopping-list (e.g. imported via mobile QR)
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

  // ===============================
  // 🔥 CART LOGIC (FINAL CORRECT)
  // ===============================

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
      
      if (data.status === "out_of_stock") {
        setStockError({ name: data.product_name, available: 0 });
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

  // 🔢 TOTAL ITEMS
  const totalItems = Object.values(cart).reduce((a, b) => a + b.qty, 0);

  // ✅ IMPORT PASTE
  const importPaste = async () => {
    try {
      const res1 = await fetch("http://localhost:3500/shopping-list/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const result = await res1.json();

      // refresh shopping-list from server
      const res2 = await fetch("http://localhost:3500/shopping-list/items");
      const data = await res2.json();

      const newCart = {};
      data.forEach((p) => {
        newCart[p.product_id] = { ...p, qty: p.quantity };
      });

      setCart(newCart);
      setPasteText("");
      return result;
    } catch (err) {
      console.log("Import error:", err);
      return null;
    }
  };

  // suggestions for the current line in the textarea
  const handlePasteChange = (e) => {
    const val = e.target.value;
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    pasteSelection.current = { start, end };
    setPasteText(val);

    const lastLine = val.split(/\r?\n/).pop().trim();
    if (!lastLine) return setPasteSuggestions([]);

    const matches = products
      .filter((p) => p.name.toLowerCase().includes(lastLine.toLowerCase()))
      .slice(0, 6);

    setPasteSuggestions(matches);
  };

  useEffect(() => {
    // restore cursor position after re-render
    const ref = textareaRef.current;
    if (ref && pasteSelection.current) {
      try {
        ref.setSelectionRange(pasteSelection.current.start, pasteSelection.current.end);
      } catch (e) {}
    }
  }, [pasteText]);

  // =====================
  // Barcode scanning flow (Moved to global ScanContext)
  // =====================

  const applyPasteSuggestion = (product) => {
    const lines = pasteText.split(/\r?\n/);
    lines[lines.length - 1] = product.name + ' 1';
    setPasteText(lines.join('\n'));
    setPasteSuggestions([]);
  };

  // Virtual Keyboard helpers
  useEffect(() => {
    const onFocusIn = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        // show a small keyboard toggle when focusing inputs
        // we don't auto-open it to avoid interrupting typing
      }
    };

    window.addEventListener('focusin', onFocusIn);
    return () => window.removeEventListener('focusin', onFocusIn);
  }, []);

  const insertAtActive = (ch) => {
    const el = document.activeElement;
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const val = el.value || '';
    const newVal = val.slice(0, start) + ch + val.slice(end);
    el.value = newVal;
    const ev = new Event('input', { bubbles: true });
    el.selectionStart = el.selectionEnd = start + ch.length;
    el.dispatchEvent(ev);
    el.focus();
  };

  const backspaceAtActive = () => {
    const el = document.activeElement;
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    if (start === 0 && end === 0) return;
    let val = el.value || '';
    if (start === end) {
      // delete previous char
      el.value = val.slice(0, start - 1) + val.slice(end);
      el.selectionStart = el.selectionEnd = Math.max(0, start - 1);
    } else {
      el.value = val.slice(0, start) + val.slice(end);
      el.selectionStart = el.selectionEnd = start;
    }
    const ev = new Event('input', { bubbles: true });
    el.dispatchEvent(ev);
    el.focus();
  };

  const VirtualKeyboard = () => {
    const rows = [
      'QWERTYUIOP'.split(''),
      'ASDFGHJKL'.split(''),
      ['Z','X','C','V','B','N','M']
    ];
    return (
      <div className="virtual-keyboard">
        {rows.map((r, i) => (
          <div className="vk-row" key={i}>
            {r.map((k) => (
              <button key={k} className="vk-key" onClick={() => insertAtActive(k)}>{k}</button>
            ))}
          </div>
        ))}
        <div className="vk-row">
          <button className="vk-key vk-wide" onClick={() => insertAtActive(' ')}>Space</button>
          <button className="vk-key" onClick={() => backspaceAtActive()}>⌫</button>
          <button className="vk-key" onClick={() => insertAtActive('\n')}>Enter</button>
        </div>
      </div>
    );
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
    <div className="create-container">

      {/* NAVBAR */}
      <div className="navbar">
        <h2>Make List</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Global scanner handles barcodes automatically */}
        </div>
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Display imported/added list */}
       <div className="paste-box">
        <h4 className="paste-title">Your Shopping List</h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <textarea
            className="paste-textarea"
            readOnly
            value={Object.values(cart)
              .map(item => `${item.name} ${item.qty > 1 ? `x${item.qty}` : ''}`)
              .join('\n')}
            placeholder="Your list is empty. Add items or import via mobile."
            style={{ backgroundColor: '#f9f9f9', cursor: 'default' }}
          />
        </div>
      </div>
      {/* CATEGORIES BAR */}
      <div className="categories-wrapper">
        <div className="categories-row">
          <button
            type="button"
            className={`createList-category-pill ${selectedCategory === null ? "active" : ""}`}
            onClick={() => fetchByCategory(null)}
          >
            All
          </button>

          {visibleCategories.map((cat) => (
            <button
              key={cat.category_id}
              type="button"
              className={`createList-category-pill ${
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
                <div key={item.product_id} className={`product-card ${item.stock === 0 ? 'out-of-stock' : ''}`}>
                  <div className="product-card-inner">
                    <div className="image-box">
                      <img src={item.image_url} alt={item.name} />
                      {item.stock === 0 && (
                        <div className="out-of-stock-overlay">OUT OF STOCK</div>
                      )}
                    </div>
                    
                    <div className="product-info">
                      <h4 className="product-name">{item.name}</h4>
                      <p className="product-price">Price: ₹{Number(item.price || 0).toFixed(0)}</p>
                      
                      <div className="product-actions">
                        {!cart[item.product_id] ? (
                          <button 
                            className="add-btn" 
                            onClick={() => item.stock > 0 && addItem(item)}
                            disabled={item.stock === 0}
                            style={{ background: item.stock === 0 ? '#ccc' : undefined }}
                          >
                            {item.stock === 0 ? 'Unavailable' : 'Add'}
                          </button>
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
                  {category?.category_name}
                </h3>

                <div className="products-grid">
                  {groupedProducts[catId].map((item) => (
                    <div key={item.product_id} className={`product-card ${item.stock === 0 ? 'out-of-stock' : ''}`}>
                      <div className="product-card-inner">
                        <div className="image-box">
                          <img src={item.image_url} alt={item.name} />
                          {item.stock === 0 && (
                            <div className="out-of-stock-overlay">OUT OF STOCK</div>
                          )}
                        </div>
                        
                        <div className="product-info">
                          <h4 className="product-name">{item.name}</h4>
                          <p className="product-price">Price: ₹{Number(item.price || 0).toFixed(0)}</p>
                          
                          <div className="product-actions">
                            {!cart[item.product_id] ? (
                              <button 
                                className="add-btn" 
                                onClick={() => item.stock > 0 && addItem(item)}
                                disabled={item.stock === 0}
                                style={{ background: item.stock === 0 ? '#ccc' : undefined }}
                              >
                                {item.stock === 0 ? 'Unavailable' : 'Add'}
                              </button>
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

      {/* FOOTER */}
      <div className="bottom-bar">
        <span>Total Items : {totalItems}</span>

        <button
          className="review-btn"
          onClick={async () => {
            let importResult = null;
            if (pasteText && pasteText.trim()) {
              importResult = await importPaste();
            }
            navigate("/review-list", { 
              state: { 
                cart,
                ambiguousItems: importResult?.ambiguousItems || [],
                missingItems: importResult?.missingItems || []
              } 
            });
          }}
        >
          Review list
        </button>
      </div>

      {stockError && (
        <div className="scan-modal-backdrop" onClick={() => setStockError(null)} style={{ zIndex: 10001 }}>
          <div className="scan-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ color: '#1e1b4b', marginBottom: '10px' }}>Insufficient Stock</h3>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>
              {stockError.available > 0 
                ? <>Sorry, only <strong>{stockError.available}</strong> units of <strong>{stockError.name}</strong> are available.</>
                : <>Sorry, <strong>{stockError.name}</strong> is currently <strong>out of stock</strong>.</>
              }
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

export default CreateListPage;