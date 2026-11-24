const app = require('./app');
const { sequelize } = require('./models');
const env = require('./config/env');
async function main() {
  if (!env.jwtSecret || env.jwtSecret.length < 32) throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres no arquivo .env.');
  await sequelize.authenticate();
  const server = app.listen(env.port, () => console.log(`API Digital Store disponível em http://localhost:${env.port} | Swagger: /api-docs`));
  const shutdown = async () => {
    server.close(async () => { await sequelize.close(); process.exit(0); });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
main().catch(error => { console.error('Falha ao iniciar servidor:', error.message); process.exit(1); });
