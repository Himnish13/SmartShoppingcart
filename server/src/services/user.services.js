const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const SECRET = process.env.JWT_SECRET || "smartcart_secret";

async function login(identifier, password) {
  const user = await userModel.findUser(identifier);

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign(
    {
      user_id: user.user_id,
      role: user.role
    },
    SECRET,
    { expiresIn: "1d" }
  );

  return {
    message: "Login successful",
    token,
    role: user.role,
    user_id: user.user_id
  };
}
function addUser(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const { phone_number, password, role } = data;

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        `INSERT INTO users (phone_number, password_hash, role, is_active)
         VALUES (?, ?, ?, 1)`,
        [phone_number, hashedPassword, role],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

function deleteStaff(user_id) {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE users SET is_active = 0 WHERE user_id = ?`,
      [user_id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

function getStaff() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT user_id, phone_number, role, is_active
       FROM users
       WHERE role = 'STAFF'`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

module.exports = {
  login,
    addUser,
    deleteStaff,
    getStaff
};