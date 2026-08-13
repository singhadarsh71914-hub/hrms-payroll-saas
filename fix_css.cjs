const fs = require('fs');
const file = 'client/src/styles/global.css';
let text = fs.readFileSync(file, 'utf8');

const splitStr = '.btn-primary { \r\n  background: linear-gradient(135deg, var(--primary), var(--primary-dark)); \r\n  color: white; \r\n}\r\n';
const splitStrLf = '.btn-primary { \n  background: linear-gradient(135deg, var(--primary), var(--primary-dark)); \n  color: white; \n}\n';

let parts = text.split(splitStr);
if (parts.length === 1) parts = text.split(splitStrLf);

const insert = `
.btn-primary:hover { 
  transform: translateY(-1px); 
  box-shadow: 0 4px 15px rgba(37,99,235,0.4); 
}

.btn-secondary { 
  background: transparent; 
  border: 1px solid var(--border); 
  color: var(--text-primary); 
}

.btn-danger { background: var(--danger); color: white; }
.btn-success { background: var(--success); color: white; }

/* Tables */
.table-container {
  overflow-x: auto;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  min-width: 0;
}

.premium-table { width: 100%; border-collapse: collapse; }
.premium-table thead tr { background: var(--bg-page); border-bottom: 1px solid var(--border); }
.premium-table th { 
  padding: 12px 16px; 
  font-size: 11px; 
  font-weight: 600; 
  letter-spacing: 0.05em; 
  text-transform: uppercase; 
  color: var(--text-muted); 
  text-align: left;
}
.premium-table td { 
  padding: 14px 16px; 
  border-bottom: 1px solid var(--border); 
  color: var(--text-primary);
  font-size: 14px;
}
.premium-table tbody tr { transition: background-color 0.15s ease; }
.premium-table tbody tr:hover { background: var(--bg-page); cursor: pointer; }

/* Status Badges */
`;

fs.writeFileSync(file, parts[0] + splitStrLf + insert + parts[1].replace(/[\s\S]*?(?=\.status-badge)/, ''));
console.log('Fixed');
