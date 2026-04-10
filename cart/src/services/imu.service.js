function startIMU(onMove) {

    setInterval(() => {

        const moving = Math.random() > 0.6;

        if (moving) {
            console.log("🚶 Movement detected");
            onMove();
        }

    }, 3000);
}

module.exports = { startIMU };