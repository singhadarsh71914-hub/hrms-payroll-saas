const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const companyInsertion = `  payroll_runs         PayrollRun[]
  employee_snapshots EmployeeIntelligenceSnapshot[]
  department_snapshots DepartmentIntelligenceSnapshot[]
  company_snapshots CompanyIntelligenceSnapshot[]`;
content = content.replace('  payroll_runs         PayrollRun[]', companyInsertion);

const employeeInsertion = `  attrition_scores EmployeeAttritionScore[]
  employee_snapshots EmployeeIntelligenceSnapshot[]`;
content = content.replace('  attrition_scores EmployeeAttritionScore[]', employeeInsertion);

const deptInsertion = `  employees            Employee[]                       @relation("EmployeeDepartment")
  department_snapshots DepartmentIntelligenceSnapshot[]`;
content = content.replace('  employees            Employee[]                       @relation("EmployeeDepartment")', deptInsertion);

const models = `
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
if (!content.includes('model EmployeeIntelligenceSnapshot')) {
  content += models;
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Schema updated successfully');
