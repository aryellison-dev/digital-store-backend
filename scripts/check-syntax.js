const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(ent => {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) return walk(p);
    return p.endsWith('.js') ? [p] : [];
  });
}
const files = ['src', 'migrations', 'tests', 'seeders', 'scripts'].flatMap(folder => walk(path.join(root, folder)));
for (const file of files) execFileSync(process.execPath, ['--check', file]);
console.log(`✓ Sintaxe válida em ${files.length} arquivos JavaScript.`);
