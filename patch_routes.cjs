const fs = require('fs');
const file = 'src/routes/attendance.ts';
let content = fs.readFileSync(file, 'utf8');

const routes = `
// Start Break
router.post('/break/start', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const result = await AttendanceService.startBreak(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// End Break
router.post('/break/end', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const result = await AttendanceService.endBreak(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
`;

if (!content.includes('/break/start')) {
  content = content.replace('// My Attendance', routes + '\n// My Attendance');
  fs.writeFileSync(file, content);
  console.log('Added break routes');
} else {
  console.log('Break routes already exist');
}
