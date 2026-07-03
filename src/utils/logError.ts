export function logError(scope: string, req: any, error: any) {
  console.error(`\n===== ${scope} ERROR =====`);

  if (req) {
    console.error("ROUTE:", req.originalUrl || req.url);
    if (req.user) console.error("USER:", req.user);
    if (req.body) console.error("BODY:", req.body);
  }

  console.error("TYPE:", error?.constructor?.name);
  console.error(error);

  if (error?.stack) {
    console.error("STACK:\n", error.stack);
  }

  if (error?.code) {
    console.error("PRISMA CODE:", error.code);
  }
  
  if (error?.meta) {
    console.error("PRISMA META:", error.meta);
  }
}
