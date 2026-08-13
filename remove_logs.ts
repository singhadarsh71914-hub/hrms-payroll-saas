import * as fs from 'fs';
import * as path from 'path';

function removeConsoleLogs(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      removeConsoleLogs(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Skip replacing in utils/logger.ts or similar
      if (fullPath.includes('logger.ts')) continue;
      
      // Simple regex to replace console.log(...) statements
      // Just comment them out to be safe, or remove them.
      // We will remove single line console.logs
      const newContent = content.replace(/^[ \t]*console\.log\(.*\);?\r?\n/gm, '');
      
      if (content !== newContent) {
        console.log(`Cleaned: ${fullPath}`);
        fs.writeFileSync(fullPath, newContent);
      }
    }
  }
}

removeConsoleLogs(path.join(process.cwd(), 'src'));
removeConsoleLogs(path.join(process.cwd(), 'client', 'src'));
