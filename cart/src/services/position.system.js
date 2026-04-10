const bleService = require("./ble.service");
const imuService = require("./imu.service");
const { startAutoSync } = require("./position.manager");

function initPositionSystem() {

    // start BLE scanning
    bleService.startBLE();

    // IMU triggers re-check (optional)
    imuService.startIMU(() => {
        console.log("🔄 Movement → BLE will update");
    });

    // start periodic sync
    startAutoSync();
}

module.exports = { initPositionSystem };