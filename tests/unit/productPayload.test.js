const { validatePayload, parseOption } = require('../../src/utils/product');
describe('Payload de produto e opções', () => {
  const data = { name: 'Tênis Digital', slug: 'tenis-digital', price: 149.9, price_with_discount: 119.9 };
  test('aceita criação completa', () => {
    const parsed = validatePayload({ ...data, enabled: true, stock: 3, category_ids: [1, 2] }, true);
    expect(parsed.categories).toEqual([1, 2]);
    expect(parsed.data.stock).toBe(3);
  });
  test('preço é obrigatório na criação', () => {
    expect(() => validatePayload({ name: 'A', slug: 'a' }, true)).toThrow('price');
  });
  test('rejeita campos arbitrários', () => {
    expect(() => validatePayload({ ...data, admin: true }, true)).toThrow('Campos não permitidos');
  });
  test('converte radius 4px e alias value', () => {
    expect(parseOption({ title: 'Tamanho', radius: '4px', value: ['38', '39'] }, true)).toEqual({ title: 'Tamanho', radius: 4, values: '38,39' });
  });
  test('opções aceitam shape e type apenas conhecidos', () => {
    expect(() => parseOption({ title: 'Cor', shape: 'triangle', values: ['azul'] }, true)).toThrow('shape');
  });
  test('valores não aceitam vírgula embutida', () => {
    expect(() => parseOption({ title: 'Tamanho', values: ['P,M'] }, true)).toThrow('vírgulas');
  });
});
