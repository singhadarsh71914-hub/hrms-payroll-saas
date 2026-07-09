const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newModels = `

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

schema += newModels;

// Also I need to add array relations to Company, Employee, Department
schema = schema.replace(
  'attrition_scores               EmployeeAttritionScore[]',
  'attrition_scores               EmployeeAttritionScore[]\n    intelligence_snapshots         EmployeeIntelligenceSnapshot[]'
);

schema = schema.replace(
  'departments     Department[]',
  'departments     Department[]\n    employee_snapshots EmployeeIntelligenceSnapshot[]\n    department_snapshots DepartmentIntelligenceSnapshot[]\n    company_snapshots CompanyIntelligenceSnapshot[]'
);

schema = schema.replace(
  'employees   Employee[]',
  'employees   Employee[]\n    intelligence_snapshots DepartmentIntelligenceSnapshot[]'
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Updated schema');
