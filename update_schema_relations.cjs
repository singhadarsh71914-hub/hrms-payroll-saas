const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Ensure Company gets all snapshot arrays
schema = schema.replace(
  'payroll_runs                   PayrollRun[]',
  'payroll_runs                   PayrollRun[]\n  employee_snapshots             EmployeeIntelligenceSnapshot[]\n  department_snapshots           DepartmentIntelligenceSnapshot[]\n  company_snapshots              CompanyIntelligenceSnapshot[]'
);

// Ensure Employee gets snapshot array
schema = schema.replace(
  'attrition_scores               EmployeeAttritionScore[]',
  'attrition_scores               EmployeeAttritionScore[]\n    employee_snapshots             EmployeeIntelligenceSnapshot[]'
);

// Ensure Department gets snapshot array
schema = schema.replace(
  'employees       Employee[]',
  'employees       Employee[]\n  department_snapshots DepartmentIntelligenceSnapshot[]'
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Fixed missing relations');
