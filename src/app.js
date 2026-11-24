const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errors');
const app = express();
app.disable('x-powered-by');
// Mantém option[45] como chave literal nos filtros (não converte em objeto).
app.set('query parser', 'simple');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: (origin, cb) => {
  if (!origin || env.frontendOrigins.includes(origin)) return cb(null, true);
  return cb(new (require('./utils/AppError'))(403, 'Origem não permitida pelo CORS.'));
} }));
app.use(express.json({ limit: '20mb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/media', express.static(path.resolve(__dirname, '../media'), { dotfiles: 'deny', fallthrough: false, maxAge: '1d' }));
const spec = YAML.load(path.resolve(__dirname, '../docs/openapi.yaml'));
app.get('/openapi.json', (req, res) => res.json(spec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
app.use('/v1', routes);
app.use(notFound);
app.use(errorHandler);
module.exports = app;
