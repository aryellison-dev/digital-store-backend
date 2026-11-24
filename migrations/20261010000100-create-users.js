'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('users', {
      id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      firstname: { type: S.STRING, allowNull: false },
      surname: { type: S.STRING, allowNull: false },
      email: { type: S.STRING, allowNull: false, unique: true },
      password: { type: S.STRING, allowNull: false },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
  },
  async down(qi) { await qi.dropTable('users'); },
};
