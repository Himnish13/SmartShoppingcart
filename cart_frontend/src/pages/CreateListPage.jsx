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

  // ✅ FETCH CATEGORIES
  useEffect(() => {
    fetch("http://localhost:3500/products/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.log(err));

    fetchAllProducts();
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

  // 🔢 TOTAL ITEMS
  const totalItems = Object.values(cart).reduce((a, b) => a + b.qty, 0);

  // ✅ IMPORT PASTE
  const importPaste = async () => {
    try {
      await fetch("http://localhost:3500/shopping-list/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });

      // refresh shopping-list from server
      const res = await fetch("http://localhost:3500/shopping-list/items");
      const data = await res.json();

      const newCart = {};
      data.forEach((p) => {
        newCart[p.product_id] = { ...p, qty: p.quantity };
      });

      setCart(newCart);
      setPasteText("");
    } catch (err) {
      console.log("Import error:", err);
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

      {/* Paste-based import (reuse existing classes) */}
      <div className="paste-box">
        <h4 className="paste-title">Import Items</h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <textarea
            ref={textareaRef}
            className="paste-textarea"
            placeholder={"Example: Milk 500ml"}
            value={pasteText}
            onChange={handlePasteChange}
          />
          <button
            type="button"
            className="vk-toggle"
            onClick={() => setShowVK((s) => !s)}
            title="Toggle virtual keyboard"
          >⌨</button>
        </div>

        {pasteSuggestions.length > 0 && (
          <div className="paste-suggestions">
            {pasteSuggestions.map((p) => (
              <div key={p.product_id} className="paste-suggestion" onClick={() => applyPasteSuggestion(p)}>
                <img src={p.image_url} alt={p.name} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="paste-actions">
          <button className="import-btn" onClick={importPaste}>Import Pasted List</button>
        </div>
        {showVK && <VirtualKeyboard />}
      </div>
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

                  <div className="image-box">
                    <img src={item.image_url} alt={item.name} />
                  </div>

                  <div className="product-bottom">
                    <span className="product-name">{item.name}</span>

                    {!cart[item.product_id] ? (
                      <button onClick={() => addItem(item)}>+ Add</button>
                    ) : (
                      <div className="qty-control">
                        <button onClick={() => decreaseQty(item.product_id)}>-</button>
                        <span>{cart[item.product_id].qty}</span>
                        <button onClick={() => increaseQty(item.product_id)}>+</button>
                      </div>
                    )}
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
                    <div key={item.product_id} className="product-card">

                      <div className="image-box">
                        <img src={item.image_url} alt={item.name} />
                      </div>

                      <div className="product-bottom">
                        <span className="product-name">{item.name}</span>

                        {!cart[item.product_id] ? (
                          <button onClick={() => addItem(item)}>+ Add</button>
                        ) : (
                          <div className="qty-control">
                            <button onClick={() => decreaseQty(item.product_id)}>-</button>
                            <span>{cart[item.product_id].qty}</span>
                            <button onClick={() => increaseQty(item.product_id)}>+</button>
                          </div>
                        )}
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
            if (pasteText && pasteText.trim()) {
              await importPaste();
            }
            navigate("/review-list", { state: { cart } });
          }}
        >
          Review list
        </button>
      </div>

    </div>
  );
};

export default CreateListPage;