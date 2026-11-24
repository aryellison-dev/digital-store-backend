const v = require('./validation');
const scalars = ['enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price', 'price_with_discount'];
function parseScalars(body, create) {
  const out = {};
  for (const field of scalars) {
    if (body[field] === undefined) continue;
    const val = body[field];
    if (field === 'name') out[field] = v.nonEmpty(val, 'name');
    else if (field === 'slug') out[field] = v.slug(val);
    else if (field === 'enabled' || field === 'use_in_menu') out[field] = v.boolean(val, field);
    else if (field === 'stock') out[field] = v.int(val, 'stock', 0);
    else if (field === 'description') out[field] = val === null ? null : v.nonEmpty(val, 'description');
    else if (field === 'price' || field === 'price_with_discount') out[field] = v.price(val, field);
  }
  if (create) for (const req of ['name', 'slug', 'price', 'price_with_discount']) if (out[req] === undefined) v.fail(`${req} obrigatório.`);
  return out;
}
function parseOption(item, isNew) {
  if (!v.obj(item)) v.fail('options deve conter objetos.');
  v.only(item, ['id', 'deleted', 'title', 'shape', 'radius', 'type', 'values', 'value']);
  if (isNew && item.deleted) v.fail('Não é possível deletar opção nova.');
  if (item.deleted !== undefined) v.boolean(item.deleted, 'deleted');
  const data = {};
  if (item.title !== undefined) data.title = v.nonEmpty(item.title, 'title');
  if (item.shape !== undefined) {
    if (!['square', 'circle'].includes(item.shape)) v.fail('shape deve ser square ou circle.');
    data.shape = item.shape;
  }
  if (item.radius !== undefined) {
    const radius = typeof item.radius === 'string' && /^\d+px$/.test(item.radius) ? Number(item.radius.slice(0, -2)) : item.radius;
    data.radius = v.int(radius, 'radius');
  }
  if (item.type !== undefined) {
    if (!['text', 'color'].includes(item.type)) v.fail('type deve ser text ou color.');
    data.type = item.type;
  }
  const values = item.values === undefined ? item.value : item.values;
  if (values !== undefined) {
    if (!Array.isArray(values) || !values.length || values.length > 30) v.fail('values deve ser array com 1 a 30 itens.');
    const normalized = values.map(x => v.nonEmpty(x, 'values', 50));
    if (normalized.some(x => x.includes(','))) v.fail('Os valores não podem conter vírgulas.');
    const joined = normalized.join(',');
    if (joined.length > 255) v.fail('values deve ter no máximo 255 caracteres.');
    data.values = joined;
  }
  if (isNew) for (const req of ['title', 'values']) if (data[req] === undefined) v.fail(`options.${req} obrigatório.`);
  if (!isNew && !item.deleted && !Object.keys(data).length) v.fail('Opção existente sem alterações.');
  return data;
}
function validatePayload(body, creating) {
  v.only(body, [...scalars, 'category_ids', 'images', 'options'], creating ? ['name', 'slug', 'price', 'price_with_discount'] : []);
  if (!creating && !Object.keys(body).length) v.fail('Nenhum campo fornecido.');
  const data = parseScalars(body, creating);
  const categories = body.category_ids !== undefined ? v.csvIds(body.category_ids, 'category_ids') : undefined;
  if (body.images !== undefined && (!Array.isArray(body.images) || body.images.length > 20)) v.fail('images deve ser array (máximo 20).');
  if (body.options !== undefined && (!Array.isArray(body.options) || body.options.length > 20)) v.fail('options deve ser array (máximo 20).');
  return { data, categories, images: body.images, options: body.options };
}
module.exports = { parseScalars, parseOption, validatePayload };
