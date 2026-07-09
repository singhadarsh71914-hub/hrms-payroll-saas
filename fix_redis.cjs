const fs = require('fs');
const path = require('path');
const dir = 'src/workers';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  
  content = content.replace(
    /const connection = new IORedis\([\s\S]*?maxRetriesPerRequest: null,?\s*\}\);/,
    `const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => times > 3 ? null : Math.min(times * 50, 2000)
});
connection.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') console.error('Redis error:', err.message);
});`
  );
  
  fs.writeFileSync(fp, content);
}
console.log('Fixed all workers');
