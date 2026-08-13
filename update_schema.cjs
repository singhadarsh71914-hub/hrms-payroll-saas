const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const shiftModel = `
model Shift {
  id              String       @id @default(uuid())
  company_id      String
  name            String
  start_time      String
  end_time        String
  grace_period    Int          @default(15)
  half_day_hours  Int          @default(4)
  working_days    Int[]        
  is_overnight    Boolean      @default(false)
  employees       Employee[]
  
  @@map("shifts")
}

model AttendanceBreak {
  id              String       @id @default(uuid())
  attendance_id   String
  start_time      DateTime
  end_time        DateTime?
  duration        Int?
  
  attendance      Attendance   @relation(fields: [attendance_id], references: [id], onDelete: Cascade)
  
  @@map("attendance_breaks")
}
`;

if (!schema.includes('model Shift')) {
  schema += shiftModel;
}

// Add fields to Employee if not there
if (!schema.includes('shift_id')) {
  schema = schema.replace(
    /model Employee \{[\s\S]*?\}/,
    (match) => {
      const parts = match.split('\n');
      parts.splice(parts.length - 1, 0, '  shift_id             String?');
      parts.splice(parts.length - 1, 0, '  shift                Shift?           @relation(fields: [shift_id], references: [id])');
      return parts.join('\n');
    }
  );
}

// Add fields to Attendance if not there
if (!schema.includes('late_minutes')) {
  schema = schema.replace(
    /model Attendance \{[\s\S]*?\}/,
    (match) => {
      const parts = match.split('\n');
      parts.splice(parts.length - 2, 0, '  working_hours        Decimal?         @db.Decimal(10, 2)');
      parts.splice(parts.length - 2, 0, '  break_hours          Decimal?         @db.Decimal(10, 2)');
      parts.splice(parts.length - 2, 0, '  late_minutes         Int              @default(0)');
      parts.splice(parts.length - 2, 0, '  early_exit_minutes   Int              @default(0)');
      parts.splice(parts.length - 2, 0, '  is_half_day          Boolean          @default(false)');
      parts.splice(parts.length - 2, 0, '  is_holiday           Boolean          @default(false)');
      parts.splice(parts.length - 2, 0, '  is_weekend           Boolean          @default(false)');
      parts.splice(parts.length - 2, 0, '  breaks               AttendanceBreak[]');
      return parts.join('\n');
    }
  );
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated successfully.');
