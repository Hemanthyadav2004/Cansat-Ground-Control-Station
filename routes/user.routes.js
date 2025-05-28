// routes/user.routes.js
const express = require('express');
const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll(); // Use your ORM logic
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
