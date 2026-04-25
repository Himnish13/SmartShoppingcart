import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import "./OffersManagement.css";

const OffersManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, with-offers, without-offers
  const [formData, setFormData] = useState({
    product_id: "",
    discount_percentage: "",
    valid_from: "",
    valid_until: "",
    description: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllProducts();
      setProducts(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await apiService.updateOffer(editingProductId, formData);
      } else {
        await apiService.addOffer(formData);
      }
      setFormData({
        product_id: "",
        discount_percentage: "",
        valid_from: "",
        valid_until: "",
        description: "",
      });
      setEditingProductId(null);
      setShowForm(false);
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      product_id: product.product_id,
      discount_percentage: product.discount_percent || "",
      valid_from: product.valid_from || "",
      valid_until: product.valid_until || "",
      description: product.offer_description || "",
    });
    setEditingProductId(product.product_id);
    setShowForm(true);
  };

  const handleDeleteOffer = async (productId) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      try {
        await apiService.deleteOffer(productId);
        await fetchProducts();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Count statistics
  const productsWithOffers = products.filter(p => p.discount_percent);
  const productsWithoutOffers = products.filter(p => !p.discount_percent);

  // Filter products based on selected filter
  const filteredProducts = filterType === "with-offers"
    ? productsWithOffers
    : filterType === "without-offers"
    ? productsWithoutOffers
    : products;

  return (
    <div className="offers-page">
      <div className="page-header">
        <h1>🎁 Offers Management</h1>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Offer"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* STATS SECTION */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{products.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card active-offers">
          <div className="stat-number">{productsWithOffers.length}</div>
          <div className="stat-label">Active Offers</div>
        </div>
        <div className="stat-card no-offers">
          <div className="stat-number">{productsWithoutOffers.length}</div>
          <div className="stat-label">No Offers</div>
        </div>
      </div>

      {showForm && (
        <form className="offer-form" onSubmit={handleSubmit}>
          <h2>{editingProductId ? "Edit Offer" : "Create New Offer"}</h2>

          <div className="form-row">
            <select
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              required
              disabled={editingProductId !== null}
            >
              <option value="">Select Product</option>
              {products
                .filter((p) => !editingProductId || p.product_id === editingProductId)
                .map((p) => (
                  <option key={`select-${p.product_id}`} value={p.product_id}>
                    {p.name} (₹{p.price})
                  </option>
                ))}
            </select>
          </div>

          <div className="form-row">
            <input
              type="number"
              placeholder="Discount %"
              min="0"
              max="100"
              value={formData.discount_percentage}
              onChange={(e) =>
                setFormData({ ...formData, discount_percentage: e.target.value })
              }
              required
            />
          </div>

          <div className="form-row">
            <input
              type="datetime-local"
              placeholder="Valid From"
              value={formData.valid_from}
              onChange={(e) =>
                setFormData({ ...formData, valid_from: e.target.value })
              }
            />
            <input
              type="datetime-local"
              placeholder="Valid Until"
              value={formData.valid_until}
              onChange={(e) =>
                setFormData({ ...formData, valid_until: e.target.value })
              }
            />
          </div>

          <textarea
            placeholder="Offer Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows="3"
          />

          <button type="submit" className="submit-btn">
            {editingProductId ? "Update Offer" : "Create Offer"}
          </button>
        </form>
      )}

      {/* FILTER BUTTONS */}
      <div className="filter-section">
        <button
          className={`filter-btn ${filterType === "all" ? "active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          All Products ({products.length})
        </button>
        <button
          className={`filter-btn ${filterType === "with-offers" ? "active" : ""}`}
          onClick={() => setFilterType("with-offers")}
        >
          ✨ With Offers ({productsWithOffers.length})
        </button>
        <button
          className={`filter-btn ${filterType === "without-offers" ? "active" : ""}`}
          onClick={() => setFilterType("without-offers")}
        >
          📌 No Offers ({productsWithoutOffers.length})
        </button>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="offers-container">
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            {filterType === "with-offers"
              ? "No products with offers yet. Create one!"
              : filterType === "without-offers"
              ? "All products have offers!"
              : "No products available"}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="offers-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th>Offer Details</th>
                  <th>Discount</th>
                  <th>Final Price</th>
                  <th>Valid Until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={`product-${product.product_id}`}
                      className={`product-row ${product.discount_percent ? "has-offer" : "no-offer"}`}>
                    <td className="status-cell">
                      {product.discount_percent ? (
                        <span className="badge-offer">✨ OFFER</span>
                      ) : (
                        <span className="badge-no-offer">-</span>
                      )}
                    </td>
                    <td className="product-name">{product.name}</td>
                    <td className="price">₹{product.price}</td>
                    <td className="offer-info">
                      {product.discount_percent ? (
                        <span className="offer-active">{product.discount_percent}% OFF</span>
                      ) : (
                        <span className="no-offer-text">No active offer</span>
                      )}
                    </td>
                    <td className="discount">
                      {product.discount_percent ? (
                        <span>-₹{(product.price * product.discount_percent / 100).toFixed(2)}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="final-price">
                      {product.discount_percent ? (
                        <span className="price-highlight">
                          ₹{(product.price * (1 - product.discount_percent / 100)).toFixed(2)}
                        </span>
                      ) : (
                        "₹" + product.price
                      )}
                    </td>
                    <td className="validity">
                      {product.discount_percent ? (
                        product.valid_until ? (
                          new Date(product.valid_until).toLocaleDateString()
                        ) : (
                          <span className="no-expiry">No expiry</span>
                        )
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(product)}
                        title={product.discount_percent ? "Edit offer" : "Add offer"}
                      >
                        {product.discount_percent ? "✏️ Edit" : "+ Add"}
                      </button>
                      {product.discount_percent && (
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteOffer(product.product_id)}
                          title="Delete offer"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersManagement;
