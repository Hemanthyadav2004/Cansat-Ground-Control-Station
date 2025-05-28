const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../db"); // PostgreSQL database connection
const router = express.Router();

// Register route
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role } = req.body;

    try {
      // Check if user already exists
      const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ msg: "User already exists" });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert user into database
      const newUser = await pool.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
        [email, hashedPassword, role || "user"] // Default role is "user"
      );

      // Generate JWT token
      const token = jwt.sign({ id: newUser.rows[0].id }, "your_jwt_secret", { expiresIn: "1h" });

      res.json({ token, user: newUser.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);


module.exports = router;
