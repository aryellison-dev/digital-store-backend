/*
 * Testes reais com MySQL isolado. Executar SOMENTE com RUN_DB_TESTS=1
 * e DB_NAME terminando em _test, após aplicar migrations.
 */
const run = process.env.RUN_DB_TESTS === '1';
const suite = run ? describe : describe.skip;
suite('API E2E com MySQL', () => {
  let request, app, sequelize;
  const suffix = Math.random().toString(16).slice(2, 10);
  const email = `teste-${suffix}@example.org`;
  let token, userId, categoryId, productId;
  beforeAll(async () => {
    if (!process.env.DB_NAME || !process.env.DB_NAME.endsWith('_test')) throw new Error('DB_NAME deve terminar em _test para testes de integração.');
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'integration_test_secret_012345678901234567890';
    request = require('supertest');
    app = require('../../src/app');
    sequelize = require('../../src/models').sequelize;
    await sequelize.authenticate();
  });
  afterAll(async () => {
    try {
      if (productId) await request(app).delete(`/v1/product/${productId}`).set('Authorization', `Bearer ${token}`);
      if (categoryId) await request(app).delete(`/v1/category/${categoryId}`).set('Authorization', `Bearer ${token}`);
      if (userId) await request(app).delete(`/v1/user/${userId}`).set('Authorization', `Bearer ${token}`);
    } finally { if (sequelize) await sequelize.close(); }
  });
  test('health funciona', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' });
  });
  test('cadastro público, senha oculta e login', async () => {
    const created = await request(app).post('/v1/user').send({ firstname: 'Ana', surname: 'Test', email, password: 'super-secret-123', confirmPassword: 'super-secret-123' }).expect(201);
    userId = created.body.id;
    expect(created.body.password).toBeUndefined();
    const auth = await request(app).post('/v1/user/token').send({ email, password: 'super-secret-123' }).expect(200);
    token = auth.body.token;
    expect(typeof token).toBe('string');
    const found = await request(app).get(`/v1/user/${userId}`).expect(200);
    expect(found.body).toMatchObject({ id: userId, email });
  });
  test('nega criação de categoria sem token', async () => {
    await request(app).post('/v1/category').send({ name: 'A', slug: `categoria-${suffix}` }).expect(401);
  });
  test('CRUD de categorias incluindo filtros', async () => {
    const created = await request(app).post('/v1/category').set('Authorization', `Bearer ${token}`).send({ name: 'Teste', slug: `teste-${suffix}`, use_in_menu: true }).expect(201);
    categoryId = created.body.id;
    const listed = await request(app).get('/v1/category/search?use_in_menu=true&limit=1').expect(200);
    expect(listed.body.limit).toBe(1);
    expect(listed.body.total).toBeGreaterThanOrEqual(1);
    const updated = await request(app).put(`/v1/category/${categoryId}`).set('Authorization', `Bearer ${token}`).send({ name: 'Teste atualizado' }).expect(204);
    expect(updated.text).toBe('');
    const found = await request(app).get(`/v1/category/${categoryId}`).expect(200);
    expect(found.body.name).toBe('Teste atualizado');
  });
  test('CRUD de produtos, relações, filtro e código 204', async () => {
    const newProduct = {
      enabled: true, name: 'Tênis teste E2E', slug: `tenis-e2e-${suffix}`, stock: 5,
      price: 200, price_with_discount: 150, category_ids: [categoryId],
      options: [{ title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', values: ['38', '39'] }],
    };
    const created = await request(app).post('/v1/product').set('Authorization', `Bearer ${token}`).send(newProduct).expect(201);
    productId = created.body.id;
    expect(created.body.category_ids).toContain(categoryId);
    expect(created.body.options[0]).toMatchObject({ radius: 4, values: ['38', '39'] });
    const searched = await request(app).get(`/v1/product/search?match=E2E&category_ids=${categoryId}&price-range=100-200`).expect(200);
    expect(searched.body.data.some(p => p.id === productId)).toBe(true);
    const optionId = created.body.options[0].id;
    const searchedOption = await request(app).get(`/v1/product/search?option[${optionId}]=38`).expect(200);
    expect(searchedOption.body.data.some(p => p.id === productId)).toBe(true);
    await request(app).put(`/v1/product/${productId}`).set('Authorization', `Bearer ${token}`).send({ stock: 6, options: [{ id: optionId, values: ['40'] }] }).expect(204);
    const updated = await request(app).get(`/v1/product/${productId}`).expect(200);
    expect(updated.body.stock).toBe(6);
    expect(updated.body.options[0].values).toEqual(['40']);
    await request(app).delete(`/v1/product/${productId}`).set('Authorization', `Bearer ${token}`).expect(204);
    productId = null;
    await request(app).get(`/v1/product/${created.body.id}`).expect(404);
  });
  test('retorna validação para dados inválidos e 404 quando ausente', async () => {
    await request(app).post('/v1/product').set('Authorization', `Bearer ${token}`).send({ name: 'inválido' }).expect(400);
    await request(app).get('/v1/category/2147483647').expect(404);
  });
});
