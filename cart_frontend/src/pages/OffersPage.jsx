import React, { useEffect, useMemo, useState } from "react";
import "./OffersPage.css";
import { useNavigate } from "react-router-dom";

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMap, setSortMap] = useState({});
  const [globalSort, setGlobalSort] = useState("desc");

  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch("http://localhost:3500/offers");
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Fetch error", e);
      setOffers([]);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return offers;
    return offers.filter((o) =>
      (o.name || "").toLowerCase().includes(q)
    );
  }, [offers, search]);

  const categories = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      const key = o.category_name || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [filtered]);

  const sortList = (arr, dir) => {
    return [...arr].sort((a, b) => {
      if (a.discount === b.discount) {
        return dir === "asc"
          ? (a.price || 0) - (b.price || 0)
          : (b.price || 0) - (a.price || 0);
      }
      return dir === "asc"
        ? a.discount - b.discount
        : b.discount - a.discount;
    });
  };

  const toggleSort = (cat) => {
    setSortMap((prev) => ({
      ...prev,
      [cat]: prev[cat] === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="offers-page">
      <div className="offers-top">
        <button onClick={() => navigate(-1)} className="back-btn">
          ←
        </button>

        <h2>Offers</h2>

        <input
          className="search-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* GLOBAL SORT */}
        <button
          className={`sort-btn ${globalSort}`}
          onClick={() =>
            setGlobalSort(globalSort === "asc" ? "desc" : "asc")
          }
        >
          {globalSort === "asc" ? "↑" : "↓"}
        </button>
      </div>

      {/* ALL OFFERS */}
      <section>
        <h3 className="section-title">All Offers</h3>

        <div className="offers-grid">
          {filtered.length === 0 ? (
            <p className="empty">No offers</p>
          ) : (
            sortList(filtered, globalSort).map((o) => (
              <div key={o.product_id} className="offer-card">
                <img src={o.image_url} alt={o.name} />

                <div className="offer-content">
                  <div className="offer-name">{o.name}</div>

                  <div className="offer-row">
                    <span className="discount-badge">
                      {o.discount}% OFF
                    </span>
                    <span className="price-original">
                      ₹{Number(o.price || 0).toFixed(2)}
                    </span>
                    <span className="price-discounted">
                      ₹{(o.price * (1 - o.discount / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* BY CATEGORY */}
      <section>
        <h3 className="section-title">By Category</h3>

        {Object.keys(categories).map((cat) => (
          <div key={cat} className="category-block">
            <div className="category-head">
              <h4>{cat}</h4>

              <button
                className={`sort-btn ${sortMap[cat] || "desc"}`}
                onClick={() => toggleSort(cat)}
              >
                {sortMap[cat] === "asc" ? "↑" : "↓"}
              </button>
            </div>

            <div className="offers-grid">
              {sortList(categories[cat], sortMap[cat] || "desc").map(
                (o) => (
                  <div key={o.product_id} className="offer-card small">
                    <img src={o.image_url} alt={o.name} />

                    <div className="offer-content">
                      <div className="offer-name">{o.name}</div>

                      <div className="offer-row">
                        <span className="discount-badge">
                          {o.discount}% OFF
                        </span>
                        <span className="price-original">
                          ₹{Number(o.price || 0).toFixed(2)}
                        </span>
                        <span className="price-discounted">
                          ₹{(o.price * (1 - o.discount / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default OffersPage;