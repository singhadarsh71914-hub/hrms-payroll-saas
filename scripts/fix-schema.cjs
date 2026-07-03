const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const toAdd = `
model RefreshToken {
  id         String    @id @default(uuid())
  user_id    String
  token_hash String
  expires_at DateTime
  created_at DateTime  @default(now())
  revoked_at DateTime?
  user       User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
}

model AuditLog {
  id          String   @id @default(uuid())
  user_id     String?
  action      String
  entity_type String?
  entity_id   String?
  metadata    Json?
  ip_address  String?
  created_at  DateTime @default(now())
}

model Notification {
  id          String   @id @default(uuid())
  company_id  String
  user_id     String
  type        String
  title       String
  message     String
  metadata    Json?
  is_read     Boolean  @default(false)
  created_at  DateTime @default(now())
}
`;

if (!schema.includes('model Notification')) {
  schema += toAdd;
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log("Appended successfully");
} else {
  console.log("Already appended");
}
