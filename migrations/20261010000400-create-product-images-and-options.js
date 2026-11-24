'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('product_images', {
      id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: { type: S.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      enabled: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
      path: { type: S.STRING, allowNull: false },
    });
    await qi.createTable('product_options', {
      id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: { type: S.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      title: { type: S.STRING, allowNull: false },
      shape: { type: S.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
      radius: { type: S.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      type: { type: S.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
      values: { type: S.STRING, allowNull: false },
    });
    await qi.addIndex('product_images', ['product_id']);
    await qi.addIndex('product_options', ['product_id']);
  },
  async down(qi) {
    await qi.dropTable('product_options');
    await qi.dropTable('product_images');
  },
};
