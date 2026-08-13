const fs = require('fs');

const file = 'src/services/attendance.service.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add breakStart and breakEnd functions
const breakFuncs = `
  static async startBreak(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_date: {
          employee_id: employeeId,
          date: today
        }
      },
      include: { breaks: true }
    });

    if (!existing || !existing.check_in) {
      throw new Error('Cannot start break without checking in');
    }

    if (existing.check_out) {
      throw new Error('Cannot start break after check out');
    }

    const openBreak = existing.breaks?.find((b: any) => !b.end_time);
    if (openBreak) {
      throw new Error('A break is already active');
    }

    return await prisma.attendanceBreak.create({
      data: {
        attendance_id: existing.id,
        start_time: new Date()
      }
    });
  }

  static async endBreak(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_date: {
          employee_id: employeeId,
          date: today
        }
      },
      include: { breaks: true }
    });

    if (!existing || !existing.check_in) {
      throw new Error('Cannot end break without checking in');
    }

    const openBreak = existing.breaks?.find((b: any) => !b.end_time);
    if (!openBreak) {
      throw new Error('No active break found');
    }

    const now = new Date();
    const durationMs = now.getTime() - openBreak.start_time.getTime();
    const durationMins = Math.floor(durationMs / 60000);

    return await prisma.attendanceBreak.update({
      where: { id: openBreak.id },
      data: {
        end_time: now,
        duration: durationMins
      }
    });
  }
`;

content = content.replace('static async checkOut', breakFuncs + '\n  static async checkOut');

// 2. Modify checkIn to calculate late arrival
const checkInStartSearch = `    const updateData = {
      check_in: now,
      status: 'PRESENT' as const,
      source: 'EMPLOYEE_SELF' as const,
      submitted_at: now,
      submitted_by_user_id: userId
    };`;

const checkInReplacement = `
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { shift: true }
    });

    let lateMinutes = 0;
    if (employee?.shift?.start_time) {
      const [h, m] = employee.shift.start_time.split(':').map(Number);
      const expectedStart = new Date(now);
      expectedStart.setHours(h, m, 0, 0);
      
      const diffMs = now.getTime() - expectedStart.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins > employee.shift.grace_period) {
        lateMinutes = diffMins;
      }
    }

    const updateData = {
      check_in: now,
      status: 'PRESENT' as const,
      source: 'EMPLOYEE_SELF' as const,
      submitted_at: now,
      submitted_by_user_id: userId,
      late_minutes: lateMinutes
    };`;

content = content.replace(checkInStartSearch, checkInReplacement);


// 3. Modify checkOut to calculate working_hours, break_hours, early_exit_minutes
const checkOutBodySearch = `    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        check_out: now,
      }
    });`;

const checkOutBodyReplacement = `
    const attendanceWithBreaks = await prisma.attendance.findUnique({
      where: { id: existing.id },
      include: { breaks: true, employee: { include: { shift: true } } }
    });
    
    let breakDurationMins = 0;
    attendanceWithBreaks?.breaks?.forEach((b: any) => {
      if (b.duration) breakDurationMins += b.duration;
    });

    const breakHours = breakDurationMins / 60;
    const workingHours = totalHours - breakHours;

    let earlyExitMins = 0;
    let isHalfDay = false;
    let overtimeHours = 0;
    
    const shift = attendanceWithBreaks?.employee?.shift;
    if (shift && shift.end_time) {
      const [eh, em] = shift.end_time.split(':').map(Number);
      const expectedEnd = new Date(now);
      expectedEnd.setHours(eh, em, 0, 0);
      
      const diffMs = expectedEnd.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins > 0) {
        earlyExitMins = diffMins;
      } else if (diffMins < -60) {
        overtimeHours = Math.abs(diffMins) / 60; // Overtime after 1hr
      }

      if (workingHours < shift.half_day_hours) {
        isHalfDay = true;
      }
    }

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        check_out: now,
        working_hours: workingHours,
        break_hours: breakHours,
        early_exit_minutes: earlyExitMins,
        is_half_day: isHalfDay,
        over_time_hours: overtimeHours > 0 ? overtimeHours : undefined
      }
    });`;

content = content.replace(checkOutBodySearch, checkOutBodyReplacement);


// 4. Modify getCurrentSession to include breaks
const currentSessionRegex = /return \{\s*checkedIn: true,\s*checkIn: checkIn,\s*checkOut: checkOut,\s*durationSeconds: durationSeconds,\s*status: existing\.status\s*\};/;
const currentSessionReplacement = `
    const existingWithBreaks = await prisma.attendance.findUnique({
      where: { id: existing.id },
      include: { breaks: true }
    });
    
    const activeBreak = existingWithBreaks?.breaks?.find((b: any) => !b.end_time);

    return {
      checkedIn: true,
      checkIn: checkIn,
      checkOut: checkOut,
      durationSeconds: durationSeconds,
      status: existing.status,
      onBreak: !!activeBreak,
      activeBreak: activeBreak
    };
`;
content = content.replace(currentSessionRegex, currentSessionReplacement);

fs.writeFileSync(file, content);
console.log('Patched attendance.service.ts');
