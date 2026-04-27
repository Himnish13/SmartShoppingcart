require('dotenv').config();
const db = require('./src/config/db');
const userService = require('./src/services/user.services');

async function seed() {
  try {
    console.log("Cleaning up old users...");
    await new Promise((resolve) => {
      db.query("DELETE FROM users WHERE phone_number IN ('admin', 'staff', '9876543210', '9390207310', '9908552005')", resolve);
    });

    console.log("Adding ADMIN user...");
    await userService.addUser({
      phone_number: "9390207310",
      password: "adminpassword",
      role: "ADMIN"
    });
    console.log("Admin user created (identifier: 9390207310, password: adminpassword)");

    console.log("Adding STAFF user...");
    await userService.addUser({
      phone_number: "9908552005",
      password: "staffpassword",
      role: "STAFF"
    });
    console.log("Staff user created (identifier: 9908552005, password: staffpassword)");

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log("Users already exist in the database.");
    } else {
      console.error("Error creating users:", err);
    }
  } finally {
    // wait a bit for logs, then exit
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
}

seed();
