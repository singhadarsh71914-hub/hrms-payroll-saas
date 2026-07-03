const fs = require("fs");
const files = [
  "src/routes/admin.ts",
  "src/routes/attendance.ts",
  "src/routes/auth.ts",
  "src/routes/document.ts",
  "src/routes/employees.ts",
  "src/routes/health.ts",
  "src/routes/search.ts"
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  
  if (!content.includes("logError(")) {
    content = `import { logError } from '../utils/logError.ts';\n` + content;
  }
  
  content = content.replace(/catch\s*\(([^)]+)\)\s*\{([^}]*?)res\.status\(500\)\.json\([^)]*\);?\s*\}/g, (match, errName, body) => {
    return `catch (${errName}) {\n    logError('ROUTE', req, ${errName});\n    next(${errName});\n  }`;
  });
  
  fs.writeFileSync(file, content);
}
console.log("Refactored error handlers.");
