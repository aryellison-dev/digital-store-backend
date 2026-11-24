const { Category } = require('../models');
const AppError = require('../utils/AppError');
const v = require('../utils/validation');
const columns = ['id', 'name', 'slug', 'use_in_menu'];
const dto = c => ({ id: c.id, name: c.name, slug: c.slug, use_in_menu: Boolean(c.use_in_menu) });
function parse(body, create) {
  v.only(body, ['name', 'slug', 'use_in_menu'], create ? ['name', 'slug'] : []);
  if (!create && !Object.keys(body).length) v.fail('Nenhum campo fornecido.');
  const out = {};
  if (body.name !== undefined) out.name = v.nonEmpty(body.name, 'name');
  if (body.slug !== undefined) out.slug = v.slug(body.slug);
  if (body.use_in_menu !== undefined) out.use_in_menu = v.boolean(body.use_in_menu, 'use_in_menu');
  return out;
}
async function search(query) {
  const { limit, page } = v.pagination(query);
  const selected = v.fields(query.fields, columns);
  const where = {};
  if (query.use_in_menu !== undefined) {
    if (query.use_in_menu !== 'true' && query.use_in_menu !== 'false') v.fail('use_in_menu deve ser true ou false.');
    where.use_in_menu = query.use_in_menu === 'true';
  }
  const results = await Category.findAndCountAll({
    where,
    attributes: selected ? [...new Set(['id', ...selected])] : columns,
    order: [['id', 'ASC']],
    ...(limit === -1 ? {} : { limit, offset: (page - 1) * limit }),
  });
  return { data: results.rows.map(c => selected ? Object.fromEntries(Object.entries(dto(c)).filter(([k]) => k === 'id' || selected.includes(k))) : dto(c)), total: results.count, limit, page };
}
async function find(id) {
  const item = await Category.findByPk(v.id(id));
  if (!item) throw new AppError(404, 'Categoria não encontrada.');
  return dto(item);
}
async function create(body) { return dto(await Category.create(parse(body, true))); }
async function update(id, body) {
  const data = parse(body, false);
  const item = await Category.findByPk(v.id(id));
  if (!item) throw new AppError(404, 'Categoria não encontrada.');
  await item.update(data);
}
async function remove(id) {
  const item = await Category.findByPk(v.id(id));
  if (!item) throw new AppError(404, 'Categoria não encontrada.');
  await item.destroy();
}
module.exports = { search, find, create, update, remove };
