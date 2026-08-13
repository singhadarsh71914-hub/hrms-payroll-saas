const fs = require('fs');

// Fix performance.ts
let perf = fs.readFileSync('src/routes/performance.ts', 'utf8');
perf = perf.replace(/req\.params\.id/g, '(req.params.id as string)');
fs.writeFileSync('src/routes/performance.ts', perf);

// Fix attendance.service.ts
let att = fs.readFileSync('src/services/attendance.service.ts', 'utf8');
att = att.replace(/include: \{ breaks: true \}/g, 'include: { attendance_breaks: true }');
att = att.replace(/existing\.breaks/g, 'existing.attendance_breaks');
att = att.replace(/data: \{[\s]*attendance_id/g, 'data: { id: require("crypto").randomUUID(), attendance_id');
fs.writeFileSync('src/services/attendance.service.ts', att);

// Fix payroll.service.ts
let pay = fs.readFileSync('src/services/payroll.service.ts', 'utf8');
pay = pay.replace(/base_salary:\s*employee\.base_salary/g, 'base_salary: employee.base_salary ? Number(employee.base_salary) : undefined');
fs.writeFileSync('src/services/payroll.service.ts', pay);

console.log('Fixed TypeScript errors');
