const fs = require('fs');
let lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

// 1. Add relations to Company
let companyIndex = lines.findIndex(l => l.includes('payroll_runs                   PayrollRun[]'));
if (companyIndex !== -1 && !lines.find(l => l.includes('employee_snapshots             EmployeeIntelligenceSnapshot[]'))) {
  lines.splice(companyIndex + 1, 0, 
    '  employee_snapshots             EmployeeIntelligenceSnapshot[]',
    '  department_snapshots           DepartmentIntelligenceSnapshot[]',
    '  company_snapshots              CompanyIntelligenceSnapshot[]'
  );
}

// 2. Add relations to Employee
let employeeIndex = lines.findIndex(l => l.includes('attrition_scores EmployeeAttritionScore[]'));
if (employeeIndex !== -1 && !lines.find(l => l.includes('employee_snapshots EmployeeIntelligenceSnapshot[]'))) {
  lines.splice(employeeIndex + 1, 0, '  employee_snapshots EmployeeIntelligenceSnapshot[]');
} else {
    employeeIndex = lines.findIndex(l => l.includes('attrition_scores               EmployeeAttritionScore[]'));
    if (employeeIndex !== -1 && !lines.find(l => l.includes('employee_snapshots             EmployeeIntelligenceSnapshot[]'))) {
        lines.splice(employeeIndex + 1, 0, '  employee_snapshots             EmployeeIntelligenceSnapshot[]');
    }
}

// 3. Add relations to Department
let departmentIndex = lines.findIndex(l => l.includes('employees        Employee[] @relation("EmployeeDepartment")'));
if (departmentIndex !== -1 && !lines.find(l => l.includes('department_snapshots DepartmentIntelligenceSnapshot[]'))) {
  lines.splice(departmentIndex + 1, 0, '  department_snapshots DepartmentIntelligenceSnapshot[]');
} else {
    departmentIndex = lines.findIndex(l => l.includes('employees       Employee[]'));
    if (departmentIndex !== -1 && !lines.find(l => l.includes('department_snapshots DepartmentIntelligenceSnapshot[]'))) {
        lines.splice(departmentIndex + 1, 0, '  department_snapshots DepartmentIntelligenceSnapshot[]');
    }
}

fs.writeFileSync('prisma/schema.prisma', lines.join('\n'));

// Append the models only if they aren't there
let text = fs.readFileSync('prisma/schema.prisma', 'utf8');
if (!text.includes('model EmployeeIntelligenceSnapshot')) {
  text += `

model EmployeeIntelligenceSnapshot {
  id                   String    @id @default(uuid())
  company_id           String
  employee_id          String
  snapshot_date        DateTime
  attrition_risk       String
  burnout_risk         String
  attendance_score     Float
  productivity_score   Float
  overtime_risk        String
  forecast_payload     Json?
  anomalies            Json?
  recommendations      Json?
  created_at           DateTime  @default(now())

  company              Company   @relation(fields: [company_id], references: [id])
  employee             Employee  @relation(fields: [employee_id], references: [id])

  @@index([company_id, snapshot_date])
  @@index([employee_id, snapshot_date])
}

model DepartmentIntelligenceSnapshot {
  id                   String    @id @default(uuid())
  company_id           String
  department_id        String
  snapshot_date        DateTime
  attrition_risk       String
  burnout_risk         String
  attendance_score     Float
  productivity_score   Float
  overtime_risk        String
  forecast_payload     Json?
  anomalies            Json?
  recommendations      Json?
  created_at           DateTime  @default(now())

  company              Company   @relation(fields: [company_id], references: [id])
  department           Department @relation(fields: [department_id], references: [id])

  @@index([company_id, snapshot_date])
  @@index([department_id, snapshot_date])
}

model CompanyIntelligenceSnapshot {
  id                   String    @id @default(uuid())
  company_id           String
  snapshot_date        DateTime
  attrition_risk       String
  burnout_risk         String
  attendance_score     Float
  productivity_score   Float
  overtime_risk        String
  forecast_payload     Json?
  anomalies            Json?
  recommendations      Json?
  created_at           DateTime  @default(now())

  company              Company   @relation(fields: [company_id], references: [id])

  @@index([company_id, snapshot_date])
}
`;
  fs.writeFileSync('prisma/schema.prisma', text);
}

console.log('Fixed schema correctly');
