const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const fields = `
  email_verification_expires_at DateTime?
  email_verification_token      String?        @unique
  email_verified                Boolean        @default(false)
  password_reset_attempts       Int            @default(0)
  password_reset_requested_at   DateTime?
  reset_password_expires_at     DateTime?
  reset_password_token          String?        @unique
  scheduled_purge_at            DateTime?
`;

if (!schema.includes('email_verified')) {
  schema = schema.replace(
    '  updated_at    DateTime       @updatedAt',
    '  updated_at    DateTime       @updatedAt\n' + fields
  );
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log("Added missing fields to User");
}
