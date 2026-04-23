import React from "react";
import "../pages/CreateListPage.css";

export default function ScanPopup({
  visible,
  item,
  price,
  qty,
  totalCart,
  onClose
}) {
  if (!visible || !item) return null;

  return (
    <div className="scan-modal-backdrop" onClick={onClose}>
      <div className="scan-modal" onClick={(e) => e.stopPropagation()}>

        {/* CLOSE ICON */}
        <button className="scan-close" onClick={onClose}>✕</button>

        <div className="scan-body">

          <div className="scan-image">
            <img src={item.image_url} alt={item.name} />
          </div>

          <div className="scan-info">
            <h3>{item.name}</h3>

            <div className="scan-meta">
              Barcode: {item.barcode}
            </div>

            <div className="scan-price">
              Price/unit: <strong>Rs. {Number(price).toFixed(2)}</strong>
            </div>

            {/* READ-ONLY QUANTITY */}
            <div className="scan-qty-display">
              Quantity: <strong>{qty}</strong>
            </div>

            <div className="scan-line">
              <div>Estimated Total:</div>
              <div>
                <strong>Rs. {(qty * price).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="scan-footer">
          <div className="scan-cart-total">
            Cart Total: <strong>Rs. {Number(totalCart).toFixed(2)}</strong>
          </div>

          {/* 🔥 OK BUTTON */}
          <button className="scan-ok-btn" onClick={onClose}>
            OK
          </button>
        </div>

      </div>
    </div>
  );
}