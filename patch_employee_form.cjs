const fs = require('fs');
const path = require('path');
const file = path.join('client', 'src', 'pages', 'EmployeeForm.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "pan_number: '',",
  "pan_number: '',\n    uan_number: '',\n    esic_ip_number: '',\n    bank_name: '',\n    bank_account_number: '',\n    bank_ifsc: '',\n    bank_branch: '',\n    bank_account_holder: '',"
);

content = content.replace(
  "pan_number: emp.pan_number || '',",
  "pan_number: emp.pan_number || '',\n            uan_number: emp.uan_number || '',\n            esic_ip_number: emp.esic_ip_number || '',\n            bank_name: emp.bank_name || '',\n            bank_account_number: emp.bank_account_number || '',\n            bank_ifsc: emp.bank_ifsc || '',\n            bank_branch: emp.bank_branch || '',\n            bank_account_holder: emp.bank_account_holder || '',"
);

const govIdsHtml = `
          <div className="form-section" style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', margin: 0 }}>Government IDs</h3>
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label>PAN Number</label>
              <input type="text" className="form-control" name="pan_number" value={formData.pan_number} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Aadhaar Number</label>
              <input type="text" className="form-control" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>UAN Number</label>
              <input type="text" className="form-control" name="uan_number" value={formData.uan_number} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>ESIC IP Number</label>
              <input type="text" className="form-control" name="esic_ip_number" value={formData.esic_ip_number} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', margin: 0 }}>Bank Details</h3>
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Bank Name</label>
              <input type="text" className="form-control" name="bank_name" value={formData.bank_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input type="text" className="form-control" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input type="text" className="form-control" name="bank_ifsc" value={formData.bank_ifsc} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Branch</label>
              <input type="text" className="form-control" name="bank_branch" value={formData.bank_branch} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Account Holder Name</label>
              <input type="text" className="form-control" name="bank_account_holder" value={formData.bank_account_holder} onChange={handleChange} />
            </div>
          </div>
`;

content = content.replace(
  '<h3 style={{ color: \'var(--text-main)\', fontSize: \'1.2rem\', margin: 0 }}>Address Details</h3>',
  govIdsHtml + '\n          <h3 style={{ color: \'var(--text-main)\', fontSize: \'1.2rem\', margin: 0, marginTop: \'2rem\' }}>Address Details</h3>'
);

// We should also remove existing PAN and Aadhaar from their old location if they exist, to avoid duplicates.
content = content.replace(
  `            <div className="form-group">
              <label>Aadhaar Number</label>
              <input type="text" className="form-control" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>PAN Number</label>
              <input type="text" className="form-control" name="pan_number" value={formData.pan_number} onChange={handleChange} />
            </div>`,
  ''
);

fs.writeFileSync(file, content);
console.log('Patched EmployeeForm.tsx');
