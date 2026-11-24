'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('products', {
      id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      enabled: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
      name: { type: S.STRING, allowNull: false },
      slug: { type: S.STRING, allowNull: false, unique: true },
      use_in_menu: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
      stock: { type: S.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      description: { type: S.STRING, allowNull: true },
      price: { type: S.FLOAT, allowNull: false },
      price_with_discount: { type: S.FLOAT, allowNull: false },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
    await qi.addIndex('products', ['name']);
    await qi.addIndex('products', ['price_with_discount']);
  },
  async down(qi) { await qi.dropTable('products'); },
};
