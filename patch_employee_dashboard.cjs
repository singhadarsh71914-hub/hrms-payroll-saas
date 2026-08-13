const fs = require('fs');

const file = 'client/src/pages/EmployeeDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const handles = `
  const handleStartBreak = async () => {
    try {
      await api.post('/attendance/break/start');
      fetchTodayAttendance();
      fetchCurrentSession();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    try {
      await api.post('/attendance/break/end');
      fetchTodayAttendance();
      fetchCurrentSession();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to end break');
    }
  };
`;

content = content.replace('const handleCheckOut = async', handles + '\n  const handleCheckOut = async');

content = content.replace(
  'initiateAttendance={initiateAttendance}',
  'initiateAttendance={initiateAttendance}\n            handleStartBreak={handleStartBreak}\n            handleEndBreak={handleEndBreak}'
);

fs.writeFileSync(file, content);
console.log('Patched EmployeeDashboard.tsx');
