const fs = require('fs');

const files = [
  'client/src/pages/Documents.tsx',
  'client/src/pages/EmployeeDetails.tsx',
  'client/src/pages/EmployeePayslips.tsx',
  'client/src/pages/MyTax.tsx',
  'client/src/pages/Payroll.tsx',
  'client/src/pages/TaxManagement.tsx',
  'client/src/services/analytics.service.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/link\.parentNode\?\.removeChild\(link\);\n/g, "link.parentNode?.removeChild(link);\n      setTimeout(() => window.URL.revokeObjectURL(url), 100);\n");
  fs.writeFileSync(file, newContent);
}
console.log('Patched URL revoke');
