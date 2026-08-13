const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Dashboard.tsx', 'utf8');

// The messed up area is:
//             </div>
//           )}
//         <div style={{
//           background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px',
//           display: 'flex', flexDirection: 'column'
//         }}>
//           <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
//             <Clock size={20} color="#10B981" /> Today's Attendance Overview

const target = `            </div>
          )}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="#10B981" /> Today's Attendance Overview`;

const replacement = `            </div>
          )}
        </div>
      </div>

      {/* ROW 3 */}
      <div className="dashboard-grid-2" style={{ marginBottom: '24px' }}>
        
        {/* Today's Attendance Overview */}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="#10B981" /> Today's Attendance Overview`;

content = content.replace(target, replacement);

fs.writeFileSync('client/src/pages/Dashboard.tsx', content);
console.log("Fixed Row 3");
