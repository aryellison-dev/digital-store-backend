require('dotenv').config();
const mode = process.env.NODE_ENV || 'development';
const toPositiveInt = (key, fallback) => {
  const raw = Number(process.env[key]);
  return Number.isSafeInteger(raw) && raw > 0 ? raw : fallback;
};
module.exports = {
  mode,
  port: toPositiveInt('PORT', 3001),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toPositiveInt('DB_PORT', 3306),
    database: process.env.DB_NAME || 'digital_store',
    username: process.env.DB_USER || 'digital_store',
    password: process.env.DB_PASSWORD || '',
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, ''),
  maxImageBytes: toPositiveInt('MAX_IMAGE_BYTES', 5 * 1024 * 1024),
};
