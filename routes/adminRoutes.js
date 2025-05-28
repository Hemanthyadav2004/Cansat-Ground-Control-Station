const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Dummy isAdmin middleware that allows all requests for testing
const isAdmin = (req, res, next) => {
  console.log('isAdmin middleware called');
  next();
};

router.get('/users', isAdmin, async (req, res) => {
  try {
    console.log('Fetching users...');
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'isApproved', 'isDisabled','totpSecret', 'createdAt', 'updatedAt']
    });
    console.log('Users fetched:', users.length, users.map(u => ({id: u.id, updatedAt: u.updatedAt})));
    res.json(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

router.patch('/users/:id/approve', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isApproved = true;
    await user.save();
    res.json({ message: 'User approved' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Error approving user' });
  }
});

router.patch('/users/:id/disable', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isDisabled = true;
    await user.save();
    res.json({ message: 'User disabled' });
  } catch (error) {
    console.error('Error disabling user:', error);
    res.status(500).json({ message: 'Error disabling user' });
  }
});

router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

router.put('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { role } = req.body;
    if (role) user.role = role;
    await user.save();
    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

module.exports = router;
