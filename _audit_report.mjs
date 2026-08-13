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

  const radiusMatches = content.match(/border-?radius:\s*['"]?\d+(?:px|rem|%)['"]?/gi);
  if (radiusMatches) remaining.borderRadius += radiusMatches.length;

  const shadowMatches = content.match(/box-?shadow:\s*['"]?[^;'"]+['"]?/gi);
  if (shadowMatches) remaining.shadows += shadowMatches.filter(s => !s.includes('var(') && !s.includes('none')).length;

  const colorMatches = content.match(/color:\s*['"]?(#[0-9a-fA-F]+|rgba?\([^)]+\))['"]?/gi);
  if (colorMatches) remaining.colors += colorMatches.filter(c => !c.includes('transparent')).length;
  
  const bgMatches = content.match(/background(?:-color)?:\s*['"]?(#[0-9a-fA-F]+|rgba?\([^)]+\))['"]?/gi);
  if (bgMatches) remaining.colors += bgMatches.filter(c => !c.includes('transparent') && !c.includes('var(')).length;

  const paddingMatches = content.match(/padding(?:Top|Bottom|Left|Right)?:\s*['"]?\d+(?:px|rem)['"]?/gi);
  if (paddingMatches) remaining.spacing += paddingMatches.length;
  const marginMatches = content.match(/margin(?:Top|Bottom|Left|Right)?:\s*['"]?\d+(?:px|rem)['"]?/gi);
  if (marginMatches) remaining.spacing += marginMatches.length;
  const gapMatches = content.match(/gap:\s*['"]?\d+(?:px|rem)['"]?/gi);
  if (gapMatches) remaining.spacing += gapMatches.length;
});

console.log('Remaining hardcoded values:');
console.log(JSON.stringify(remaining, null, 2));
