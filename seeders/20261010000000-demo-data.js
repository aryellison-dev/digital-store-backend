'use strict';
// Seeder opcional: dados de demonstração, sem usuários/senhas predefinidos.
module.exports = {
  async up(qi) {
    const date = new Date();
    await qi.bulkInsert('categories', [
      { name: 'Tênis', slug: 'tenis', use_in_menu: true, created_at: date, updated_at: date },
      { name: 'Camisetas', slug: 'camisetas', use_in_menu: true, created_at: date, updated_at: date },
      { name: 'Acessórios', slug: 'acessorios', use_in_menu: true, created_at: date, updated_at: date },
    ], { ignoreDuplicates: true });
    await qi.bulkInsert('products', [
      { name: 'Tênis Digital Air', slug: 'tenis-digital-air', description: 'Tênis casual para o dia a dia', stock: 15, price: 249.9, price_with_discount: 189.9, enabled: true, use_in_menu: true, created_at: date, updated_at: date },
      { name: 'Camiseta Digital Classic', slug: 'camiseta-digital-classic', description: 'Camiseta de algodão', stock: 25, price: 89.9, price_with_discount: 69.9, enabled: true, use_in_menu: false, created_at: date, updated_at: date },
    ], { ignoreDuplicates: true });
    const [rows] = await qi.sequelize.query("SELECT id, slug FROM products WHERE slug IN ('tenis-digital-air','camiseta-digital-classic')");
    const [cats] = await qi.sequelize.query("SELECT id, slug FROM categories WHERE slug IN ('tenis','camisetas')");
    const map = Object.fromEntries(rows.map(p => [p.slug, p.id]));
    const categoryMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));
    if (map['tenis-digital-air'] && categoryMap.tenis) await qi.bulkInsert('product_categories', [{ product_id: map['tenis-digital-air'], category_id: categoryMap.tenis }], { ignoreDuplicates: true });
    if (map['camiseta-digital-classic'] && categoryMap.camisetas) await qi.bulkInsert('product_categories', [{ product_id: map['camiseta-digital-classic'], category_id: categoryMap.camisetas }], { ignoreDuplicates: true });
    if (map['tenis-digital-air']) await qi.bulkInsert('product_options', [{ product_id: map['tenis-digital-air'], title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: '38,39,40,41,42' }]);
  },
  async down(qi) {
    await qi.bulkDelete('products', { slug: ['tenis-digital-air', 'camiseta-digital-classic'] });
    await qi.bulkDelete('categories', { slug: ['tenis', 'camisetas', 'acessorios'] });
  },
};
