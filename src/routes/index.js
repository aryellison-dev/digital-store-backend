const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const users = require('../controllers/users');
const categories = require('../controllers/categories');
const products = require('../controllers/products');
const { requireAuth, requireOwner } = require('../middleware/auth');
const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Muitas tentativas. Tente mais tarde.' } });

router.get('/user/:id', users.find);
router.post('/user', users.create); // cadastro público para possibilitar o primeiro usuário
router.post('/user/token', loginLimiter, users.token); // login público por definição
router.put('/user/:id', requireAuth, requireOwner, users.update);
router.delete('/user/:id', requireAuth, requireOwner, users.remove);

router.get('/category/search', categories.search);
router.get('/category/:id', categories.find);
router.post('/category', requireAuth, categories.create);
router.put('/category/:id', requireAuth, categories.update);
router.delete('/category/:id', requireAuth, categories.remove);

router.get('/product/search', products.search);
router.get('/product/:id', products.find);
router.post('/product', requireAuth, products.create);
router.put('/product/:id', requireAuth, products.update);
router.delete('/product/:id', requireAuth, products.remove);

module.exports = router;
