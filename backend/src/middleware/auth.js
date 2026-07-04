import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

/**
 * Middleware to authenticate requests via JWT tokens.
 * Injects req.user with decoded payload: { id, email, role, groupId }
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = decodedUser;
    next();
  });
};

/**
 * Middleware generator to enforce Role-Based Access Control (RBAC).
 * @param {string} role - Required role ('ADMIN' or 'STUDENT')
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: requires ${role} privileges.` });
    }

    next();
  };
};
