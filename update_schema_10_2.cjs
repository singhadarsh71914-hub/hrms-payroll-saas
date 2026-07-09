const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!content.includes('model IntelligenceAnomaly')) {
  content += `
model IntelligenceAnomaly {
  id            String    @id @default(uuid())
  company_id    String
  employee_id   String?
  department_id String?
  type          String
  severity      String
  message       String
  metadata      Json?
  resolved_at   DateTime?
  created_at    DateTime  @default(now())

  company       Company     @relation(fields: [company_id], references: [id])
  employee      Employee?   @relation(fields: [employee_id], references: [id])
  department    Department? @relation(fields: [department_id], references: [id])

  @@index([company_id])
  @@index([employee_id])
  @@index([department_id])
}
`;

  // Add relations to Company, Employee, Department
  content = content.replace(
    '  company_snapshots CompanyIntelligenceSnapshot[]', 
    '  company_snapshots CompanyIntelligenceSnapshot[]\n  intelligence_anomalies IntelligenceAnomaly[]'
  );
  content = content.replace(
    '  employee_snapshots EmployeeIntelligenceSnapshot[]', 
    '  employee_snapshots EmployeeIntelligenceSnapshot[]\n  intelligence_anomalies IntelligenceAnomaly[]'
  );
  content = content.replace(
    '  department_snapshots DepartmentIntelligenceSnapshot[]', 
    '  department_snapshots DepartmentIntelligenceSnapshot[]\n  intelligence_anomalies IntelligenceAnomaly[]'
  );

  fs.writeFileSync('prisma/schema.prisma', content);
  console.log('Added IntelligenceAnomaly model');
}
