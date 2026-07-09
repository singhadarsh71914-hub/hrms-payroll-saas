const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const employeeInsertion = `  attendance                     Attendance[]
  attrition_scores               EmployeeAttritionScore[]
  employee_snapshots             EmployeeIntelligenceSnapshot[]`;
content = content.replace('  attendance                     Attendance[]', employeeInsertion);

const deptInsertion = `  employees        Employee[] @relation("EmployeeDepartment")
  department_snapshots DepartmentIntelligenceSnapshot[]`;
content = content.replace('  employees        Employee[] @relation("EmployeeDepartment")', deptInsertion);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Fixed missing fields');
