const { decodeImage, remove } = require('../../src/utils/images');
describe('Armazenamento seguro de imagens', () => {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');
  test('reconhece assinatura PNG', () => {
    const result = decodeImage(png, 'image/png');
    expect(result.extension).toBe('png');
  });
  test('bloqueia incompatibilidade MIME', () => {
    expect(() => decodeImage(png, 'image/jpeg')).toThrow('não corresponde');
  });
  test('bloqueia texto como arquivo', () => {
    expect(() => decodeImage(Buffer.from('notanimage').toString('base64'), 'image/png')).toThrow();
  });
  test('ignorará remoção de caminho arbitrário', async () => {
    await expect(remove('../qualquer-arquivo')).resolves.toBeUndefined();
  });
});
