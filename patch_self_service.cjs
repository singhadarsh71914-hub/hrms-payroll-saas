const fs = require('fs');
const path = 'src/routes/self-service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/manager_id: true/g, 'reporting_manager_id: true');
code = code.replace(/targetEmployee\.manager_id/g, 'targetEmployee.reporting_manager_id');

fs.writeFileSync(path, code);
console.log('Patched self-service.ts');
