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

const oldGovIdsGroup = `              <div className="form-group">
                <label>Aadhaar Number</label>
                <input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>PAN Number</label>
                <input name="pan_number" value={formData.pan_number} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
              </div>`;

const newGovAndBank = `
          {/* Government IDs */}
          <div className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Government IDs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Aadhaar Number</label>
                <input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>PAN Number</label>
                <input name="pan_number" value={formData.pan_number} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
              </div>
              <div className="form-group">
                <label>UAN Number</label>
                <input name="uan_number" value={formData.uan_number} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>ESIC IP Number</label>
                <input name="esic_ip_number" value={formData.esic_ip_number} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Bank Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Bank Name</label>
                <input name="bank_name" value={formData.bank_name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input name="bank_ifsc" value={formData.bank_ifsc} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input name="bank_branch" value={formData.bank_branch} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input name="bank_account_holder" value={formData.bank_account_holder} onChange={handleChange} />
              </div>
            </div>
          </div>`;

content = content.replace(oldGovIdsGroup, ''); // Remove the old fields

// Insert new sections right before {/* Address Information */}
content = content.replace(
  '{/* Address Information */}',
  newGovAndBank + '\n\n          {/* Address Information */}'
);

fs.writeFileSync(file, content);
console.log('Patched correctly.');
