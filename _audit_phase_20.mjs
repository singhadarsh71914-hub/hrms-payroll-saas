import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientSrcPath = path.join(__dirname, 'client', 'src');

function getAllTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllTsxFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getAllTsxFiles(clientSrcPath);

let issues = [];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Typography Standardization
  // Replace arbitrary font sizes with standardized ones
  content = content.replace(/fontSize:\s*['"]?3[0-6]px['"]?/g, "fontSize: '32px'"); // Page Title
  content = content.replace(/fontSize:\s*['"]?2[0-4]px['"]?/g, "fontSize: '22px'"); // Section Title
  content = content.replace(/fontSize:\s*['"]?1[7-9]px['"]?/g, "fontSize: '18px'"); // Card Title
  // content = content.replace(/fontSize:\s*['"]?1[4-6]px['"]?/g, "fontSize: '14px'"); // Too risky for general body, might ruin buttons

  // 2. Shadows and Borders
  // Standardize card shadows
  content = content.replace(/boxShadow:\s*['"][^'"]+['"]/g, match => {
    if (match.includes('var(--card-shadow)') || match.includes('none')) return match;
    return "boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))'";
  });

  // Standardize border radius
  content = content.replace(/borderRadius:\s*['"]?(?:8|10|12)px['"]?/g, "borderRadius: '12px'");

  // 3. Buttons Padding
  content = content.replace(/padding:\s*['"]?[8-9]px 1[4-6]px['"]?/g, "padding: '8px 16px'");
  content = content.replace(/padding:\s*['"]?1[0-2]px 2[0-4]px['"]?/g, "padding: '10px 20px'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    issues.push({ file: file.replace(clientSrcPath, ''), status: 'Fixed' });
  }
});

fs.writeFileSync('audit_20.json', JSON.stringify(issues, null, 2));
console.log(`Processed ${files.length} files. Modified ${issues.length} files.`);
