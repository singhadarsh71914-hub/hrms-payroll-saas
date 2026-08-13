const fs = require('fs');
let c = fs.readFileSync('.env', 'utf8');
c = c.replace(/\\n/g, '\n');
fs.writeFileSync('.env', c);
console.log('Fixed .env');
