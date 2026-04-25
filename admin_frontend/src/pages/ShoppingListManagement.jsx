import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import "./ShoppingListManagement.css";

const ShoppingListManagement = () => {
  const [products, setProducts] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, listData] = await Promise.all([
        apiService.getAllProducts(),
        apiService.getShoppingLists(),
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setShoppingList(Array.isArray(listData) ? listData : []);
      setError("");
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) {
      setError("Please select product and quantity");
      return;
    }

    try {
      await apiService.addToShoppingList(selectedProduct, parseInt(quantity));
      setSelectedProduct("");
      setQuantity(1);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      await apiService.updateShoppingListQuantity(productId, newQuantity);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (window.confirm("Remove this item from shopping list?")) {
      try {
        await apiService.removeFromShoppingList(productId);
        await fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleClearList = async () => {
    if (window.confirm("Clear entire shopping list?")) {
      try {
        await apiService.clearShoppingList();
        await fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Group by category
  const groupedByCategory = shoppingList.reduce((acc, item) => {
    const category = item.category_name || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const totalItems = shoppingList.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div className="shopping-list-page">
      <div className="page-header">
        <h1>📝 Shopping List Management</h1>
        {shoppingList.length > 0 && (
          <button className="clear-btn" onClick={handleClearList}>
            🗑️ Clear All
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* ADD ITEM FORM */}
      <form className="add-item-form" onSubmit={handleAddItem}>
        <h2>Add Item to Shopping List</h2>
        <div className="form-row">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            required
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={`select-${p.id}`} value={p.id}>
                {p.name} - ₹{p.price}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            required
          />

          <button type="submit" className="add-item-btn">
            + Add to List
          </button>
        </div>
      </form>

      {/* SHOPPING LIST DISPLAY */}
      <div className="shopping-list-container">
        {loading ? (
          <div className="loading">Loading shopping list...</div>
        ) : shoppingList.length === 0 ? (
          <div className="empty-state">Shopping list is empty</div>
        ) : (
          <>
            <div className="stats-bar">
              <div className="stat">
                <span className="stat-label">Total Items</span>
                <span className="stat-value">{shoppingList.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Quantity</span>
                <span className="stat-value">{totalItems}</span>
              </div>
            </div>

            <div className="categories-list">
              {Object.entries(groupedByCategory)
                .sort(([catA], [catB]) => catA.localeCompare(catB))
                .map(([category, items]) => (
                  <div key={`category-${category}`} className="category-section">
                    <div className="category-header">
                      <h2>{category}</h2>
                      <span className="item-count">{items.length} item(s)</span>
                    </div>

                    <div className="list-table-wrapper">
                      <table className="list-table">
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => {
                            const product = products.find(
                              (p) => p.id === item.product_id
                            );
                            const itemTotal = (product?.price || 0) * (item.quantity || 1);

                            return (
                              <tr key={`list-item-${item.product_id}`} className="list-row">
                                <td className="product-name">
                                  {product?.name || "Unknown"}
                                </td>
                                <td className="price">₹{product?.price || 0}</td>
                                <td className="quantity">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity || 1}
                                    onChange={(e) =>
                                      handleUpdateQuantity(
                                        item.product_id,
                                        parseInt(e.target.value)
                                      )
                                    }
                                    className="qty-input"
                                  />
                                </td>
                                <td className="total">₹{itemTotal.toFixed(2)}</td>
                                <td className="status">
                                  {item.picked ? (
                                    <span className="picked-badge">✓ Picked</span>
                                  ) : (
                                    <span className="pending-badge">⏳ Pending</span>
                                  )}
                                </td>
                                <td className="actions">
                                  <button
                                    className="action-btn remove-btn"
                                    onClick={() => handleRemoveItem(item.product_id)}
                                    title="Remove from list"
                                  >
                                    🗑️ Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingListManagement;
