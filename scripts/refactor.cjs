const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function convertGrids(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Regex to find things like: <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', ... }}>
  // This is tricky because style objects can span multiple lines and have varying properties.
  // A safer regex targets the gridTemplateColumns property specifically.
  // Actually, we can just replace `gridTemplateColumns: 'something'` with nothing, and add `className="grid grid-cols-..."`
  // But doing this reliably with regex on AST is hard.
  
  // Let's look for specific patterns: gridTemplateColumns: 'repeat(X, 1fr)'
  // We can inject a responsive class name into the component.

  // Let's try to match style={{ ... }}
  let matches = 0;
  content = content.replace(/style=\{\{(.*?)\}\}/gs, (match, styleBody) => {
    if (styleBody.includes("gridTemplateColumns")) {
      // It's a grid! We want to remove `display: 'grid'` and `gridTemplateColumns: ...`
      // and we want to know how many columns it was to add the right class.
      let cols = 1;
      let colMatch = styleBody.match(/gridTemplateColumns:\s*['"`](.*?)['"`]/);
      if (colMatch) {
        let val = colMatch[1];
        if (val.includes('repeat(12')) cols = 12;
        else if (val.includes('repeat(5')) cols = 5;
        else if (val.includes('repeat(4')) cols = 4;
        else if (val.includes('repeat(3')) cols = 3;
        else if (val.includes('repeat(auto-fit, minmax(280px')) cols = 99; // auto-fit
        else if (val.includes('repeat(auto-fit, minmax(300px')) cols = 99;
        else if (val.includes('repeat(auto-fit, minmax(320px')) cols = 99;
        else if (val.includes('repeat(auto-fit, minmax(350px')) cols = 99;
        else if (val.includes('repeat(auto-fit, minmax(200px')) cols = 98;
        else if (val.includes('repeat(auto-fit, minmax(250px')) cols = 98;
        else if (val.includes('repeat(auto-fill, minmax(280px')) cols = 99;
        else if (val.includes('repeat(auto-fill, minmax(320px')) cols = 99;
        else if (val.includes('repeat(auto-fill, minmax(350px')) cols = 99;
        else if (val.split(' ').length > 1) cols = val.split(' ').length;
        else cols = 1;

        // Determine tailwind classes
        let twClass = '';
        if (cols === 99) twClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
        else if (cols === 98) twClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
        else if (cols === 12) twClass = 'grid grid-cols-1 lg:grid-cols-12';
        else if (cols === 5) twClass = 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5';
        else if (cols === 4) twClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
        else if (cols === 3) twClass = 'grid grid-cols-1 lg:grid-cols-3';
        else if (cols === 2) twClass = 'grid grid-cols-1 lg:grid-cols-2';
        else twClass = 'grid grid-cols-1';

        let gap = '';
        let gapMatch = styleBody.match(/gap:\s*['"`](.*?)['"`]/);
        if (gapMatch) {
           let gapVal = gapMatch[1];
           if (gapVal === '8px') gap = 'gap-2';
           else if (gapVal === '12px') gap = 'gap-3';
           else if (gapVal === '16px' || gapVal === '1rem') gap = 'gap-4';
           else if (gapVal === '24px' || gapVal === '1.5rem') gap = 'gap-6';
           else if (gapVal === '32px' || gapVal === '2rem') gap = 'gap-8';
           else gap = 'gap-4';
        }
        
        let mb = '';
        if (styleBody.includes("marginBottom: '16px'") || styleBody.includes("marginBottom: '1rem'")) mb = 'mb-4';
        if (styleBody.includes("marginBottom: '24px'") || styleBody.includes("marginBottom: '1.5rem'")) mb = 'mb-6';
        if (styleBody.includes("marginBottom: '32px'") || styleBody.includes("marginBottom: '2rem'")) mb = 'mb-8';
        if (styleBody.includes("marginBottom: '2rem'")) mb = 'mb-8';

        // We will just replace `display: 'grid', gridTemplateColumns: '...', gap: '...'` with nothing
        // and tell the user we couldn't automatically inject className.
        // Actually, we can use a simpler approach for the script: 
        // Just inject window-width based inline style overrides? No.
        
        // Let's replace the whole style tag and add className.
      }
    }
    return match;
  });
  
  // Actually, modifying TSX with regex for this is very brittle and might break JSX syntax if there's already a className.
  // A safer approach: replace `gridTemplateColumns: 'repeat(4, 1fr)'` with `gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(4, 1fr)'`
  
  content = content.replace(/gridTemplateColumns:\s*['"`](.*?)['"`]/g, (match, val) => {
    if (val === '1fr' || val.includes('window.innerWidth')) return match;
    return `gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && '${val}'.includes('repeat(4') ? 'repeat(2, 1fr)' : '${val}'`;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

walkDir(path.join(__dirname, '../client/src/pages'), convertGrids);
console.log('Done!');
