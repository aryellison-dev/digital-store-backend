const bcrypt = require('bcrypt');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const v = require('../utils/validation');
const publicUser = user => ({ id: user.id, firstname: user.firstname, surname: user.surname, email: user.email });
async function find(id) {
  const user = await User.findByPk(v.id(id));
  if (!user) throw new AppError(404, 'Usuário não encontrado.');
  return publicUser(user);
}
async function create(body) {
  v.only(body, ['firstname', 'surname', 'email', 'password', 'confirmPassword'], ['firstname', 'surname', 'email', 'password', 'confirmPassword']);
  const firstname = v.nonEmpty(body.firstname, 'firstname');
  const surname = v.nonEmpty(body.surname, 'surname');
  const email = v.email(body.email);
  const password = v.nonEmpty(body.password, 'password', 72);
  if (password.length < 6) v.fail('password deve ter pelo menos 6 caracteres.');
  if (body.confirmPassword !== password) v.fail('confirmPassword não confere.');
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ firstname, surname, email, password: hash });
  return publicUser(user);
}
async function update(id, body) {
  v.only(body, ['firstname', 'surname', 'email']);
  if (!Object.keys(body).length) v.fail('Nenhum campo fornecido.');
  const values = {};
  if (body.firstname !== undefined) values.firstname = v.nonEmpty(body.firstname, 'firstname');
  if (body.surname !== undefined) values.surname = v.nonEmpty(body.surname, 'surname');
  if (body.email !== undefined) values.email = v.email(body.email);
  const user = await User.findByPk(v.id(id));
  if (!user) throw new AppError(404, 'Usuário não encontrado.');
  await user.update(values);
}
async function remove(id) {
  const user = await User.findByPk(v.id(id));
  if (!user) throw new AppError(404, 'Usuário não encontrado.');
  await user.destroy();
}
module.exports = { find, create, update, remove, publicUser };
