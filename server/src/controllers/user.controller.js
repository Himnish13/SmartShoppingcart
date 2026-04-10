const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userService = require("../services/user.services");

const SECRET = process.env.JWT_SECRET || "smartcart_secret";

async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const result = await userService.login(identifier, password);

    res.json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
}

async function addUser(req, res) {
  try {
    await userService.addUser(req.body);
    res.json({ message: "Staff added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteStaff(req, res) {
  try {
    await userService.deleteStaff(req.params.id);
    res.json({ message: "Staff removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getStaff(req, res) {
  try {
    const data = await userService.getStaff();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  login,
  addUser,
  deleteStaff,
  getStaff
};