import React, { useEffect, useState } from "react";
import "./ReviewListPage.css";
import { useNavigate } from "react-router-dom";

const ReviewListPage = () => {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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

  const handleCategorySelect = async (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      await fetchAllList({ updateVisible: true });
      return;
    }
    await fetchListByCategory(categoryId);
  };

  return (
    <div className="review-container">

      {/* LEFT */}
      <div className="left">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/create-list")}
        >
          ← Back to Create List
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
          {categories.map((cat) => (
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

        <button className="route-btn" onClick={() => navigate("/home")}>
          Generate Route
        </button>

      </div>

    </div>
  );
};

export default ReviewListPage;