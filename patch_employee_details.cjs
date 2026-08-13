const fs = require('fs');
const path = require('path');
const file = path.join('client', 'src', 'pages', 'EmployeeDetails.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '20px', 
                backgroundColor: '#1e293b', 
                border: '4px solid #0f172a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                flexShrink: 0
              }}>
                <User size={50} />
              </div>
              <div style={{ paddingBottom: '0.25rem', flex: 1, minWidth: '250px' }}>`;

const replacement = `              <div style={{ position: 'relative' }}>
                <div 
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '20px', 
                    backgroundColor: '#1e293b', 
                    border: '4px solid #0f172a', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {employee.avatar_url ? (
                    <img src={employee.avatar_url.startsWith('http') ? employee.avatar_url : \`http://localhost:3000\${employee.avatar_url}\`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={50} />
                  )}
                  
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '4px', textAlign: 'center', opacity: uploadingAvatar ? 1 : 0, transition: 'opacity 0.2s' }}>
                    <span style={{ fontSize: '10px', color: '#fff' }}>{uploadingAvatar ? 'UPLOADING...' : 'CHANGE'}</span>
                  </div>
                  
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
                
                {employee.avatar_url && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleAvatarDelete(); }} style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>×</button>
                )}
              </div>
              <div style={{ paddingBottom: '0.25rem', flex: 1, minWidth: '250px' }}>`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('Patched EmployeeDetails.tsx');
