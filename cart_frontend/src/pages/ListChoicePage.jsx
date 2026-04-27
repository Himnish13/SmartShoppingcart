import React, { useEffect, useRef, useState } from "react";
import "./ListChoicePage.css";
import { useNavigate } from "react-router-dom";
import QRGenerator from "../components/QRGenerator";

const API = "http://localhost:3500";

const ListChoicePage = () => {
  const navigate = useNavigate();
  const [mobileUrl, setMobileUrl] = useState("");
  const [importStatus, setImportStatus] = useState("idle"); // idle | importing | success
  const [qrSize, setQrSize] = useState(200);
  const pollingRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px) and (max-height: 600px)");
    const apply = () => setQrSize(mq.matches ? 160 : 200);
    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }

    // Safari fallback
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  // 1. On mount: fetch local IP to build the QR URL, then start polling
  useEffect(() => {
    fetch(`${API}/system/ip`)
      .then((r) => r.json())
      .then(({ ip }) => {
        const url = `http://${ip}:3500/mobile`;
        setMobileUrl(url);
      })
      .catch(() => setMobileUrl(`${API}/mobile`));

    // Reset mobile status to idle on cart side when entering this page
    fetch(`${API}/mobile/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "idle" }),
    }).catch(() => {});

    // Start polling for mobile status
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/mobile/status`);
        const data = await res.json();
        const { status, missingItems: missing } = data;

        if (status === "importing") {
          setImportStatus("importing");
        } else if (status === "success") {
          setImportStatus("success");
          clearInterval(pollingRef.current);
          
          const ambiguous = data.ambiguousItems || [];
          
          setTimeout(() => navigate("/review-list", { 
            state: { 
              missingItems: missing,
              ambiguousItems: ambiguous 
            } 
          }), 2000);
        }
      } catch (_) {}
    }, 1200);

    return () => clearInterval(pollingRef.current);
  }, [navigate]);

  // ── IMPORTING screen ──────────────────────────────────────────────────────
  if (importStatus === "importing") {
    return (
      <div className="import-screen">
        <div className="import-card">
          <p className="import-label">Importing List…</p>
          <div className="import-bar-track">
            <div className="import-bar-fill" />
          </div>
          <div className="import-brand">🛒 Smart Cart</div>
        </div>
      </div>
    );
  }

  // ── SUCCESS screen ────────────────────────────────────────────────────────
  if (importStatus === "success") {
    return (
      <div className="import-screen">
        <div className="import-card">
          <div className="import-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="import-success-label">List imported Successfully</p>
          <div className="import-brand">🛒 Smart Cart</div>
        </div>
      </div>
    );
  }

  // ── DEFAULT: QR screen ────────────────────────────────────────────────────
  return (
    <div className="listchoice-container">

      <div className="left-section">
        <div className="startlogo">🛒 Smart Cart</div>

        <div className="left-features">
          <div className="feature">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H20M9 12H20M9 19H20" stroke="#403EAB" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="5" cy="6" r="1.5" fill="#403EAB"/>
              <circle cx="5" cy="12" r="1.5" fill="#403EAB"/>
              <circle cx="5" cy="18" r="1.5" fill="#403EAB"/>
            </svg>
            <br />
            <span>Prepare List</span>
          </div>

          <div className="feature">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M6 20C6 20 18 16 18 8C18 5 15 3 12 3C9 3 6 5 6 8C6 16 18 20 18 20"
                stroke="#403EAB" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="8" r="2" fill="#403EAB"/>
            </svg>
            <br />
            <span>Follow Route</span>
          </div>

          <div className="feature">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#403EAB" strokeWidth="2"/>
              <path d="M12 7V12L15 14" stroke="#403EAB" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <br />
            <span>Save Time</span>
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="listChoiceContent">
          <h1>Have Your list Ready?</h1>
          <p>Scan the QR code with your phone to import your list</p>

          {/* Real QR code */}
          <div className="qr-box">
            <QRGenerator value={mobileUrl} size={qrSize} />
          </div>

          <p className="or-text">OR</p>

          <p className="small-text">
            Don't have a list ready? Lets make it together
          </p>

          <button 
            className="primary-btn" 
            onClick={async () => {
              try {
                await Promise.all([
                  fetch(`${API}/shopping-list/clear`, { method: "POST" }),
                  fetch(`${API}/cart/clear`, { method: "POST" })
                ]);
              } catch (e) {
                console.error("Failed to clear previous session data", e);
              }
              navigate("/create-list");
            }}
          >
            Make List
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListChoicePage;