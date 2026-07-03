const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const fields = `
  face_enrolled_at               DateTime?
  face_descriptor                Json?
  biometric_enabled              Boolean?
`;

if (!schema.includes('face_enrolled_at')) {
  schema = schema.replace(
    '  user_id                        String?             @unique',
    fields + '\n  user_id                        String?             @unique'
  );
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log("Added biometric fields to Employee");
}
