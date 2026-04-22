import React, { useEffect, useState } from "react";
import "./CreateListPage.css";
import { useNavigate } from "react-router-dom";

const CreateListPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

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

  // 🔍 SEARCH
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="categories">

        <div
          className={`category-card ${selectedCategory === null ? "active" : ""}`}
          onClick={() => fetchByCategory(null)}
        >
          All
        </div>

        {categories.map((cat) => (
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
                categories.find(c => c.category_id === selectedCategory)?.category_name
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
          onClick={() => navigate("/review-list", { state: { cart } })}
        >
          Review list
        </button>
      </div>

    </div>
  );
};

export default CreateListPage;