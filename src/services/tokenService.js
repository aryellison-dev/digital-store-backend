const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const v = require('../utils/validation');
async function issue(body) {
  v.only(body, ['email', 'password'], ['email', 'password']);
  const email = v.email(body.email);
  const password = v.nonEmpty(body.password, 'password');
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError(400, 'Credenciais inválidas.');
  if (!env.jwtSecret || env.jwtSecret.length < 32) throw new AppError(500, 'JWT_SECRET deve ter pelo menos 32 caracteres.');
  return { token: jwt.sign({ email: user.email }, env.jwtSecret, { subject: String(user.id), algorithm: 'HS256', expiresIn: env.jwtExpiresIn }) };
}
module.exports = { issue };
