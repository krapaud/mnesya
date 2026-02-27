const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fr = JSON.parse(fs.readFileSync('src/locales/fr.json', 'utf8'));

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const fullKey = prefix ? prefix + '.' + k : k;
    return typeof v === 'object' ? flattenKeys(v, fullKey) : [fullKey];
  });
}

const allKeys = flattenKeys(fr);

// Extract all t('...') keys from source files
const raw = execSync(
  `grep -rh "t('" src/ --include="*.tsx" --include="*.ts"`,
  { encoding: 'utf8' }
);
const usedKeys = new Set(
  [...raw.matchAll(/t\('([^']+)'\)/g)].map(m => m[1])
);

const unused = allKeys.filter(k => !usedKeys.has(k));
const missing = [...usedKeys].filter(k => !allKeys.includes(k));

console.log(`\n=== CLÉS DÉFINIES MAIS NON UTILISÉES (${unused.length}) ===`);
unused.forEach(k => console.log(' - ' + k));

console.log(`\n=== CLÉS UTILISÉES MAIS NON DÉFINIES (${missing.length}) ===`);
missing.forEach(k => console.log(' ! ' + k));
