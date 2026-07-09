const fs = require('fs');
const path = require('path');
const dir = 'src/workers';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  
  // Find "export const someWorker = new Worker(...)"
  const workerMatch = content.match(/export const (\w+) = new Worker\(/);
  if (workerMatch) {
    const workerName = workerMatch[1];
    if (!content.includes(`${workerName}.on('error'`)) {
      content += `\n${workerName}.on('error', (err: any) => {\n  if (err.code !== 'ECONNREFUSED') console.error('${workerName} error:', err.message);\n});\n`;
      fs.writeFileSync(fp, content);
    }
  }
}
console.log('Fixed all workers errors');
