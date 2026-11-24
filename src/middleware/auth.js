const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { id } = require('../utils/validation');
function requireAuth(req, res, next) {
  const match = /^Bearer\s+(.+)$/i.exec(req.get('Authorization') || '');
  if (!match) return next(new AppError(401, 'Authorization: Bearer <token> obrigatório.'));
  if (!env.jwtSecret) return next(new AppError(500, 'JWT_SECRET não configurado.'));
  try {
    const payload = jwt.verify(match[1], env.jwtSecret, { algorithms: ['HS256'] });
    req.auth = { id: id(payload.sub), email: payload.email };
    return next();
  } catch (error) {
    return next(new AppError(401, 'Token inválido ou expirado.'));
  }
}
function requireOwner(req, res, next) {
  try {
    const target = id(req.params.id);
    if (req.auth.id !== target) return next(new AppError(403, 'Não é permitido alterar outro usuário.'));
    return next();
  } catch (error) { return next(error); }
}
module.exports = { requireAuth, requireOwner };
