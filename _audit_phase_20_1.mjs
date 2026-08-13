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
let remaining = {
  fontSizes: 0,
  borderRadius: 0,
  shadows: 0,
  colors: 0,
  spacing: 0
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace border radius
  content = content.replace(/borderRadius:\s*['"]?12px['"]?/g, "borderRadius: 'var(--radius-md)'");
  content = content.replace(/borderRadius:\s*['"]?8px['"]?/g, "borderRadius: 'var(--radius-sm)'");
  content = content.replace(/borderRadius:\s*['"]?20px['"]?/g, "borderRadius: 'var(--radius-lg)'");
  
  content = content.replace(/border-radius:\s*12px/g, "border-radius: var(--radius-md)");
  content = content.replace(/border-radius:\s*8px/g, "border-radius: var(--radius-sm)");
  content = content.replace(/border-radius:\s*20px/g, "border-radius: var(--radius-lg)");

  // Replace colors
  content = content.replace(/#3B82F6/gi, 'var(--primary)');
  content = content.replace(/#2563EB/gi, 'var(--primary-dark)');
  content = content.replace(/#8B5CF6/gi, 'var(--secondary)');
  content = content.replace(/#10B981/gi, 'var(--success)');
  content = content.replace(/#F59E0B/gi, 'var(--warning)');
  content = content.replace(/#EF4444/gi, 'var(--danger)');
  
  // Shadows (crude best effort)
  content = content.replace(/boxShadow:\s*['"][^'"]*rgba[^'"]*['"]/g, match => {
    if (match.includes('var(')) return match;
    return "boxShadow: 'var(--shadow-md)'";
  });
  content = content.replace(/box-shadow:\s*[^;]*rgba[^;]*/g, match => {
    if (match.includes('var(')) return match;
    return "box-shadow: var(--shadow-md)";
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    modifiedCount++;
  }

  // Count remaining
  const fontMatches = content.match(/font-?size:\s*['"]?\d+px['"]?/gi);
  if (fontMatches) remaining.fontSizes += fontMatches.length;

  const radiusMatches = content.match(/border-?radius:\s*['"]?\d+px['"]?/gi);
  if (radiusMatches) {
    // Only count if it's not a var
    remaining.borderRadius += radiusMatches.length;
  }

  const shadowMatches = content.match(/box-?shadow:\s*['"]?[^;'"]+['"]?/gi);
  if (shadowMatches) {
    remaining.shadows += shadowMatches.filter(s => !s.includes('var(') && !s.includes('none')).length;
  }

  const colorMatches = content.match(/color:\s*['"]?(#[0-9a-fA-F]+|rgba?\([^)]+\))['"]?/gi);
  if (colorMatches) remaining.colors += colorMatches.length;
  const bgMatches = content.match(/background(?:-color)?:\s*['"]?(#[0-9a-fA-F]+|rgba?\([^)]+\))['"]?/gi);
  if (bgMatches) remaining.colors += bgMatches.length;

  const paddingMatches = content.match(/padding:\s*['"]?[\dpx\s]+['"]?/gi);
  if (paddingMatches) remaining.spacing += paddingMatches.length;
  const marginMatches = content.match(/margin:\s*['"]?[\dpx\s]+['"]?/gi);
  if (marginMatches) remaining.spacing += marginMatches.length;
});

console.log('Modified files:', modifiedCount);
console.log('Remaining hardcoded values:');
console.log(JSON.stringify(remaining, null, 2));
