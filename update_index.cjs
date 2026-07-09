const fs = require('fs');
let content = fs.readFileSync('src/index.ts', 'utf8');
content += "\nimport './workers/snapshot.worker.ts';\n";
fs.writeFileSync('src/index.ts', content);
