import React from "react";
import "./ListChoicePage.css";
import { useNavigate } from "react-router-dom";
const ListChoicePage = () => {
    const navigate = useNavigate();
  return (
    <div className="listchoice-container">

      <div className="left-section">
        <div className="logo">🛒 Smart Cart</div>

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

        <div className="top-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="content">
          <h1>Have Your list Ready?</h1>
          <p>Scan the QR code to import your list</p>

          <div className="qr-box">
            <span className="qr-icon">▣ ▣ ▣</span>
          </div>

          <p className="or-text">OR</p>

          <p className="small-text">
            Don't have a list ready? Lets make it together
          </p>

          <button className="primary-btn" onClick={() => navigate("/create-list")}>
            Make List
          </button>
        </div>

      </div>
    </div>
  );
};

export default ListChoicePage;