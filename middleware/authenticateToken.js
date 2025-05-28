const jwt = require('jsonwebtoken');

module.exports = function authenticateToken(req, res, next) {
  // Extract the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  // If no token is found, respond with 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Verify the token using your secret key
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      // If token verification fails, respond with 403 Forbidden
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    // Attach the decoded user information to the request object
    req.user = user;
    // Call the next middleware or route handler
    next();
  });
};
