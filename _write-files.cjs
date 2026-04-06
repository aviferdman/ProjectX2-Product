const fs = require('fs');
const path = require('path');

const files = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.resolve(relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('wrote:', relPath, '(' + content.length + ' bytes)');
}