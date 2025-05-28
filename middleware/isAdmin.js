const { User } = require('../models');

module.exports = async (req, res, next) => {
  // Check if the user is authenticated (make sure req.user exists)
  if (!req.user || !req.user.id) {
    console.log('User not authenticated or missing user id in request');
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    // Fetch the user from the database
    const user = await User.findByPk(req.user.id);
    console.log(`isAdmin check for user id: ${req.user.id}, role in DB: ${user ? user.role : 'user not found'}`);

    // Check if the user exists and has the admin role
    if (user && user.role === 'admin') {
      return next(); // User is admin, proceed to the next route handler
    }

    // If the user doesn't have admin role or doesn't exist, deny access
    return res.status(403).json({ message: 'You are not authorized to perform this action' });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
