const bleService = require("./ble.service");
const imuService = require("./imu.service");
const { startAutoSync } = require("./position.manager");

function initPositionSystem() {

    
    bleService.startBLE();

    imuService.startIMU(() => {
        console.log("🔄 Movement → BLE will update");
    });

    
    startAutoSync();
}

module.exports = { initPositionSystem };