import React, { useEffect } from "react";
import { useScan } from "../context/ScanContext";
import "./ScanPopup.css";

export default function ScanPopup() {
  const {
    scanPopupVisible,
    scanType,
    scannedItem,
    scannedPrice,
    scannedQty,
    totalItems,
    cartTotal,
    closePopup,
  } = useScan();

  // Auto-close after 3 seconds of inactivity
  useEffect(() => {
    if (!scanPopupVisible || !scannedItem) return;
    const t = setTimeout(() => {
      closePopup();
    }, 3000);
    return () => clearTimeout(t);
  }, [scanPopupVisible, scannedItem, scannedQty, closePopup]);

  if (!scanPopupVisible || !scannedItem) return null;

  return (
    <div className="scan-modal-backdrop" onClick={closePopup}>
      <div className="scan-modal" onClick={(e) => e.stopPropagation()}>
        <button className="scan-close" onClick={closePopup}>
          ✕
        </button>

        <div className="scan-body">
          <div className="scan-image">
            <img src={scannedItem.image_url} alt={scannedItem.name} />
          </div>

          <div className="scan-info">
            <div className="scan-header-row">
              <h3>{scannedItem.name}</h3>
              <span className="scan-badge">Category</span>
            </div>

            <div className="scan-quantity-row">
              <span>Quantity:</span>
              <span className="scan-qty-value">{scannedQty}</span>
            </div>

            <div className="scan-cost">
              Cost : Rs. {Number(scannedPrice * scannedQty).toFixed(2)}
            </div>

            <div className={`scan-success-msg ${scanType === "remove" ? "scan-remove-msg" : ""}`}>
              <span style={{ fontSize: "16px" }}>{scanType === "add" ? "✓" : "✕"}</span> {scanType === "add" ? "Scanned and added Successfully" : "Scanned and removed Successfully"}
            </div>
          </div>
        </div>

        <div className="scan-footer">
          <div className="scan-footer-item">
            <span className="scan-footer-icon">📦</span> Total Items:{" "}
            <span>{totalItems}</span>
          </div>
          <div className="scan-footer-item">
            <span className="scan-footer-icon">💳</span> Estimated Total:{" "}
            <span>Rs. {Number(cartTotal).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}