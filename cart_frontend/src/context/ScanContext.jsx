import React, { createContext, useContext, useEffect, useState, useRef } from "react";

const ScanContext = createContext();

export const useScan = () => useContext(ScanContext);

export const ScanProvider = ({ children }) => {
  const [scanPopupVisible, setScanPopupVisible] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [scannedPrice, setScannedPrice] = useState(0);
  const [scannedQty, setScannedQty] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const lastScannedRef = useRef(null);

  // Fetch Cart Items
  const fetchCartItems = async () => {
    try {
      const res = await fetch("http://localhost:3500/cart/items");
      const data = await res.json();
      
      let totalCost = 0;
      let totalQty = 0;
      data.forEach(it => {
        totalCost += (it.price_at_scan || 0) * (it.quantity || 0);
        totalQty += (it.quantity || 0);
      });
      
      setCartTotal(totalCost);
      setTotalItems(totalQty);
      return data;
    } catch (e) {
      console.log("Cart fetch error", e);
      setCartTotal(0);
      setTotalItems(0);
      return [];
    }
  };

  // Process a barcode scan
  const handleBarcodeDetected = async (code) => {
    if (!code) return;

    try {
      // add one unit to cart via backend
      await fetch("http://localhost:3500/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: code, quantity: 1 }),
      });

      // refresh cart items
      const cartItems = await fetchCartItems();

      // find added item in cart
      const added = cartItems.find((c) => String(c.barcode) === String(code));

      if (added) {
        setScannedItem(added);
        setScannedPrice(added.price_at_scan || 0);
        setScannedQty(added.quantity || 1);
        setScanPopupVisible(true);
      } else {
        // If it wasn't added properly, just show a minimal state or fallback
        setScannedItem({ name: "Unknown Item", image_url: "", barcode: code });
        setScannedPrice(0);
        setScannedQty(1);
        setScanPopupVisible(true);
      }
    } catch (err) {
      console.log("Scan add error:", err);
    }
  };

  const popupIncrease = async () => {
    if (!scannedItem) return;
    try {
      await fetch("http://localhost:3500/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: scannedItem.barcode, quantity: 1 }),
      });
      const cartItems = await fetchCartItems();
      const it = cartItems.find((c) => String(c.barcode) === String(scannedItem.barcode));
      setScannedQty(it?.quantity || Math.max(1, scannedQty + 1));
    } catch (e) { console.log(e); }
  };

  const popupDecrease = async () => {
    if (!scannedItem) return;
    try {
      await fetch("http://localhost:3500/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: scannedItem.barcode, quantity: 1 }),
      });
      const cartItems = await fetchCartItems();
      const it = cartItems.find((c) => String(c.barcode) === String(scannedItem.barcode));
      if (!it || it.quantity <= 0) {
        setScanPopupVisible(false);
        setScannedItem(null);
        setScannedQty(0);
      } else {
        setScannedQty(it.quantity);
      }
    } catch (e) { console.log(e); }
  };

  const closePopup = () => setScanPopupVisible(false);

  // Poll for hardware scanner events
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:5200/event");
        const data = await res.json();

        if (data.barcode && data.barcode === lastScannedRef.current) {
          return;
        }

        if (data.type === "add" && data.status === "success") {
          const scannedBarcode = String(data.barcode).trim();
          lastScannedRef.current = scannedBarcode;
          
          await handleBarcodeDetected(scannedBarcode);

          setTimeout(() => {
            lastScannedRef.current = null;
          }, 5000);
        }
      } catch (err) {
        // Event server not running, ignore silently
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Initial fetch to set cart totals globally
  useEffect(() => {
    fetchCartItems();
  }, []);

  return (
    <ScanContext.Provider
      value={{
        scanPopupVisible,
        scannedItem,
        scannedPrice,
        scannedQty,
        cartTotal,
        totalItems,
        popupIncrease,
        popupDecrease,
        closePopup,
        fetchCartItems
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};
