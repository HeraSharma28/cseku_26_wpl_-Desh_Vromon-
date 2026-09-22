const jwt = require('jsonwebtoken');

// Checks that a valid login token was sent. Blocks the request if not.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
}

// Lets a route run whether or not the user is logged in, but attaches
// req.userId / req.userRole when a valid token IS present. Used for things
// like "show favorite status if logged in, but still work for guests".
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.role;
  } catch (err) { /* ignore invalid token for optional routes */ }
  next();
}

// Checks the logged-in user has one of the allowed roles (FR-04: Role-Based Access Control).
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: 'You do not have permission to access this.' });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
