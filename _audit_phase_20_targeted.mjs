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
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  if (file.endsWith('.tsx')) {
    // Colors
    content = content.replace(/color:\s*['"]#f8fafc['"]/g, "color: 'var(--text-primary)'");
    content = content.replace(/color:\s*['"]rgba\(255, 255, 255, 0.7\)['"]/g, "color: 'var(--text-secondary)'");
    content = content.replace(/backgroundColor:\s*['"]rgba\(17, 24, 39, 0.65\)['"]/g, "backgroundColor: 'var(--bg-card)'");
    content = content.replace(/background:\s*['"]rgba\(17, 24, 39, 0.65\)['"]/g, "background: 'var(--bg-card)'");

    // Border Radius
    content = content.replace(/borderRadius:\s*['"]12px['"]/g, "borderRadius: 'var(--radius-md)'");
    content = content.replace(/borderRadius:\s*['"]8px['"]/g, "borderRadius: 'var(--radius-sm)'");
    content = content.replace(/borderRadius:\s*['"]20px['"]/g, "borderRadius: 'var(--radius-lg)'");
    content = content.replace(/borderRadius:\s*12/g, "borderRadius: 'var(--radius-md)'");
    content = content.replace(/borderRadius:\s*8/g, "borderRadius: 'var(--radius-sm)'");

    // Font Sizes
    content = content.replace(/fontSize:\s*['"]32px['"]/g, "fontSize: 'var(--font-xl, 32px)'");
    content = content.replace(/fontSize:\s*['"]24px['"]/g, "fontSize: 'var(--font-lg, 24px)'");
    content = content.replace(/fontSize:\s*['"]18px['"]/g, "fontSize: 'var(--font-md, 18px)'");
    content = content.replace(/fontSize:\s*['"]14px['"]/g, "fontSize: 'var(--font-base, 14px)'");
    content = content.replace(/fontSize:\s*['"]12px['"]/g, "fontSize: 'var(--font-sm, 12px)'");
    content = content.replace(/fontSize:\s*14/g, "fontSize: 'var(--font-base, 14px)'");
    content = content.replace(/fontSize:\s*12/g, "fontSize: 'var(--font-sm, 12px)'");

    // Spacing
    content = content.replace(/padding:\s*['"]24px['"]/g, "padding: 'var(--spacing-xl, 24px)'");
    content = content.replace(/padding:\s*['"]16px['"]/g, "padding: 'var(--spacing-lg, 16px)'");
    content = content.replace(/padding:\s*['"]8px['"]/g, "padding: 'var(--spacing-sm, 8px)'");
    content = content.replace(/gap:\s*['"]16px['"]/g, "gap: 'var(--spacing-lg, 16px)'");
    content = content.replace(/gap:\s*['"]24px['"]/g, "gap: 'var(--spacing-xl, 24px)'");
    content = content.replace(/gap:\s*['"]8px['"]/g, "gap: 'var(--spacing-sm, 8px)'");
    content = content.replace(/gap:\s*16\b/g, "gap: 'var(--spacing-lg, 16px)'");
    content = content.replace(/gap:\s*8\b/g, "gap: 'var(--spacing-sm, 8px)'");
  } 
  else if (file.endsWith('.css')) {
    content = content.replace(/border-radius:\s*12px/g, "border-radius: var(--radius-md)");
    content = content.replace(/border-radius:\s*8px/g, "border-radius: var(--radius-sm)");
    content = content.replace(/border-radius:\s*20px/g, "border-radius: var(--radius-lg)");

    content = content.replace(/font-size:\s*32px/g, "font-size: var(--font-xl, 32px)");
    content = content.replace(/font-size:\s*24px/g, "font-size: var(--font-lg, 24px)");
    content = content.replace(/font-size:\s*18px/g, "font-size: var(--font-md, 18px)");
    content = content.replace(/font-size:\s*14px/g, "font-size: var(--font-base, 14px)");
    content = content.replace(/font-size:\s*12px/g, "font-size: var(--font-sm, 12px)");

    content = content.replace(/padding:\s*16px/g, "padding: var(--spacing-lg, 16px)");
    content = content.replace(/padding:\s*24px/g, "padding: var(--spacing-xl, 24px)");
    content = content.replace(/padding:\s*8px/g, "padding: var(--spacing-sm, 8px)");
    content = content.replace(/margin:\s*16px/g, "margin: var(--spacing-lg, 16px)");
    content = content.replace(/margin:\s*24px/g, "margin: var(--spacing-xl, 24px)");
    content = content.replace(/margin:\s*8px/g, "margin: var(--spacing-sm, 8px)");
    content = content.replace(/gap:\s*16px/g, "gap: var(--spacing-lg, 16px)");
    content = content.replace(/gap:\s*8px/g, "gap: var(--spacing-sm, 8px)");
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    modifiedCount++;
  }
});

console.log('Modified files:', modifiedCount);
