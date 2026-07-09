const fs = require('fs');

let lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

// Helper to find model start
function findModel(name) {
    return lines.findIndex(l => l.trim() === `model ${name} {`);
}

// 1. Employee
let empIdx = findModel('Employee');
let lastEmpField = -1;
for(let i = empIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '}') {
        lastEmpField = i;
        break;
    }
}
lines.splice(lastEmpField - 1, 0, 
    '  attrition_scores EmployeeAttritionScore[]',
    '  employee_snapshots EmployeeIntelligenceSnapshot[]'
);

// 2. Department
let deptIdx = findModel('Department');
let lastDeptField = -1;
for(let i = deptIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '}') {
        lastDeptField = i;
        break;
    }
}
lines.splice(lastDeptField - 1, 0, 
    '  department_snapshots DepartmentIntelligenceSnapshot[]'
);

// 3. Company
let compIdx = findModel('Company');
let lastCompField = -1;
for(let i = compIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '}') {
        lastCompField = i;
        break;
    }
}
lines.splice(lastCompField - 1, 0, 
    '  employee_snapshots EmployeeIntelligenceSnapshot[]',
    '  department_snapshots DepartmentIntelligenceSnapshot[]',
    '  company_snapshots CompanyIntelligenceSnapshot[]'
);

// 4. EmployeeAttritionScore
let scoreIdx = findModel('EmployeeAttritionScore');
let lastScoreField = -1;
for(let i = scoreIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '@@index([employee_id])') {
        lastScoreField = i;
        break;
    }
}
lines.splice(lastScoreField - 1, 0, 
    '  employee      Employee @relation(fields: [employee_id], references: [id])'
);

// 5. Attendance
let attIdx = findModel('Attendance');
let lastAttField = -1;
for(let i = attIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '@@unique([employee_id, date])') {
        lastAttField = i;
        break;
    }
}
lines.splice(lastAttField - 1, 0, 
    '  over_time_hours Decimal? @db.Decimal(10, 2)'
);

fs.writeFileSync('prisma/schema.prisma', lines.join('\n'));
console.log('Fields added successfully');

// Add new models
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
console.log('Models added successfully');
