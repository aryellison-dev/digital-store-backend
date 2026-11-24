const jwt = require('jsonwebtoken');
const { requireAuth, requireOwner } = require('../../src/middleware/auth');
const env = require('../../src/config/env');
describe('Autorização JWT', () => {
  const originalSecret = env.jwtSecret;
  beforeAll(() => { env.jwtSecret = 'secret_test_0123456789_0123456789_012345'; });
  afterAll(() => { env.jwtSecret = originalSecret; });
  const req = auth => ({ get: () => auth, params: { id: '7' } });
  test('nega rota sem token com 401', () => {
    const next = jest.fn();
    requireAuth(req(''), {}, next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });
  test('aceita token assinado e atribui req.auth', () => {
    const token = jwt.sign({ email: 'ana@exemplo.com' }, env.jwtSecret, { subject: '7' });
    const request = req(`Bearer ${token}`);
    const next = jest.fn();
    requireAuth(request, {}, next);
    expect(request.auth).toEqual({ id: 7, email: 'ana@exemplo.com' });
    expect(next).toHaveBeenCalledWith();
  });
  test('nega token adulterado', () => {
    const next = jest.fn();
    requireAuth(req('Bearer abc.def.ghi'), {}, next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });
  test('owner exige sujeito correspondente ao ID', () => {
    const next = jest.fn();
    const request = req(''); request.auth = { id: 8 };
    requireOwner(request, {}, next);
    expect(next.mock.calls[0][0].status).toBe(403);
  });
});
