const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (!pkg.scripts) pkg.scripts = {};
pkg.scripts.seed = 'tsx src/scripts/seed.ts';
pkg.scripts['load-test'] = 'tsx src/scripts/load-test.ts';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('Successfully updated package.json scripts with seed and load-test.');
