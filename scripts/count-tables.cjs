const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("notifications:", await prisma.notification.count());
  console.log("employees:", await prisma.employee.count());
  console.log("users:", await prisma.user.count());
  console.log("companies:", await prisma.company.count());
  console.log("audit_logs:", await prisma.auditLog.count());
  console.log("refresh_tokens:", await prisma.refreshToken.count());
}

main().finally(() => prisma.$disconnect());
