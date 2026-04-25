import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import "./OffersManagement.css";

const OffersManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
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
      product_id: product.id,
      discount_percentage: product.discount_percentage || "",
      valid_from: product.valid_from || "",
      valid_until: product.valid_until || "",
      description: product.offer_description || "",
    });
    setEditingProductId(product.id);
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

  // Group products by category
  const groupedByCategory = products.reduce((acc, product) => {
    const category = product.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = { withOffers: [], withoutOffers: [] };
    }
    if (product.discount_percentage) {
      acc[category].withOffers.push(product);
    } else {
      acc[category].withoutOffers.push(product);
    }
    return acc;
  }, {});

  return (
    <div className="offers-page">
      <div className="page-header">
        <h1>🎁 Offers Management</h1>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Offer"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

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
                .filter((p) => !editingProductId || p.id === editingProductId)
                .map((p) => (
                  <option key={`select-${p.id}`} value={p.id}>
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

      <div className="offers-container">
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">No products available</div>
        ) : (
          <div className="categories-list">
            {Object.entries(groupedByCategory)
              .sort(([catA], [catB]) => catA.localeCompare(catB))
              .map(([category, { withOffers, withoutOffers }]) => (
                <div key={`category-${category}`} className="category-section">
                  <div className="category-header">
                    <h2>{category}</h2>
                    <span className="category-count">
                      {withOffers.length} active offer{withOffers.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Active Offers Table */}
                  {withOffers.length > 0 && (
                    <div className="offers-table-wrapper">
                      <table className="offers-table">
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>Original Price</th>
                            <th>Discount</th>
                            <th>Final Price</th>
                            <th>Valid Until</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withOffers.map((product) => (
                            <tr key={`offer-${product.id}`} className="offer-row">
                              <td className="product-name">{product.name}</td>
                              <td className="original-price">₹{product.price}</td>
                              <td className="discount-badge">
                                <span className="badge">
                                  {product.discount_percentage}% OFF
                                </span>
                              </td>
                              <td className="final-price">
                                ₹{(
                                  product.price *
                                  (1 - product.discount_percentage / 100)
                                ).toFixed(2)}
                              </td>
                              <td className="validity">
                                {product.valid_until ? (
                                  new Date(product.valid_until).toLocaleDateString()
                                ) : (
                                  <span className="no-expiry">No expiry</span>
                                )}
                              </td>
                              <td className="actions">
                                <button
                                  className="action-btn edit-btn"
                                  onClick={() => handleEdit(product)}
                                  title="Edit offer"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className="action-btn delete-btn"
                                  onClick={() => handleDeleteOffer(product.id)}
                                  title="Delete offer"
                                >
                                  🗑️ Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Products without offers */}
                  {withoutOffers.length > 0 && (
                    <div className="no-offers-table-wrapper">
                      <h3 className="no-offers-title">
                        Products without offers ({withoutOffers.length})
                      </h3>
                      <table className="no-offers-table">
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withoutOffers.map((product) => (
                            <tr key={`no-offer-${product.id}`} className="no-offer-row">
                              <td className="product-name">{product.name}</td>
                              <td className="price">₹{product.price}</td>
                              <td className="stock">{product.stock || 0}</td>
                              <td className="action">
                                <button
                                  className="quick-add-btn"
                                  onClick={() => handleEdit(product)}
                                >
                                  + Add Offer
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersManagement;
