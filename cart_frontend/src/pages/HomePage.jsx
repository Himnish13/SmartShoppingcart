import React, { useState, useEffect, useRef } from "react";
import "./HomePage.css";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";

const HomePage = () => {

  const [popup, setPopup] = useState(null);
  const [barcode, setBarcode] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const lastScannedRef = useRef(null);

  const center = [28.6139, 77.2090];

  const route = [
    [28.6139, 77.2090],
    [28.6145, 77.2095],
    [28.6125, 77.2085],
  ];

  // ✅ FETCH CART ITEMS
  const fetchCartItems = async () => {
    try {
      const res = await fetch("http://localhost:3500/cart/items");
      const data = await res.json();
      setCartItems(data);
    } catch (err) {
      console.log("❌ Cart fetch error", err);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  // ✅ SCANNER LISTENER
  useEffect(() => {

    const interval = setInterval(async () => {

      try {
        const res = await fetch("http://127.0.0.1:5200/event");
        const data = await res.json();

        // 🚫 ignore duplicate scans
        if (data.barcode && data.barcode === lastScannedRef.current) {
          return;
        }

        if (data.type === "add") {

          if (data.status === "scanning") {
            setPopup("scan");
          }

          else if (data.status === "failed") {
            setPopup("retry");
          }

          else if (data.status === "success") {

            const scannedBarcode = String(data.barcode).trim();

            console.log("📦 SCANNED:", scannedBarcode);

            setPopup("success");
            setBarcode(scannedBarcode);
            lastScannedRef.current = scannedBarcode;

            // 🔥 CALL BACKEND
            try {
              const resAdd = await fetch("http://localhost:3500/cart/add", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  barcode: scannedBarcode,
                  quantity: 1
                }),
              });

              const result = await resAdd.json();

              console.log("🟢 ADD API RESPONSE:", result);

              if (!resAdd.ok) {
                console.log("❌ Add failed:", result);
                setPopup("retry");
                return;
              }

              // ✅ ONLY REFRESH AFTER SUCCESS
              await fetchCartItems();

            } catch (err) {
              console.log("❌ API ERROR:", err);
            }

            // 🔁 reset scan after 2 sec (IMPORTANT)
            setTimeout(() => {
              lastScannedRef.current = null;
            }, 2000);
          }
        }

        // REMOVE FLOW (optional for now)
        if (data.type === "remove") {
          setPopup("remove");
        }

      } catch (err) {
        console.log("⚠️ Event server not running");
      }

    }, 1500);

    return () => clearInterval(interval);

  }, []);

  // ✅ REMOVE ITEM
  const removeItem = async (product_id) => {
    try {
      await fetch("http://localhost:3500/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id }),
      });

      fetchCartItems();
    } catch (err) {
      console.log("❌ Remove error", err);
    }
  };

  return (
    <div className="home">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">🛒 Smart Cart</h2>
        <div className="menu">
          <p className="active">Home</p>
          <p>Explore</p>
          <p>List</p>
          <p>Offers</p>
        </div>
      </div>

      {/* CENTER */}
      <div className="center">

        <h1>Home</h1>

        <div className="map-wrapper">
          <MapContainer center={center} zoom={16} className="map">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[28.6145, 77.2095]} />
            <Polyline positions={route} color="black" />
          </MapContainer>
        </div>

        <div className="bottom-section">

          <div className="status-box">
            <h3>Status</h3>

            <div className="status-cards">
              <div className="progress-card">
                <p>Shopping Progress</p>
                <div className="circle">{cartItems.length * 10}%</div>
              </div>

              <div className="mini-card">
                <h3>{cartItems.length}</h3>
                <p>Items Scanned</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right">

        <h3>Cart Items:</h3>

        {cartItems.length === 0 ? (
          <p>No items in cart</p>
        ) : (
          cartItems.map((item) => (
            <div className="cart-item" key={item.product_id}>
              <p>{item.name}</p>
              <span>Qty: {item.quantity}</span>
              <button onClick={() => removeItem(item.product_id)}>✕</button>
            </div>
          ))
        )}
      </div>

      {/* POPUPS */}
      {popup === "scan" && <div className="popup">📷 Scan product</div>}
      {popup === "retry" && <div className="popup error">❌ Try again</div>}
      {popup === "success" && <div className="popup success">✅ Added ({barcode})</div>}
      {popup === "remove" && <div className="popup">⚠️ Remove detected</div>}

    </div>
  );
};

export default HomePage;