const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!content.includes('model ScheduledReport')) {
  content += `
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
}

if (!content.includes('base_salary                    Decimal?')) {
    content = content.replace('  work_email                     String           @unique', '  base_salary                    Decimal?         @db.Decimal(10, 2)\n  work_email                     String           @unique');
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Restored old models');
