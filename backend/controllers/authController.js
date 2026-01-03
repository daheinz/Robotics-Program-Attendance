const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      alias: user.alias,
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

class AuthController {
  static async login(req, res) {
    try {
      const { alias, pin } = req.body;

      if (!alias || !pin) {
        return res.status(400).json({ error: 'Alias and PIN are required' });
      }

      const user = await User.findByAlias(alias);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPin = await User.verifyPin(user.id, pin);
      if (!isValidPin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = signToken(user);
      const { pin_hash, ...userWithoutPin } = user;

      res.json({
        token,
        user: {
          id: userWithoutPin.id,
          alias: userWithoutPin.alias,
          role: userWithoutPin.role,
          firstName: userWithoutPin.first_name,
          lastName: userWithoutPin.last_name,
        },
      });
    } catch (error) {
      console.error('Error during login:', error);
      if (error.message === 'JWT_SECRET is not set') {
        return res.status(500).json({ error: 'Server not configured for auth' });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  }
}

module.exports = AuthController;
