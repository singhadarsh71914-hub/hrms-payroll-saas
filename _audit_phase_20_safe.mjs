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
      if (filePath.endsWith('tokens.css') || filePath.endsWith('global.css')) continue;
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getAllFiles(clientSrcPath);
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Safe color replacements
  content = content.replace(/color:\s*['"]?#f8fafc['"]?/gi, "color: 'var(--text-primary)'");
  content = content.replace(/color:\s*['"]?rgba\(255,\s*255,\s*255,\s*0\.7\)['"]?/gi, "color: 'var(--text-secondary)'");
  content = content.replace(/background(?:Color)?:\s*['"]?rgba\(17,\s*24,\s*39,\s*0\.65\)['"]?/gi, "backgroundColor: 'var(--bg-card)'");
  content = content.replace(/background(?:Color)?:\s*['"]?#08111F['"]?/gi, "backgroundColor: 'var(--bg-page)'");
  content = content.replace(/background(?:Color)?:\s*['"]?#07101C['"]?/gi, "backgroundColor: 'var(--bg-sidebar)'");
  
  // Safe border radius replacements
  content = content.replace(/borderRadius:\s*['"]?(?:12px|0.75rem)['"]?/gi, "borderRadius: 'var(--radius-md)'");
  content = content.replace(/borderRadius:\s*['"]?(?:8px|0.5rem)['"]?/gi, "borderRadius: 'var(--radius-sm)'");
  content = content.replace(/borderRadius:\s*['"]?(?:20px|1.25rem)['"]?/gi, "borderRadius: 'var(--radius-lg)'");
  content = content.replace(/borderRadius:\s*['"]?(?:50%)['"]?/gi, "borderRadius: 'var(--radius-full, 50%)'");

  // Safe typography replacements
  content = content.replace(/fontSize:\s*['"]?(?:32px|2rem)['"]?/gi, "fontSize: 'var(--font-xl, 32px)'");
  content = content.replace(/fontSize:\s*['"]?(?:24px|1.5rem)['"]?/gi, "fontSize: 'var(--font-lg, 24px)'");
  content = content.replace(/fontSize:\s*['"]?(?:18px|1.125rem)['"]?/gi, "fontSize: 'var(--font-md, 18px)'");
  content = content.replace(/fontSize:\s*['"]?(?:14px|0.875rem)['"]?/gi, "fontSize: 'var(--font-base, 14px)'");
  content = content.replace(/fontSize:\s*['"]?(?:12px|0.75rem)['"]?/gi, "fontSize: 'var(--font-sm, 12px)'");

  // Safe spacing replacements
  content = content.replace(/padding:\s*['"]?24px['"]?/gi, "padding: 'var(--spacing-xl, 24px)'");
  content = content.replace(/padding:\s*['"]?16px['"]?/gi, "padding: 'var(--spacing-lg, 16px)'");
  content = content.replace(/padding:\s*['"]?8px['"]?/gi, "padding: 'var(--spacing-sm, 8px)'");
  content = content.replace(/gap:\s*['"]?16px['"]?/gi, "gap: 'var(--spacing-lg, 16px)'");
  content = content.replace(/gap:\s*['"]?24px['"]?/gi, "gap: 'var(--spacing-xl, 24px)'");
  content = content.replace(/gap:\s*['"]?8px['"]?/gi, "gap: 'var(--spacing-sm, 8px)'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    modifiedCount++;
  }
});

console.log('Modified files:', modifiedCount);

// Recount
let remaining = {
  fontSizes: 0,
  borderRadius: 0,
  shadows: 0,
  colors: 0,
  spacing: 0
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  const fontMatches = content.match(/font-?size:\s*['"]?\d+(?:px|rem)['"]?/gi);
  if (fontMatches) remaining.fontSizes += fontMatches.length;

  const radiusMatches = content.match(/border-?radius:\s*['"]?\d+(?:px|rem)['"]?/gi);
  if (radiusMatches) remaining.borderRadius += radiusMatches.length;

  const shadowMatches = content.match(/box-?shadow:\s*['"]?[^;'"]+['"]?/gi);
  if (shadowMatches) remaining.shadows += shadowMatches.filter(s => !s.includes('var(') && !s.includes('none')).length;

  const colorMatches = content.match(/color:\s*['"]?(#[0-9a-fA-F]+|rgba?\([^)]+\))['"]?/gi);
  if (colorMatches) remaining.colors += colorMatches.filter(c => !c.includes('transparent')).length;
  
  const bgMatches = content.match(/background(?:-color)?:\s*['"]?(#[0-9a-fA-F]+|rgba?\([^)]+\))['"]?/gi);
  if (bgMatches) remaining.colors += bgMatches.filter(c => !c.includes('transparent')).length;

  const paddingMatches = content.match(/padding(?:Top|Bottom|Left|Right)?:\s*['"]?\d+(?:px|rem)['"]?/gi);
  if (paddingMatches) remaining.spacing += paddingMatches.length;
  const marginMatches = content.match(/margin(?:Top|Bottom|Left|Right)?:\s*['"]?\d+(?:px|rem)['"]?/gi);
  if (marginMatches) remaining.spacing += marginMatches.length;
  const gapMatches = content.match(/gap:\s*['"]?\d+(?:px|rem)['"]?/gi);
  if (gapMatches) remaining.spacing += gapMatches.length;
});

console.log('Remaining hardcoded values:');
console.log(JSON.stringify(remaining, null, 2));
