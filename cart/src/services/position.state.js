const db = require("../config/sqlite");

// In-memory fused position state.
// BLE provides absolute-ish correction (node-based), IMU provides smooth deltas.
const state = {
  nodeId: null,
  x: null,
  y: null,
  heading: 0, // radians
  source: "none",
  lastBleAt: null,
  lastImuAt: null,
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeAngle(rad) {
  if (typeof rad !== "number" || Number.isNaN(rad)) return 0;
  // normalize to [-pi, pi]
  let a = rad;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function getNodeXY(nodeId, callback) {
  db.get(
    `SELECT node_id, x, y FROM nodes WHERE node_id = ?`,
    [nodeId],
    (err, row) => {
      if (err) return callback(err, null);
      if (!row) return callback(null, null);
      callback(null, { x: row.x, y: row.y });
    }
  );
}

function updateCartPositionRow(nodeId) {
  db.run(
    `UPDATE cart_position SET node_id = ?, updated_at = datetime('now') WHERE id = 1`,
    [nodeId]
  );
}

function applyBleReading({ beaconId, rssi }, callback) {
  if (!beaconId) {
    return callback(null, {
      ok: false,
      message: "beaconId is required",
      state: getSnapshot(),
    });
  }

  db.get(
    `SELECT node_id FROM beacons WHERE beacon_id = ?`,
    [String(beaconId)],
    (err, row) => {
      if (err) return callback(err);
      if (!row) {
        return callback(null, {
          ok: false,
          message: `Unknown beaconId: ${beaconId}`,
          state: getSnapshot(),
        });
      }

      const nodeId = row.node_id;
      state.nodeId = nodeId;
      state.source = "ble";
      state.lastBleAt = nowIso();

      getNodeXY(nodeId, (xyErr, xy) => {
        if (xyErr) return callback(xyErr);
        if (xy) {
          // BLE correction snaps position to the beacon's mapped node.
          state.x = xy.x;
          state.y = xy.y;
        }

        updateCartPositionRow(nodeId);

        callback(null, {
          ok: true,
          message: "BLE update applied",
          beaconId,
          rssi: typeof rssi === "number" ? rssi : null,
          state: getSnapshot(),
        });
      });
    }
  );
}

function applyImuUpdate(payload, callback) {
  const { x, y, heading, dx, dy, dHeading } = payload || {};

  const hasAbs = x !== undefined || y !== undefined || heading !== undefined;
  const hasDelta = dx !== undefined || dy !== undefined || dHeading !== undefined;

  if (!hasAbs && !hasDelta) {
    return callback(null, {
      ok: false,
      message: "Provide {x,y,heading} and/or {dx,dy,dHeading}",
      state: getSnapshot(),
    });
  }

  // Absolute update (if provided)
  if (x !== undefined && x !== null) state.x = Number(x);
  if (y !== undefined && y !== null) state.y = Number(y);
  if (heading !== undefined && heading !== null) state.heading = normalizeAngle(Number(heading));

  // Delta update (if provided)
  if (hasDelta) {
    const ddx = dx !== undefined && dx !== null ? Number(dx) : 0;
    const ddy = dy !== undefined && dy !== null ? Number(dy) : 0;
    const dH = dHeading !== undefined && dHeading !== null ? Number(dHeading) : 0;

    // If heading is known, interpret dx,dy as cart-local and rotate into global.
    const h = typeof state.heading === "number" ? state.heading : 0;
    const gx = ddx * Math.cos(h) - ddy * Math.sin(h);
    const gy = ddx * Math.sin(h) + ddy * Math.cos(h);

    if (state.x === null || state.x === undefined) state.x = 0;
    if (state.y === null || state.y === undefined) state.y = 0;

    state.x += gx;
    state.y += gy;
    state.heading = normalizeAngle(h + dH);
  }

  state.source = hasAbs ? "imu_abs" : "imu_delta";
  state.lastImuAt = nowIso();

  callback(null, {
    ok: true,
    message: "IMU update applied",
    state: getSnapshot(),
  });
}

function resetToNode(nodeId, callback) {
  if (nodeId === null || nodeId === undefined) {
    return callback(null, {
      ok: false,
      message: "nodeId is required",
      state: getSnapshot(),
    });
  }

  const id = Number(nodeId);
  state.nodeId = id;
  state.source = "reset";
  state.lastBleAt = nowIso();

  getNodeXY(id, (err, xy) => {
    if (err) return callback(err);
    if (!xy) {
      return callback(null, {
        ok: false,
        message: `Unknown nodeId: ${nodeId}`,
        state: getSnapshot(),
      });
    }

    state.x = xy.x;
    state.y = xy.y;
    updateCartPositionRow(id);

    callback(null, { ok: true, message: "Reset applied", state: getSnapshot() });
  });
}

function getSnapshot() {
  return {
    nodeId: state.nodeId,
    x: state.x,
    y: state.y,
    heading: state.heading,
    source: state.source,
    lastBleAt: state.lastBleAt,
    lastImuAt: state.lastImuAt,
  };
}

function getCurrent(callback) {
  // If we have x/y in memory, return it.
  if (state.x !== null && state.x !== undefined && state.y !== null && state.y !== undefined) {
    return callback(null, getSnapshot());
  }

  // Otherwise fall back to DB node_id.
  db.get(`SELECT node_id FROM cart_position WHERE id = 1`, (err, row) => {
    if (err) return callback(err);

    const nodeId = row?.node_id;
    if (!nodeId) return callback(null, getSnapshot());

    state.nodeId = nodeId;
    getNodeXY(nodeId, (xyErr, xy) => {
      if (xyErr) return callback(xyErr);
      if (xy) {
        state.x = xy.x;
        state.y = xy.y;
      }
      callback(null, getSnapshot());
    });
  });
}

module.exports = {
  applyBleReading,
  applyImuUpdate,
  resetToNode,
  getCurrent,
};