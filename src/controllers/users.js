const users = require('../services/userService');
const tokens = require('../services/tokenService');
const wrap = require('../utils/asyncHandler');
module.exports = {
  find: wrap(async (req, res) => res.json(await users.find(req.params.id))),
  create: wrap(async (req, res) => res.status(201).json(await users.create(req.body))),
  update: wrap(async (req, res) => { await users.update(req.params.id, req.body); res.status(204).end(); }),
  remove: wrap(async (req, res) => { await users.remove(req.params.id); res.status(204).end(); }),
  token: wrap(async (req, res) => res.json(await tokens.issue(req.body))),
};
