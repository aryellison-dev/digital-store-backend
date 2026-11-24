const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const v = require('./validation');
const STORAGE_ROOT = path.resolve(__dirname, '../../media');
const folder = path.join(STORAGE_ROOT, 'products');
function decodeImage(content, declaredType) {
  if (typeof content !== 'string') v.fail('Conteúdo da imagem deve ser base64.');
  if (typeof declaredType !== 'string' || !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(declaredType)) v.fail('type inválido: use image/png, image/jpeg ou image/webp.');
  const base64 = content.replace(/^data:image\/(?:png|jpeg|jpg|webp);base64,/i, '');
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 === 1) v.fail('Imagem base64 inválida.');
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length || buffer.length > env.maxImageBytes) v.fail('Imagem excede limite de tamanho ou está vazia.');
  const png = buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  const jpg = buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
  const webp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  const extension = png ? 'png' : jpg ? 'jpg' : webp ? 'webp' : null;
  if (!extension) v.fail('Arquivo não corresponde a uma imagem PNG, JPEG ou WEBP.');
  if (declaredType === 'image/png' && !png || ['image/jpeg', 'image/jpg'].includes(declaredType) && !jpg || declaredType === 'image/webp' && !webp) v.fail('type não corresponde ao conteúdo da imagem.');
  return { buffer, extension };
}
async function save(content, type) {
  const { buffer, extension } = decodeImage(content, type);
  await fs.mkdir(folder, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(folder, filename), buffer, { flag: 'wx' });
  return `products/${filename}`;
}
async function remove(relativePath) {
  if (typeof relativePath !== 'string' || !/^products\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/.test(relativePath)) return;
  try { await fs.unlink(path.resolve(STORAGE_ROOT, relativePath)); }
  catch (error) { if (error.code !== 'ENOENT') console.error('Falha ao limpar imagem:', error.message); }
}
function url(pathname, req) {
  const base = env.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${base}/media/${pathname}`;
}
module.exports = { save, remove, url, decodeImage, STORAGE_ROOT };
