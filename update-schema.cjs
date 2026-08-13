const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// First remove the old PerformanceReview model
const prRegex = /model PerformanceReview\s*\{[\s\S]*?^\}/m;
schema = schema.replace(prRegex, '');

// Append the new models and enums at the end
const newSchemaContent = `
enum GoalStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  OVERDUE
  CANCELLED
}

model Goal {
  id              String      @id @default(uuid())
  company_id      String
  employee_id     String
  title           String
  description     String?
  status          GoalStatus  @default(NOT_STARTED)
  progress        Int         @default(0)
  start_date      DateTime
  deadline        DateTime
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
  
  company         Company     @relation(fields: [company_id], references: [id])
  employee        Employee    @relation(fields: [employee_id], references: [id])
}

model KPI {
  id              String      @id @default(uuid())
  company_id      String
  employee_id     String
  title           String
  description     String?
  weightage       Int         @default(10)
  target_value    Float
  achieved_value  Float       @default(0)
  score           Float       @default(0)
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt

  company         Company     @relation(fields: [company_id], references: [id])
  employee        Employee    @relation(fields: [employee_id], references: [id])
}

enum ReviewStatus {
  DRAFT
  SELF_REVIEW_SUBMITTED
  MANAGER_REVIEW_SUBMITTED
  HR_APPROVED
}

model PerformanceReview {
  id                String   @id @default(uuid())
  company_id        String
  employee_id       String
  cycle_name        String
  review_period     String
  
  status            ReviewStatus @default(DRAFT)
  
  self_rating       Float?
  self_comments     String?
  
  manager_id        String?
  manager_rating    Float?
  manager_comments  String?
  
  goals_rating      Float?
  kpi_score         Float?
  overall_score     Float?
  badge             String   @default("Pending")
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  company  Company  @relation(fields: [company_id], references: [id])
  employee Employee @relation(name: "ReviewEmployee", fields: [employee_id], references: [id])
  manager  Employee? @relation(name: "ReviewManager", fields: [manager_id], references: [id])
}
`;

schema += newSchemaContent;

// Now fix up the Employee model to add the missing relations
const empRegex = /model Employee\s*\{[\s\S]*?^\}/m;
let empModel = schema.match(empRegex)[0];
// Remove any existing performance_reviews relation to cleanly insert them all
empModel = empModel.replace(/^[ \t]*performance_reviews.*$/gm, '');
empModel = empModel.replace(/^[ \t]*managed_reviews.*$/gm, '');
empModel = empModel.replace(/^[ \t]*goals.*$/gm, '');
empModel = empModel.replace(/^[ \t]*kpis.*$/gm, '');

// Append relations before the closing brace
empModel = empModel.replace(/\}/, `  performance_reviews PerformanceReview[] @relation("ReviewEmployee")
  managed_reviews     PerformanceReview[] @relation("ReviewManager")
  goals               Goal[]
  kpis                KPI[]
}`);

schema = schema.replace(empRegex, empModel);

// Fix up Company model
const compRegex = /model Company\s*\{[\s\S]*?^\}/m;
let compModel = schema.match(compRegex)[0];
compModel = compModel.replace(/^[ \t]*performance_reviews.*$/gm, '');
compModel = compModel.replace(/^[ \t]*goals.*$/gm, '');
compModel = compModel.replace(/^[ \t]*kpis.*$/gm, '');

compModel = compModel.replace(/\}/, `  performance_reviews PerformanceReview[]
  goals               Goal[]
  kpis                KPI[]
}`);

schema = schema.replace(compRegex, compModel);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated successfully');
