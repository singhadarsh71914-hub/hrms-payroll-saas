import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientSrcPath = path.join(__dirname, 'client', 'src');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.css')) {
      if (filePath.endsWith('tokens.css') || filePath.endsWith('global.css') || filePath.includes('node_modules')) continue;
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getAllFiles(clientSrcPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Aggressively replace font sizes
  content = content.replace(/fontSize:\s*['"]?3[0-9]px['"]?/gi, "fontSize: 'var(--font-xl, 32px)'");
  content = content.replace(/fontSize:\s*['"]?2[0-9]px['"]?/gi, "fontSize: 'var(--font-lg, 24px)'");
  content = content.replace(/fontSize:\s*['"]?1[7-9]px['"]?/gi, "fontSize: 'var(--font-md, 18px)'");
  content = content.replace(/fontSize:\s*['"]?1[3-6]px['"]?/gi, "fontSize: 'var(--font-base, 14px)'");
  content = content.replace(/fontSize:\s*['"]?1[0-2]px['"]?/gi, "fontSize: 'var(--font-sm, 12px)'");

  // Aggressively replace border radiuses
  content = content.replace(/borderRadius:\s*['"]?[1-9]px['"]?/gi, "borderRadius: 'var(--radius-sm)'");
  content = content.replace(/borderRadius:\s*['"]?1[0-9]px['"]?/gi, "borderRadius: 'var(--radius-md)'");
  content = content.replace(/borderRadius:\s*['"]?[2-9][0-9]px['"]?/gi, "borderRadius: 'var(--radius-lg)'");
  content = content.replace(/borderRadius:\s*['"]?50%['"]?/gi, "borderRadius: 'var(--radius-full, 50%)'");
  
  // Replace colors
  content = content.replace(/color:\s*['"]?#[0-9a-fA-F]{3,6}['"]?/gi, "color: 'var(--text-primary)'");
  content = content.replace(/color:\s*['"]?rgba?\([^)]+\)['"]?/gi, "color: 'var(--text-secondary)'");
  content = content.replace(/background(?:Color)?:\s*['"]?#[0-9a-fA-F]{3,6}['"]?/gi, "backgroundColor: 'var(--bg-card)'");
  content = content.replace(/background(?:Color)?:\s*['"]?rgba?\([^)]+\)['"]?/gi, "backgroundColor: 'var(--bg-card)'");

  // Spacing (padding/margin)
  content = content.replace(/padding:\s*['"]?\d+px['"]?/gi, "padding: 'var(--spacing-md, 16px)'");
  content = content.replace(/margin(?:Top|Bottom|Left|Right)?:\s*['"]?\d+px['"]?/gi, "margin: 'var(--spacing-sm, 8px)'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
  }
});
