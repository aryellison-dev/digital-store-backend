const { Op } = require('sequelize');
const models = require('../models');
const { sequelize, Product, ProductImage, ProductOption, Category, ProductCategory } = models;
const AppError = require('../utils/AppError');
const v = require('../utils/validation');
const img = require('../utils/images');
const { validatePayload, parseOption } = require('../utils/product');
const include = [
  { model: ProductImage, as: 'images' },
  { model: ProductOption, as: 'options' },
  { model: Category, as: 'categories', through: { attributes: [] } },
];
const selectable = ['id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price', 'price_with_discount', 'category_ids', 'images', 'options'];
const dto = (product, req) => ({
  id: product.id,
  enabled: Boolean(product.enabled),
  name: product.name,
  slug: product.slug,
  use_in_menu: Boolean(product.use_in_menu),
  stock: product.stock,
  description: product.description,
  price: product.price,
  price_with_discount: product.price_with_discount,
  category_ids: (product.categories || []).map(c => c.id).sort((a,b) => a - b),
  images: (product.images || []).map(i => ({ id: i.id, enabled: Boolean(i.enabled), content: img.url(i.path, req) })).sort((a,b) => a.id - b.id),
  options: (product.options || []).map(o => ({ id: o.id, title: o.title, shape: o.shape, radius: o.radius, type: o.type, values: o.values.split(',') })).sort((a,b) => a.id - b.id),
});
const project = (product, req, selected) => {
  const data = dto(product, req);
  return selected ? Object.fromEntries(Object.entries(data).filter(([key]) => key === 'id' || selected.includes(key))) : data;
};
async function search(query, req) {
  const { limit, page } = v.pagination(query);
  const selected = v.fields(query.fields, selectable);
  const and = [];
  if (query.match !== undefined) {
    const match = v.nonEmpty(query.match, 'match', 100);
    // Escaping LIKE wildcards keeps the search literal instead of broad wildcard matching.
    const escaped = match.replace(/[\\%_]/g, '\\$&');
    and.push({ [Op.or]: [{ name: { [Op.like]: `%${escaped}%` } }, { description: { [Op.like]: `%${escaped}%` } }] });
  }
  const categoryIds = v.csvIds(query.category_ids, 'category_ids');
  if (categoryIds !== undefined) {
    const matches = await ProductCategory.findAll({ where: { category_id: { [Op.in]: categoryIds } }, attributes: ['product_id'], raw: true });
    and.push({ id: { [Op.in]: [...new Set(matches.map(m => m.product_id))] } });
  }
  if (query['price-range'] !== undefined) {
    const match = /^(\d+(?:\.\d{1,2})?)-(\d+(?:\.\d{1,2})?)$/.exec(String(query['price-range']));
    if (!match) v.fail('price-range deve ter formato mínimo-máximo (ex.: 100-200).');
    const min = Number(match[1]); const max = Number(match[2]);
    if (min > max || !Number.isFinite(max)) v.fail('price-range inválido.');
    and.push({ price_with_discount: { [Op.between]: [min, max] } });
  }
  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith('option[')) continue;
    const idMatch = /^option\[(\d+)\]$/.exec(key);
    if (!idMatch) v.fail('Filtro option inválido.');
    const optionId = v.id(idMatch[1]);
    if (typeof value !== 'string' || !value.trim()) v.fail('Filtro option precisa de valores separados por vírgula.');
    const sought = value.split(',').map(item => item.trim());
    const option = await ProductOption.findByPk(optionId);
    const matched = option && option.values.split(',').some(item => sought.includes(item));
    and.push({ id: { [Op.in]: matched ? [option.product_id] : [] } });
  }
  const where = and.length ? { [Op.and]: and } : {};
  const total = await Product.count({ where });
  const products = await Product.findAll({
    where,
    include,
    order: [['id', 'ASC']],
    ...(limit === -1 ? {} : { limit, offset: (page - 1) * limit }),
  });
  return { data: products.map(p => project(p, req, selected)), total, limit, page };
}
async function find(id, req) {
  const p = await Product.findByPk(v.id(id), { include });
  if (!p) throw new AppError(404, 'Produto não encontrado.');
  return dto(p, req);
}
async function ensureCategories(ids, transaction) {
  if (ids === undefined) return;
  const count = await Category.count({ where: { id: { [Op.in]: ids } }, transaction });
  if (count !== ids.length) v.fail('Uma ou mais categorias não existem.');
}
async function setCategories(product, ids, transaction) {
  if (ids === undefined) return;
  await product.setCategories(ids, { transaction });
}
async function updateOptions(product, items, creating, transaction) {
  if (items === undefined) return;
  const seen = new Set();
  for (const item of items) {
    if (!v.obj(item)) v.fail('options deve conter objetos.');
    const existingId = item.id === undefined ? null : v.id(item.id, 'options.id');
    if (creating && existingId) v.fail('Cadastro de produto não aceita options.id.');
    if (existingId) {
      if (seen.has(existingId)) v.fail('ID de opção repetido.');
      seen.add(existingId);
      const current = await ProductOption.findOne({ where: { id: existingId, product_id: product.id }, transaction });
      if (!current) throw new AppError(404, 'Opção não encontrada neste produto.');
      if (item.deleted === true) { await current.destroy({ transaction }); continue; }
      const data = parseOption(item, false);
      await current.update(data, { transaction });
    } else {
      const data = parseOption(item, true);
      await ProductOption.create({ ...data, product_id: product.id }, { transaction });
    }
  }
}
async function updateImages(product, items, creating, transaction, newlySaved, obsolete) {
  if (items === undefined) return;
  const seen = new Set();
  for (const item of items) {
    if (!v.obj(item)) v.fail('images deve conter objetos.');
    v.only(item, ['id', 'enabled', 'deleted', 'type', 'content']);
    const existingId = item.id === undefined ? null : v.id(item.id, 'images.id');
    if (creating && existingId) v.fail('Cadastro de produto não aceita images.id.');
    if (item.enabled !== undefined) v.boolean(item.enabled, 'images.enabled');
    if (item.deleted !== undefined) v.boolean(item.deleted, 'images.deleted');
    if (existingId) {
      if (seen.has(existingId)) v.fail('ID de imagem repetido.');
      seen.add(existingId);
      const current = await ProductImage.findOne({ where: { id: existingId, product_id: product.id }, transaction });
      if (!current) throw new AppError(404, 'Imagem não encontrada neste produto.');
      if (item.deleted === true) { obsolete.push(current.path); await current.destroy({ transaction }); continue; }
      const changes = {};
      if (item.enabled !== undefined) changes.enabled = item.enabled;
      if (item.content !== undefined && !/^https?:\/\//i.test(item.content)) {
        const replacement = await img.save(item.content, item.type);
        newlySaved.push(replacement); obsolete.push(current.path);
        changes.path = replacement;
      } // Conteúdo URL em item existente é tratado como referência; o id mantém o arquivo atual.
      if (Object.keys(changes).length) await current.update(changes, { transaction });
    } else {
      if (item.deleted) v.fail('Não é possível deletar imagem nova.');
      if (!item.content || !item.type) v.fail('Imagem nova precisa de type e content em base64.');
      const pathname = await img.save(item.content, item.type);
      newlySaved.push(pathname);
      await ProductImage.create({ product_id: product.id, path: pathname, enabled: item.enabled ?? false }, { transaction });
    }
  }
}
async function create(body, req) {
  const input = validatePayload(body, true);
  const newFiles = [];
  try {
    let createdId;
    await sequelize.transaction(async t => {
      await ensureCategories(input.categories, t);
      const product = await Product.create(input.data, { transaction: t });
      createdId = product.id;
      await setCategories(product, input.categories, t);
      await updateOptions(product, input.options, true, t);
      await updateImages(product, input.images, true, t, newFiles, []);
    });
    return find(createdId, req);
  } catch (error) {
    await Promise.all(newFiles.map(img.remove));
    throw error;
  }
}
async function update(id, body) {
  const productId = v.id(id);
  const input = validatePayload(body, false);
  const newFiles = [];
  const obsolete = [];
  try {
    await sequelize.transaction(async t => {
      const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product) throw new AppError(404, 'Produto não encontrado.');
      await ensureCategories(input.categories, t);
      if (Object.keys(input.data).length) await product.update(input.data, { transaction: t });
      await setCategories(product, input.categories, t);
      await updateOptions(product, input.options, false, t);
      await updateImages(product, input.images, false, t, newFiles, obsolete);
    });
    await Promise.all(obsolete.map(img.remove));
  } catch (error) {
    await Promise.all(newFiles.map(img.remove));
    throw error;
  }
}
async function remove(id) {
  const productId = v.id(id);
  const obsolete = [];
  await sequelize.transaction(async t => {
    const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!product) throw new AppError(404, 'Produto não encontrado.');
    const images = await ProductImage.findAll({ where: { product_id: productId }, transaction: t });
    obsolete.push(...images.map(x => x.path));
    await product.destroy({ transaction: t }); // FKs remove imagens, opções e categorias da junção.
  });
  await Promise.all(obsolete.map(img.remove));
}
module.exports = { search, find, create, update, remove, dto };
