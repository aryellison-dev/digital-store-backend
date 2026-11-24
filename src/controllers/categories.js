const service = require('../services/categoryService');
const wrap = require('../utils/asyncHandler');
module.exports = {
  search: wrap(async (req, res) => res.json(await service.search(req.query))),
  find: wrap(async (req, res) => res.json(await service.find(req.params.id))),
  create: wrap(async (req, res) => res.status(201).json(await service.create(req.body))),
  update: wrap(async (req, res) => { await service.update(req.params.id, req.body); res.status(204).end(); }),
  remove: wrap(async (req, res) => { await service.remove(req.params.id); res.status(204).end(); }),
};
