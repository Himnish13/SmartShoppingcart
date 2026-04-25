import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import "./BillGeneration.css";

const BillGeneration = () => {
  const [carts, setCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [billData, setBillData] = useState(null);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getActiveCarts();
      setCarts(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Failed to load carts");
      setCarts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCartSelect = async (cart) => {
    setSelectedCart(cart);
    try {
      // Simulate fetching cart items - adjust based on your actual API
      const mockItems = [
        {
          id: 1,
          name: "Product 1",
          price: 100,
          quantity: 2,
          total: 200,
        },
        {
          id: 2,
          name: "Product 2",
          price: 50,
          quantity: 1,
          total: 50,
        },
      ];
      setCartItems(mockItems);
    } catch (err) {
      setError("Failed to load cart items");
    }
  };

  const generateBill = async () => {
    if (!selectedCart) {
      setError("Please select a cart");
      return;
    }

    try {
      const bill = await apiService.generateBill(selectedCart.id);
      setBillData(bill);
    } catch (err) {
      setError("Failed to generate bill");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateTax = (total) => {
    return (total * 0.05).toFixed(2); // 5% tax
  };

  return (
    <div className="bill-generation-page">
      <div className="page-header">
        <h1>💰 Bill Generation</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="bill-content">
        <div className="bill-selector">
          <h2>Select Cart</h2>
          {loading ? (
            <div className="loading">Loading carts...</div>
          ) : carts.length === 0 ? (
            <div className="empty-state">No carts available</div>
          ) : (
            <div className="carts-list">
              {carts.map((cart) => (
                <button
                  key={cart.id}
                  className={`cart-option ${
                    selectedCart?.id === cart.id ? "selected" : ""
                  }`}
                  onClick={() => handleCartSelect(cart)}
                >
                  <span className="cart-name">Cart {cart.id}</span>
                  {cart.customer_name && (
                    <span className="customer-name">{cart.customer_name}</span>
                  )}
                  {cart.total_value && (
                    <span className="cart-value">₹{cart.total_value}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCart && cartItems.length > 0 && (
          <div className="bill-preview">
            <div className="bill-header">
              <h2>Bill Preview</h2>
              <div className="bill-actions">
                <button className="print-btn" onClick={handlePrint}>
                  🖨️ Print
                </button>
                <button className="generate-btn" onClick={generateBill}>
                  ✓ Generate Bill
                </button>
              </div>
            </div>

            <div id="printable-bill" className="bill-document">
              <div className="bill-company-header">
                <h1>SMART SHOPPING CART</h1>
                <p>Bill/Invoice</p>
              </div>

              <div className="bill-info">
                <div>
                  <strong>Bill #:</strong> {selectedCart.id}
                </div>
                <div>
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <strong>Customer:</strong> {selectedCart.customer_name || "N/A"}
                </div>
              </div>

              <table className="bill-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>₹{item.price}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bill-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (5%):</span>
                  <span>₹{calculateTax(calculateTotal())}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>
                    ₹{(
                      calculateTotal() + parseFloat(calculateTax(calculateTotal()))
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bill-footer">
                <p>Thank you for your purchase!</p>
                <p>Please visit again</p>
              </div>
            </div>

            {billData && (
              <div className="bill-status">
                <div className="success-message">
                  ✓ Bill generated successfully!
                </div>
              </div>
            )}
          </div>
        )}

        {selectedCart && cartItems.length === 0 && (
          <div className="no-items">
            <p>No items in this cart</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillGeneration;
