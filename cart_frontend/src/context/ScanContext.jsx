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
  const [scanType, setScanType] = useState("add");
  const [scanStatus, setScanStatus] = useState("idle"); // "idle", "waiting", "success"

  // Shopping-list out-of-stock watcher (global)
  const SHOP_OOS_SKIPPED_KEY = "smartcart:shoplist:oosSkipped";
  const [shoppingOosPopupVisible, setShoppingOosPopupVisible] = useState(false);
  const [shoppingOosPending, setShoppingOosPending] = useState([]); // [{product_id, name, image_url, quantity}]
  const [shoppingOosLiveIds, setShoppingOosLiveIds] = useState([]); // product_ids currently out of stock AND in shopping list
  const [shoppingOosSkippedIds, setShoppingOosSkippedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(SHOP_OOS_SKIPPED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const lastScannedRef = useRef(null);

  const persistSkipped = (next) => {
    setShoppingOosSkippedIds(next);
    try {
      localStorage.setItem(SHOP_OOS_SKIPPED_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const uniq = (arr) => Array.from(new Set((arr || []).map((x) => String(x))));

  const isShoppingOosSkipped = (productId) => {
    const id = String(productId);
    return shoppingOosSkippedIds.some((x) => String(x) === id);
  };

  const isShoppingOosLive = (productId) => {
    const id = String(productId);
    return shoppingOosLiveIds.some((x) => String(x) === id);
  };

  const isShoppingOosDisabled = (productId) => {
    return isShoppingOosLive(productId) && isShoppingOosSkipped(productId);
  };

  const closeShoppingOosPopup = () => setShoppingOosPopupVisible(false);

  const skipShoppingOos = (productIds) => {
    const ids = Array.isArray(productIds) ? productIds : [productIds];
    const next = uniq([...(shoppingOosSkippedIds || []), ...ids]);
    persistSkipped(next);

    setShoppingOosPending((prev) => {
      const remaining = (prev || []).filter(
        (p) => !ids.some((id) => String(id) === String(p.product_id))
      );
      if (remaining.length === 0) setShoppingOosPopupVisible(false);
      return remaining;
    });
  };

  const removeShoppingListItems = async (productIds) => {
    const ids = Array.isArray(productIds) ? productIds : [productIds];
    try {
      await Promise.all(
        ids.map((id) =>
          fetch("http://localhost:3500/shopping-list/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: id }),
          }).catch(() => null)
        )
      );
    } finally {
      // Whether remove succeeded or not, remove from pending and mark skipped so we don't spam.
      skipShoppingOos(ids);
    }
  };

  const fetchShoppingListAndProducts = async () => {
    const [shopRes, prodRes] = await Promise.all([
      fetch("http://localhost:3500/shopping-list/items").catch(() => null),
      fetch("http://localhost:3500/products").catch(() => null),
    ]);

    const shop = shopRes ? await shopRes.json().catch(() => []) : [];
    const prods = prodRes ? await prodRes.json().catch(() => []) : [];

    const productsById = new Map();
    (Array.isArray(prods) ? prods : []).forEach((p) => {
      productsById.set(String(p.product_id), p);
    });

    const outNow = [];
    (Array.isArray(shop) ? shop : []).forEach((s) => {
      const p = productsById.get(String(s.product_id));
      const stock = Number(p?.stock);
      if (Number.isFinite(stock) && stock <= 0) {
        outNow.push({
          product_id: s.product_id,
          name: s.name ?? p?.name ?? "Unknown",
          image_url: s.image_url ?? p?.image_url ?? "",
          quantity: s.quantity ?? 1,
        });
      }
    });

    const outIds = uniq(outNow.map((x) => x.product_id));
    setShoppingOosLiveIds(outIds);

    // If something came back in stock, clear its skipped flag so future changes can notify again.
    const skippedStillOut = (shoppingOosSkippedIds || []).filter((id) =>
      outIds.some((o) => String(o) === String(id))
    );
    if (skippedStillOut.length !== shoppingOosSkippedIds.length) {
      persistSkipped(skippedStillOut);
    }

    // Show popup only for newly out-of-stock items not yet skipped.
    const pending = outNow.filter((x) => !isShoppingOosSkipped(x.product_id));
    if (pending.length > 0) {
      setShoppingOosPending(pending);
      setShoppingOosPopupVisible(true);
    }
  };

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
  const handleBarcodeDetected = async (code, type = "add") => {
    if (!code) return;
    setScanType(type);

    try {
      // Find item in current cart before modification (useful for remove)
      const currentCartItems = await fetchCartItems();
      const existingItem = currentCartItems.find((c) => String(c.barcode) === String(code));

      if (type === "add") {
        await fetch("http://localhost:3500/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: code, quantity: 1 }),
        });
      } else if (type === "remove") {
        await fetch("http://localhost:3500/cart/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: code, quantity: 1 }),
        });
      }

      // refresh cart items
      const newCartItems = await fetchCartItems();
      const updatedItem = newCartItems.find((c) => String(c.barcode) === String(code));

      if (updatedItem) {
        setScannedItem(updatedItem);
        setScannedPrice(updatedItem.price_at_scan || 0);
        setScannedQty(updatedItem.quantity || (type === "add" ? 1 : 0));
        setScanPopupVisible(true);
      } else {
        if (type === "remove" && existingItem) {
          setScannedItem(existingItem);
          setScannedPrice(existingItem.price_at_scan || 0);
          setScannedQty(0);
          setScanPopupVisible(true);
        } else {
          setScannedItem({ name: type === "add" ? "Unknown Item" : "Item not in cart", image_url: "", barcode: code });
          setScannedPrice(0);
          setScannedQty(type === "add" ? 1 : 0);
          setScanPopupVisible(true);
        }
      }
    } catch (err) {
      console.log("Scan add/remove error:", err);
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

        if (data.status === "waiting_for_scan") {
          setScanType(data.type);
          setScanStatus("waiting");
          setScanPopupVisible(true);
          return;
        }

        if (data.status === "success" && (data.type === "add" || data.type === "remove")) {
          const scannedBarcode = String(data.barcode).trim();
          
          if (scannedBarcode === lastScannedRef.current) return;
          lastScannedRef.current = scannedBarcode;
          
          setScanStatus("success");
          await handleBarcodeDetected(scannedBarcode, data.type);

          setTimeout(() => {
            lastScannedRef.current = null;
            // Only clear if we are in success state
            setScanStatus("idle");
          }, 5000);
        } else if (!data.status) {
           // Reset if no event
           if (scanStatus !== "idle" && !scanPopupVisible) {
             setScanStatus("idle");
           }
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

  // Poll shopping list + products to detect sudden out-of-stock items.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        await fetchShoppingListAndProducts();
      } catch {
        // ignore
      }
    };

    // Kick once on mount.
    tick();

    const interval = setInterval(() => {
      if (cancelled) return;
      tick();
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingOosSkippedIds]);

  return (
    <ScanContext.Provider
      value={{
        scanPopupVisible,
        scanType,
        scanStatus,
        scannedItem,
        scannedPrice,
        scannedQty,
        cartTotal,
        totalItems,
        popupIncrease,
        popupDecrease,
        closePopup,
        fetchCartItems,

        // Shopping-list out-of-stock API
        shoppingOosPopupVisible,
        shoppingOosPending,
        shoppingOosLiveIds,
        shoppingOosSkippedIds,
        isShoppingOosLive,
        isShoppingOosSkipped,
        isShoppingOosDisabled,
        closeShoppingOosPopup,
        skipShoppingOos,
        removeShoppingListItems,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};
