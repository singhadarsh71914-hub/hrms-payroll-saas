const fs = require('fs');
const file = 'client/src/pages/EmployeeDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('if (showCamera && !modelsLoaded)', 'if (showCamera && !modelsLoaded && !BYPASS_LIVENESS)');
fs.writeFileSync(file, content);
console.log('Bypassed face models');
