const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

async function decodeToken(req) {
  const token = getTokenFromHeader(req);
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  const payload = jwt.verify(token, secret);
  // Fetch fresh user data to ensure role/active state is current
  const user = await User.findById(payload.sub);
  if (!user) return null;
  return {
    id: user.id,
    alias: user.alias,
    role: user.role,
  };
}

async function requireAuth(req, res, next) {
  try {
    const user = await decodeToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function requireMentorOrCoach(req, res, next) {
  try {
    const user = await decodeToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.role !== 'mentor' && user.role !== 'coach') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function requireCoach(req, res, next) {
  try {
    const user = await decodeToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Coach permissions required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Optional auth - attaches user if token present, but does not error if missing/invalid
async function optionalAuth(req, res, next) {
  try {
    const user = await decodeToken(req);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.error('Optional auth error:', error);
  } finally {
    next();
  }
}

module.exports = {
  requireAuth,
  requireMentorOrCoach,
  requireCoach,
  optionalAuth,
};
