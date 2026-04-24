import React from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRGenerator({ value }) {
  if (!value) {
    return (
      <div style={{
        width: 160,
        height: 160,
        background: "#f0f0f0",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#aaa",
        fontSize: 13,
      }}>
        Loading…
      </div>
    );
  }

  return (
    <QRCodeSVG
      value={value}
      size={160}
      bgColor="#ffffff"
      fgColor="#4141a8"
      level="M"
      style={{ borderRadius: 12 }}
    />
  );
}
