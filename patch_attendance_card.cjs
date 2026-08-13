const fs = require('fs');

const file = 'client/src/components/attendance/AttendanceCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const propsInterface = `interface AttendanceCardProps {
  session: any;
  duration: number;
  data: any;
  todayAttendance: any;
  setEnrollmentMode: (val: boolean) => void;
  setShowCamera: (val: boolean) => void;
  initiateAttendance: (type: 'IN' | 'OUT') => void;
  handleStartBreak?: () => void;
  handleEndBreak?: () => void;
}`;

content = content.replace(/interface AttendanceCardProps {[\s\S]*?}/, propsInterface);

const componentDecl = `export default function AttendanceCard({
  session,
  duration,
  data,
  todayAttendance,
  setEnrollmentMode,
  setShowCamera,
  initiateAttendance,
  handleStartBreak,
  handleEndBreak
}: AttendanceCardProps) {`;

content = content.replace(/export default function AttendanceCard\(\{[\s\S]*?\}\: AttendanceCardProps\) \{/, componentDecl);

const breakStatus = `const status = session?.checkOut ? 'COMPLETED' : (session?.checkedIn ? 'ACTIVE' : 'PENDING');`;
const breakStatusReplacement = `
  const isOnBreak = session?.onBreak;
  const status = session?.checkOut ? 'COMPLETED' : (session?.checkedIn ? (isOnBreak ? 'ON_BREAK' : 'ACTIVE') : 'PENDING');
`;

content = content.replace(breakStatus, breakStatusReplacement);

const buttonsSection = `            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: todayAttendance?.check_in ? 'rgba(16,185,129,0.1)' : 'linear-gradient(to right, #10b981, #059669)', color: todayAttendance?.check_in ? '#10b981' : '#fff', border: todayAttendance?.check_in ? '1px solid #10b981' : 'none', borderRadius: '12px', boxShadow: todayAttendance?.check_in ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }} onClick={() => initiateAttendance('IN')} disabled={!!todayAttendance?.check_in}>
              <Camera size={18} /> {todayAttendance?.check_in ? 'Checked In' : 'Check In'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 'rgba(239,68,68,0.1)' : 'linear-gradient(to right, #ef4444, #dc2626)', color: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? '#ef4444' : '#fff', border: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? '1px solid #ef4444' : 'none', borderRadius: '12px', boxShadow: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 'none' : '0 4px 14px 0 rgba(239, 68, 68, 0.39)', opacity: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 0.5 : 1 }} onClick={() => initiateAttendance('OUT')} disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}>
              <LogOut size={18} /> Check Out
            </motion.button>
          </div>
        )}
      </div>`;

const buttonsReplacement = `            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: todayAttendance?.check_in ? 'rgba(16,185,129,0.1)' : 'linear-gradient(to right, #10b981, #059669)', color: todayAttendance?.check_in ? '#10b981' : '#fff', border: todayAttendance?.check_in ? '1px solid #10b981' : 'none', borderRadius: '12px', boxShadow: todayAttendance?.check_in ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }} onClick={() => initiateAttendance('IN')} disabled={!!todayAttendance?.check_in}>
              <Camera size={18} /> {todayAttendance?.check_in ? 'Checked In' : 'Check In'}
            </motion.button>
            
            {todayAttendance?.check_in && !todayAttendance?.check_out && (
              isOnBreak ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-warning" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(to right, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 14px 0 rgba(245, 158, 11, 0.39)' }} onClick={handleEndBreak}>
                  <Clock size={18} /> End Break
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-secondary" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '12px' }} onClick={handleStartBreak}>
                  <Clock size={18} /> Start Break
                </motion.button>
              )
            )}
            
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 'rgba(239,68,68,0.1)' : 'linear-gradient(to right, #ef4444, #dc2626)', color: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? '#ef4444' : '#fff', border: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? '1px solid #ef4444' : 'none', borderRadius: '12px', boxShadow: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 'none' : '0 4px 14px 0 rgba(239, 68, 68, 0.39)', opacity: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 0.5 : 1 }} onClick={() => initiateAttendance('OUT')} disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}>
              <LogOut size={18} /> Check Out
            </motion.button>
          </div>
        )}
      </div>`;

content = content.replace(buttonsSection, buttonsReplacement);

fs.writeFileSync(file, content);
console.log('Patched AttendanceCard.tsx');
