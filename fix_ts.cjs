const fs = require('fs');

let f = fs.readFileSync('src/routes/intelligence.ts', 'utf8');
f = f.replace(/from '\.\.\/middleware\/auth'/g, "from '../middleware/auth.ts'");
f = f.replace(/from '\.\.\/services\/queue\.service'/g, "from '../services/queue.service.ts'");
f = f.replace(/from '\.\.\/lib\/prisma'/g, "from '../lib/prisma.ts'");
f = f.replace(/from '\.\.\/services\/intelligence\/attendance\.service'/g, "from '../services/intelligence/attendance.service.ts'");
f = f.replace(/from '\.\.\/services\/intelligence\/payroll-forecast\.service'/g, "from '../services/intelligence/payroll-forecast.service.ts'");
f = f.replace(/from '\.\.\/services\/metrics\.service'/g, "from '../services/metrics.service.ts'");
f = f.replace(/req, res/g, 'req: any, res: any');
fs.writeFileSync('src/routes/intelligence.ts', f);

f = fs.readFileSync('src/services/intelligence/attendance.service.ts', 'utf8');
f = f.replace(/from '\.\.\/\.\.\/lib\/prisma'/g, "from '../../lib/prisma.ts'");
f = f.replace(/from '\.\.\/metrics\.service'/g, "from '../metrics.service.ts'");
f = f.replace(/data\.map\(\(employee\)/g, 'data.map((employee: any)');
f = f.replace(/attendance\.forEach\(\(record\)/g, 'attendance.forEach((record: any)');
fs.writeFileSync('src/services/intelligence/attendance.service.ts', f);

f = fs.readFileSync('src/services/intelligence/attrition.service.ts', 'utf8');
f = f.replace(/from '\.\.\/\.\.\/lib\/prisma'/g, "from '../../lib/prisma.ts'");
f = f.replace(/from '\.\.\/metrics\.service'/g, "from '../metrics.service.ts'");
f = f.replace(/data\.map\(\(employee\)/g, 'data.map((employee: any)');
f = f.replace(/attendance\.forEach\(a/g, 'attendance.forEach((a: any)');
f = f.replace(/results\.map\(r/g, 'results.map((r: any)');
f = f.replace(/\.catch\(async \(e\)/g, '.catch(async (e: any)');
fs.writeFileSync('src/services/intelligence/attrition.service.ts', f);

f = fs.readFileSync('src/services/intelligence/payroll-forecast.service.ts', 'utf8');
f = f.replace(/from '\.\.\/\.\.\/lib\/prisma'/g, "from '../../lib/prisma.ts'");
f = f.replace(/from '\.\.\/metrics\.service'/g, "from '../metrics.service.ts'");
f = f.replace(/activeEmployees\.forEach\(e/g, 'activeEmployees.forEach((e: any)');
fs.writeFileSync('src/services/intelligence/payroll-forecast.service.ts', f);

f = fs.readFileSync('src/workers/intelligence.worker.ts', 'utf8');
f = f.replace(/from '\.\.\/services\/intelligence\/attendance\.service'/g, "from '../services/intelligence/attendance.service.ts'");
f = f.replace(/from '\.\.\/services\/intelligence\/attrition\.service'/g, "from '../services/intelligence/attrition.service.ts'");
f = f.replace(/from '\.\.\/services\/intelligence\/payroll-forecast\.service'/g, "from '../services/intelligence/payroll-forecast.service.ts'");
f = f.replace(/from '\.\.\/services\/metrics\.service'/g, "from '../services/metrics.service.ts'");
fs.writeFileSync('src/workers/intelligence.worker.ts', f);

console.log('Fixed typescript errors');
