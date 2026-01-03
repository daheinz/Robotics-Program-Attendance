const bcrypt = require('bcryptjs');

async function hashPin(pin) {
  const saltRounds = 10;
  return bcrypt.hash(pin.toString(), saltRounds);
}

async function verifyPin(pin, hash) {
  return bcrypt.compare(pin.toString(), hash);
}

module.exports = {
  hashPin,
  verifyPin,
};
