const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError, DatabaseError } = require('sequelize');
const AppError = require('../utils/AppError');
function notFound(req, res, next) { next(new AppError(404, 'Rota não encontrada.')); }
function errorHandler(err, req, res, next) {
  if (err instanceof UniqueConstraintError) return res.status(400).json({ error: 'Registro já existe (email ou slug duplicado).' });
  if (err instanceof ForeignKeyConstraintError) return res.status(400).json({ error: 'Operação viola referência de dados.' });
  if (err instanceof ValidationError) return res.status(400).json({ error: 'Erro de validação.', details: err.errors.map(e => e.message) });
  if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'JSON inválido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload muito grande.' });
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
  if (err.status === 404) return res.status(404).json({ error: 'Recurso não encontrado.' });
  if (err instanceof DatabaseError) console.error('Erro no banco:', err.message);
  else console.error('Erro interno:', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}
module.exports = { notFound, errorHandler };
