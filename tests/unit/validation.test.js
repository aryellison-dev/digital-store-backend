const v = require('../../src/utils/validation');
describe('Validação comum', () => {
  test('IDs são inteiros positivos', () => {
    expect(v.id('12')).toBe(12);
    expect(() => v.id('0')).toThrow('id');
    expect(() => v.id('1 OR 1=1')).toThrow('id');
  });
  test('email normaliza e valida', () => {
    expect(v.email(' Ana@EXAMPLE.COM ')).toBe('ana@example.com');
    expect(() => v.email('sem-arroba')).toThrow('email');
  });
  test('paginacao aplica limites e padrão', () => {
    expect(v.pagination({})).toEqual({ limit: 12, page: 1 });
    expect(v.pagination({ limit: '-1', page: '99' })).toEqual({ limit: -1, page: 99 });
    expect(() => v.pagination({ limit: '101' })).toThrow('limit');
    expect(() => v.pagination({ page: '0' })).toThrow('page');
  });
  test('slug rejeita espaços e caracteres inválidos', () => {
    expect(v.slug('tenis-nike-1')).toBe('tenis-nike-1');
    expect(() => v.slug('Tênis Nike')).toThrow('slug');
  });
  test('valida precos sem arredondar silenciosamente', () => {
    expect(v.price(199.9, 'price')).toBe(199.9);
    expect(() => v.price(-1, 'price')).toThrow('price');
    expect(() => v.price('200', 'price')).toThrow('price');
  });
  test('csv de IDs mantém números únicos', () => {
    expect(v.csvIds('1,2,2', 'category_ids')).toEqual([1, 2]);
    expect(v.csvIds([], 'category_ids')).toEqual([]);
    expect(() => v.csvIds('1,a', 'category_ids')).toThrow();
  });
  test('fields somente de lista permitida', () => {
    expect(v.fields('name,slug', ['id', 'name', 'slug'])).toEqual(['name', 'slug']);
    expect(() => v.fields('password', ['name'])).toThrow();
  });
});
