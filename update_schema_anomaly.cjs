const fs = require('fs');

let lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

function findModel(name) {
    return lines.findIndex(l => l.trim() === `model ${name} {`);
}

function appendToModel(name, newLines) {
    let idx = findModel(name);
    if (idx === -1) return;
    let endIdx = -1;
    for(let i = idx + 1; i < lines.length; i++) {
        if (lines[i].trim() === '}') {
            endIdx = i;
            break;
        }
    }
    if (endIdx !== -1) {
        lines.splice(endIdx, 0, ...newLines);
    }
}

appendToModel('Company', ['  intelligence_anomalies IntelligenceAnomaly[]']);
appendToModel('Employee', ['  intelligence_anomalies IntelligenceAnomaly[]']);
appendToModel('Department', ['  intelligence_anomalies IntelligenceAnomaly[]']);

let text = lines.join('\n');
if (!text.includes('model IntelligenceAnomaly')) {
  text += `

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
}

fs.writeFileSync('prisma/schema.prisma', text);
console.log('Added IntelligenceAnomaly correctly');
