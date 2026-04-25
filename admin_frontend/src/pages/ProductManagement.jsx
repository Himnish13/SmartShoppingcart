import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import "./ProductManagement.css";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    price: "",
    category: "",
    stock: "",
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
      if (editingId) {
        await apiService.updateProduct(editingId, formData);
      } else {
        await apiService.addProduct(formData);
      }
      setFormData({
        name: "",
        barcode: "",
        price: "",
        category: "",
        stock: "",
        description: "",
      });
      setEditingId(null);
      setShowForm(false);
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await apiService.deleteProduct(id);
        await fetchProducts();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="product-page">
      <div className="page-header">
        <h1>📦 Product Management</h1>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="product-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

          <div className="form-row">
            <input
              type="text"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              placeholder="Stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
          />

          <button type="submit" className="submit-btn">
            {editingId ? "Update Product" : "Add Product"}
          </button>
        </form>
      )}

      <div className="products-container">
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">No products found. Add your first product!</div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p className="barcode">Barcode: {product.barcode}</p>
                <p className="price">₹ {product.price}</p>
                <p className="category">{product.category}</p>
                <p className="stock">Stock: {product.stock}</p>
                {product.description && (
                  <p className="description">{product.description}</p>
                )}
                <div className="card-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
