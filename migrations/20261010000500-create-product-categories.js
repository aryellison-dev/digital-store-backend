'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('product_categories', {
      product_id: { type: S.INTEGER.UNSIGNED, primaryKey: true, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      category_id: { type: S.INTEGER.UNSIGNED, primaryKey: true, allowNull: false, references: { model: 'categories', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    });
    await qi.addIndex('product_categories', ['category_id']);
  },
  async down(qi) { await qi.dropTable('product_categories'); },
};
