import React, { useEffect, useMemo, useRef, useState } from "react";
import "./MapDisplay.css";

const MapDisplay = ({
  storeLayout,
  nodes,
  path,
  currentNode,
  currentPosition,
  fullscreen,
  onFullscreenToggle,
  showLegend = true,
  offers = [],
  onOfferClick,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const normalizedPath = useMemo(() => {
    if (!path) return [];
    return path
      .map((id) => (id === null || id === undefined ? null : String(id)))
      .filter(Boolean);
  }, [path]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const ro = new ResizeObserver(() => {
      setContainerSize({
        width: el.offsetWidth || 0,
        height: el.offsetHeight || 0,
      });
    });

    ro.observe(el);
    setContainerSize({
      width: el.offsetWidth || 0,
      height: el.offsetHeight || 0,
    });

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !storeLayout) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = containerSize.width;
    const height = containerSize.height;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    if (!nodes || Object.keys(nodes).length === 0) return;

    const nodeArray = Object.values(nodes);
    const xs = nodeArray.map((n) => n.x);
    const ys = nodeArray.map((n) => n.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 40;
    const graphWidth = maxX - minX || 10;
    const graphHeight = maxY - minY || 10;

    const scale = Math.min(
      (width - 2 * padding) / graphWidth,
      (height - 2 * padding) / graphHeight
    );

    const offsetX =
      padding + (width - 2 * padding - graphWidth * scale) / 2;
    const offsetY =
      padding + (height - 2 * padding - graphHeight * scale) / 2;

    const toCanvasX = (x) => offsetX + (x - minX) * scale;
    const toCanvasY = (y) => offsetY + (y - minY) * scale;

    ctx.clearRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      offsetX - 10,
      offsetY - 10,
      graphWidth * scale + 20,
      graphHeight * scale + 20
    );

    // Draw aisles
    if (storeLayout.aisles) {
      storeLayout.aisles.forEach((aisle) => {
        if (aisle.x != null && aisle.y != null) {
          const x = toCanvasX(aisle.x);
          const y = toCanvasY(aisle.y);

          ctx.fillStyle = "#eef2ff";
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = "#c7d2fe";
          ctx.stroke();

          ctx.fillStyle = "#4f46e5";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            aisle.aisle_name?.substring(0, 3) || "A",
            x,
            y
          );
        }
      });
    }

    // Draw path
    if (normalizedPath.length > 1) {
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.beginPath();

      normalizedPath.forEach((id, i) => {
        const node = nodes[id];
        if (!node) return;

        const x = toCanvasX(node.x);
        const y = toCanvasY(node.y);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    }

    // Draw nodes
    normalizedPath.forEach((id, i) => {
      const node = nodes[id];
      if (!node) return;

      const x = toCanvasX(node.x);
      const y = toCanvasY(node.y);

      ctx.fillStyle = i === 0 ? "#3b82f6" : "#22c55e";
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Current position
    if (currentPosition?.x != null && currentPosition?.y != null) {
      const x = toCanvasX(currentPosition.x);
      const y = toCanvasY(currentPosition.y);

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw offers as markers at their node positions (show even if not in shopping list)
    markersRef.current = [];
    if (Array.isArray(offers) && offers.length > 0) {
      offers.forEach((o) => {
        const nid = o.node_id || o.nodeId || o.node;
        if (!nid) return;
        const node = nodes[String(nid)];
        if (!node) return;
        const x = toCanvasX(node.x);
        const y = toCanvasY(node.y);

        const r = 10;
        // Offer marker (gold circle)
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();

        // Discount text
        ctx.fillStyle = "#000";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${o.discount ?? ""}%`, x, y);

        markersRef.current.push({ x, y, r, offer: o });
      });
    }

  }, [
    storeLayout,
    nodes,
    normalizedPath,
    currentNode,
    currentPosition,
    containerSize,
  ]);

  // Canvas click -> detect offer marker clicks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const found = markersRef.current.find((m) => {
        const dx = m.x - x;
        const dy = m.y - y;
        return Math.hypot(dx, dy) <= (m.r || 10) + 4;
      });

      if (found && onOfferClick) {
        onOfferClick(found.offer);
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [offers, nodes, onOfferClick, containerSize]);

  return (
    <div
      className={`map-display-container ${fullscreen ? "fullscreen" : ""}`}
      ref={containerRef}
      onDoubleClick={() => onFullscreenToggle && onFullscreenToggle()}
    >
      <div className="map-top-bar">
        <h3>Store Map</h3>
        <button onClick={onFullscreenToggle}>⛶</button>
      </div>

      <canvas ref={canvasRef} className="map-canvas" />

      {showLegend && (
        <div className="map-legend">
          <div><span className="dot start"></span> Start</div>
          <div><span className="dot path"></span> Path</div>
          <div><span className="dot current"></span> You</div>
        </div>
      )}
    </div>
  );
};

export default MapDisplay;