'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('categories', {
      id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: S.STRING, allowNull: false },
      slug: { type: S.STRING, allowNull: false, unique: true },
      use_in_menu: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
  },
  async down(qi) { await qi.dropTable('categories'); },
};
