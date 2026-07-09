const fs = require('fs');
let lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

function addRelation(modelName, relationString) {
  const startIdx = lines.findIndex(l => l.trim().startsWith(`model ${modelName} {`));
  if (startIdx === -1) return;
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === '}');
  if (endIdx === -1) return;
  
  // check if relationString already exists in this model
  for (let i = startIdx + 1; i < endIdx; i++) {
    if (lines[i].includes(relationString.split(' ')[0])) return;
  }
  
  lines.splice(endIdx, 0, `  ${relationString}`);
}

// 1. Add fields to existing models
addRelation('Company', 'employee_snapshots EmployeeIntelligenceSnapshot[]');
addRelation('Company', 'department_snapshots DepartmentIntelligenceSnapshot[]');
addRelation('Company', 'company_snapshots CompanyIntelligenceSnapshot[]');
addRelation('Company', 'intelligence_anomalies IntelligenceAnomaly[]');

addRelation('Employee', 'employee_snapshots EmployeeIntelligenceSnapshot[]');
addRelation('Employee', 'intelligence_anomalies IntelligenceAnomaly[]');
addRelation('Employee', 'attrition_scores EmployeeAttritionScore[]');
addRelation('Employee', 'base_salary Decimal? @db.Decimal(10, 2)');

addRelation('Department', 'department_snapshots DepartmentIntelligenceSnapshot[]');
addRelation('Department', 'intelligence_anomalies IntelligenceAnomaly[]');

addRelation('Attendance', 'over_time_hours Decimal? @db.Decimal(10, 2)');
addRelation('EmployeeAttritionScore', 'employee Employee @relation(fields: [employee_id], references: [id])');

let text = lines.join('\n');

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

model ScheduledReport {
  id          String    @id @default(uuid())
  company_id  String
  report_type String
  frequency   String
  recipients  Json
  enabled     Boolean   @default(true)
  last_run_at DateTime?
  next_run_at DateTime?
  created_at  DateTime  @default(now())

  @@index([company_id])
}
`;

if (!text.includes('model EmployeeIntelligenceSnapshot')) {
  text += newModels;
}

fs.writeFileSync('prisma/schema.prisma', text);
console.log('Fixed schema correctly');
