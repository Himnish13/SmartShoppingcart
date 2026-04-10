// const noble = require("@abandonware/noble");
// const db = require("../config/sqlite");
// const { updatePosition } = require("./position.manager");

// function startBLE() {

//     noble.on("stateChange", (state) => {
//         if (state === "poweredOn") {
//             noble.startScanning([], true);
//         } else {
//             noble.stopScanning();
//         }
//     });

//     noble.on("discover", (peripheral) => {

//         const beaconId = peripheral.id;
//         const rssi = peripheral.rssi;

//         if (rssi < -75) return; 

//         db.get(
//             `SELECT node_id FROM beacons WHERE beacon_id = ?`,
//             [beaconId],
//             (err, row) => {

//                 if (!row) return;

//                 updatePosition(row.node_id);
//             }
//         );
//     });
// }

// module.exports = { startBLE };