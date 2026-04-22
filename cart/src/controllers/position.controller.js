const positionState = require("../services/position.state");

exports.getCurrent = (req, res) => {
  positionState.getCurrent((err, snapshot) => {
    if (err) {
      return res.status(500).json({ message: "Failed to read position", error: err.message });
    }
    return res.json(snapshot);
  });
};

exports.postBle = (req, res) => {
  const { beaconId, rssi } = req.body || {};
  positionState.applyBleReading({ beaconId, rssi }, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to apply BLE", error: err.message });
    }
    return res.status(result.ok ? 200 : 400).json(result);
  });
};

exports.postImu = (req, res) => {
  positionState.applyImuUpdate(req.body || {}, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to apply IMU", error: err.message });
    }
    return res.status(result.ok ? 200 : 400).json(result);
  });
};

exports.reset = (req, res) => {
  const { nodeId } = req.body || {};
  positionState.resetToNode(nodeId, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to reset position", error: err.message });
    }
    return res.status(result.ok ? 200 : 400).json(result);
  });
};