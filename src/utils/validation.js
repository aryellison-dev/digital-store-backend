const AppError = require('./AppError');
const fail = message => { throw new AppError(400, message); };
const obj = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clean = value => typeof value === 'string' ? value.trim() : value;
function bodyObject(value) { if (!obj(value)) fail('Corpo JSON inválido.'); return value; }
function nonEmpty(value, key, max = 255) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`${key} deve ser um texto de 1 a ${max} caracteres.`);
  return value.trim();
}
function boolean(value, key) { if (typeof value !== 'boolean') fail(`${key} deve ser booleano.`); return value; }
function int(value, key, min = 0) {
  if (!Number.isSafeInteger(value) || value < min) fail(`${key} deve ser inteiro >= ${min}.`);
  return value;
}
function id(value, key = 'id') {
  const s = String(value);
  if (!/^\d+$/.test(s)) fail(`${key} inválido.`);
  return int(Number(s), key, 1);
}
function price(value, key) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(`${key} deve ser número >= 0.`);
  return value;
}
function email(value) {
  const e = nonEmpty(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail('email inválido.');
  return e;
}
function slug(value) {
  const s = nonEmpty(value, 'slug', 255);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) fail('slug deve usar letras minúsculas, números e hífens.');
  return s;
}
function pagination(query) {
  const number = (value, key, fallback, min) => {
    if (value === undefined) return fallback;
    if (!/^-?\d+$/.test(String(value))) fail(`${key} inválido.`);
    return int(Number(value), key, min);
  };
  const limit = query.limit === '-1' || query.limit === -1 ? -1 : number(query.limit, 'limit', 12, 1);
  const page = number(query.page, 'page', 1, 1);
  if (limit > 100) fail('limit máximo é 100 (use -1 para todos).');
  return { limit, page };
}
function csvIds(value, key) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return [...new Set(value.map(v => id(v, key)))];
  }
  if (typeof value !== 'string' || !value.trim()) fail(`${key} inválido.`);
  return [...new Set(value.split(',').map(v => id(v.trim(), key)))];
}
function fields(value, available) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !value.trim()) fail('fields inválido.');
  const items = [...new Set(value.split(',').map(v => v.trim()))];
  if (items.some(v => !available.includes(v))) fail('fields contém campos inválidos.');
  return items;
}
function allowed(body, keys) {
  const extras = Object.keys(body).filter(k => !keys.includes(k));
  if (extras.length) fail(`Campos não permitidos: ${extras.join(', ')}`);
}
function only(body, keys, required = []) {
  bodyObject(body); allowed(body, keys);
  for (const key of required) if (body[key] === undefined) fail(`${key} é obrigatório.`);
  return body;
}
module.exports = { fail, obj, clean, bodyObject, nonEmpty, boolean, int, id, price, email, slug, pagination, csvIds, fields, only };
