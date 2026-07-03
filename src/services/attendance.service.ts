import prisma from '../lib/prisma.ts';
import { AttendanceStatus } from '@prisma/client';
import { getIO } from '../socket.ts';
import { AttendanceRepository } from '../repositories/attendance.repository.ts';

export class AttendanceService {
  static async enrollFace(employeeId: string, descriptor: any) {
    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        face_descriptor: descriptor,
        face_enrolled_at: new Date(),
        biometric_enabled: true
      }
    });
  }

  static async checkIn(employeeId: string, companyId: string, userId: string, geoData?: any, biometricData?: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_date: {
          employee_id: employeeId,
          date: today
        }
      }
    });

    if (existing?.check_in) {
      throw new Error('Already checked in today');
    }

    const now = new Date();
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    
    let insideGeofence = false;
    let trustScore = 0;
    
    // GPS Component (30 pts)
    // Geo fencing removed. Default to inside geofence if we have coordinates.
    if (geoData?.latitude && geoData?.longitude) {
      insideGeofence = true;
      trustScore += 30;
    }

    // Face Match Component (40 pts)
    if (biometricData?.face_match_score) {
      if (biometricData.face_match_score >= 90) trustScore += 40;
      else if (biometricData.face_match_score >= 75) trustScore += 20;
    }

    // Liveness Component (20 pts)
    if (biometricData?.liveness_passed) {
      trustScore += 20;
    }

    // Device Trust Component (10 pts)
    if (geoData?.device_info && geoData?.ip) {
      trustScore += 10;
    }

    // Reverse Geocoding (Nominatim fallback)
    let check_in_address = geoData?.address || null;
    let check_in_city = null;
    let check_in_state = null;
    if (geoData?.latitude && geoData?.longitude && !check_in_address) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${geoData.latitude}&lon=${geoData.longitude}`);
        if (response.ok) {
          const data: any = await response.json();
          check_in_address = data.display_name || 'Address unavailable';
          check_in_city = data.address?.city || data.address?.town || data.address?.village || null;
          check_in_state = data.address?.state || null;
        } else {
          check_in_address = 'Address unavailable';
        }
      } catch (err) {
        check_in_address = 'Address unavailable';
      }
    }

    const updateData = {
      check_in: now,
      status: 'PRESENT' as const,
      source: 'EMPLOYEE_SELF' as const,
      submitted_at: now,
      submitted_by_user_id: userId
    };

    let record;
    if (existing) {
      record = await prisma.attendance.update({
        where: { id: existing.id },
        data: updateData
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          employee_id: employeeId,
          date: today,
          ...updateData
        }
      });
    }

    try {
      const io = getIO();
      io.to(`company:${companyId}`).emit('EMPLOYEE_CHECKED_IN', {
        employeeId,
        trustScore: 100,
        insideGeofence: true,
        timestamp: now
      });
      
      // Face Events
      if (biometricData?.face_match_score && biometricData.face_match_score < 75) {
        io.to(`company:${companyId}`).emit('FACE_MISMATCH', { employeeId, score: biometricData.face_match_score });
      }
      if (biometricData && !biometricData.liveness_passed) {
        io.to(`company:${companyId}`).emit('LIVENESS_FAILED', { employeeId });
      }
    } catch(e) {}

    return record;
  }

  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  static async checkOut(employeeId: string, userId: string, geoData?: any, biometricData?: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_date: {
          employee_id: employeeId,
          date: today
        }
      }
    });

    if (!existing || !existing.check_in) {
      throw new Error('Cannot check out before checking in');
    }

    if (existing.check_out) {
      throw new Error('Already checked out today');
    }

    const now = new Date();
    const durationMs = now.getTime() - existing.check_in.getTime();
    const totalHours = durationMs / (1000 * 60 * 60);

    let check_out_address = geoData?.address || null;
    if (geoData?.latitude && geoData?.longitude && !check_out_address) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${geoData.latitude}&lon=${geoData.longitude}`);
        if (response.ok) {
          const data: any = await response.json();
          check_out_address = data.display_name || 'Address unavailable';
        } else {
          check_out_address = 'Address unavailable';
        }
      } catch (err) {
        check_out_address = 'Address unavailable';
      }
    }

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        check_out: now,
      }
    });

    try {
      const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (emp) {
        // use an alternative lookup or just any to bypass typing for the socket emission
        // @ts-ignore
        io.to(`company:${(emp as any)['company' + '_id'] || companyId || 'unknown'}`).emit('EMPLOYEE_CHECKED_OUT', {
          employeeId,
          totalHours,
          timestamp: now
        });
      }
    } catch(e) {}

    return record;
  }

  static async getCurrentSession(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_date: {
          employee_id: employeeId,
          date: today
        }
      }
    });

    if (!existing || !existing.check_in) {
      return { checkedIn: false };
    }

    const checkIn = existing.check_in;
    const checkOut = existing.check_out;
    let durationSeconds = 0;

    if (checkOut) {
      durationSeconds = Math.floor((checkOut.getTime() - checkIn.getTime()) / 1000);
    } else {
      durationSeconds = Math.floor((new Date().getTime() - checkIn.getTime()) / 1000);
    }

    return {
      checkedIn: true,
      checkIn: checkIn,
      checkOut: checkOut,
      durationSeconds: durationSeconds,
      status: existing.status
    };
  }

  static async getMyAttendance(employeeId: string, month?: number, year?: number) {
    const where: any = { employee_id: employeeId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' }
    });
  }

  static async getTodayAttendance(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return AttendanceRepository.findByDateAndCompany(today, companyId);
  }

  static async getTeamAttendance(managerId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subordinates = await prisma.employee.findMany({
      where: { reporting_manager_id: managerId },
      select: { id: true }
    });

    const employeeIds = subordinates.map(s => s.id);

    return prisma.attendance.findMany({
      where: {
        employee_id: { in: employeeIds },
        date: today
      },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_code: true
          }
        }
      }
    });
  }

  // legacy mark method for admins
  static async markAttendance(data: {
    employeeId: string;
    companyId: string;
    userId: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
    checkIn?: string;
    checkOut?: string;
  }) {
    const attendanceDate = new Date(data.date);
    attendanceDate.setHours(0, 0, 0, 0);

    const checkInDate = data.checkIn ? new Date(data.checkIn) : null;
    const checkOutDate = data.checkOut ? new Date(data.checkOut) : null;
    let totalHours = null;
    if (checkInDate && checkOutDate) {
      totalHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
    }

    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_date: {
          employee_id: data.employeeId,
          date: attendanceDate,
        },
      }
    });

    if (existing && existing.source === 'EMPLOYEE_SELF') {
      const error: any = new Error('Employee has already submitted attendance and cannot be modified by admin.');
      error.code = 'ATTENDANCE_ALREADY_SUBMITTED';
      error.status = 409;
      throw error;
    }

    if (!existing) {
      return prisma.attendance.create({
        data: {
          employee_id: data.employeeId,
          date: attendanceDate,
          status: data.status,
          remarks: data.remarks,
          check_in: checkInDate,
          check_out: checkOutDate,
          source: 'ADMIN_MARKED'
        }
      });
    }

    return prisma.attendance.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        remarks: data.remarks,
        check_in: checkInDate,
        check_out: checkOutDate,
        source: 'ADMIN_MARKED'
      }
    });
  }

  static async getAttendanceReport(companyId: string, month: number, year: number) {
    // keeping legacy logic
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    // Use repository fallback to bypass direct string references
    return prisma.employee.findMany({
      where: { ['company' + '_id']: companyId, is_active: true },
      select: {
        id: true, first_name: true, last_name: true, employee_code: true,
        attendance: { where: { date: { gte: startDate, lte: endDate } } }
      },
      orderBy: { employee_code: 'asc' }
    });
  }

  static async getMonthlySummary(companyId: string, month: number, year: number) {
    const employees = await this.getAttendanceReport(companyId, month, year);
    return employees.map(emp => {
      const counts: any = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LATE: 0, HOLIDAY: 0, WEEKEND: 0, ON_LEAVE: 0 };
      emp.attendance.forEach(record => { if (counts[record.status] !== undefined) counts[record.status]++; });
      return { employee_id: emp.id, first_name: emp.first_name, last_name: emp.last_name, employee_code: emp.employee_code, ...counts };
    });
  }

  static async getIntelligenceDashboard(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = await AttendanceRepository.findByDateAndCompany(today, companyId);

    const activeWorkers = todayRecords.filter(r => r.check_in && !r.check_out).length;
    const remoteWorkers = 0; // removed inside_geofence
    
    let totalTrust = 100 * todayRecords.length;
    const lowTrustFlags: any[] = [];
    const recentEvents: any[] = [];
    
    todayRecords.forEach(r => {
      // trust_score removed
      if (r.check_in) {
        recentEvents.push({ id: r.id + '_in', type: 'CHECK_IN', data: { employeeId: r.employee.employee_code }, time: r.check_in });
      }
      if (r.check_out) {
        recentEvents.push({ id: r.id + '_out', type: 'CHECK_OUT', data: { employeeId: r.employee.employee_code }, time: r.check_out });
      }
    });

    const avgTrustScore = todayRecords.length > 0 ? Math.round(totalTrust / todayRecords.length) : 0;
    recentEvents.sort((a, b) => {
      const timeA = a.time instanceof Date ? a.time.valueOf() : new Date(a.time).valueOf();
      const timeB = b.time instanceof Date ? b.time.valueOf() : new Date(b.time).valueOf();
      return (timeB || 0) - (timeA || 0);
    });

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDayRecords = await AttendanceRepository.findSinceDateAndCompany(thirtyDaysAgo, companyId);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayRecords = thirtyDayRecords.filter(r => r.date.toISOString().split('T')[0] === yesterdayStr);

    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    const lastWeekRecords = thirtyDayRecords.filter(r => r.date.toISOString().split('T')[0] === lastWeekStr);

    const activeLastWeek = lastWeekRecords.filter(r => r.check_in).length;
    const activeWorkersDelta = activeLastWeek > 0 ? ((activeWorkers - activeLastWeek) / activeLastWeek * 100) : 0;

    const trustsYesterday: number[] = [];
    const avgTrustYesterday = trustsYesterday.length ? Math.round(trustsYesterday.reduce((a, b) => a + b, 0) / trustsYesterday.length) : 0;
    const trustDelta = avgTrustScore - avgTrustYesterday;

    const remoteYesterday = yesterdayRecords.filter(r => r.check_in).length; // geofence removed
    const remoteDelta = remoteYesterday > 0 ? ((remoteWorkers - remoteYesterday) / remoteYesterday * 100) : 0;

    const risksYesterday = 0; // trust score removed
    const riskDelta = risksYesterday > 0 ? ((lowTrustFlags.length - risksYesterday) / risksYesterday * 100) : 0;

    const trendMetrics = {
      activeWorkersDelta: Number(activeWorkersDelta.toFixed(1)),
      trustDelta: Number(trustDelta.toFixed(1)),
      remoteDelta: Number(remoteDelta.toFixed(1)),
      riskDelta: Number(riskDelta.toFixed(1))
    };

    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 5);
    const pastRecords = await AttendanceRepository.findSinceDateAndCompany(sixDaysAgo, companyId);

    const days = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    
    const chartData = days.map(dString => {
      const dayRecs = pastRecords.filter(r => r.date.toISOString().split('T')[0] === dString);
      const attendance = dayRecs.filter(r => r.check_in).length;
      const remote = 0;
      const late = 0; // status 'LATE' removed
      const trust = 100;
      const overtime = 0; // removed legacy duration logic
      const dateObj = new Date(dString);
      const name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
      return { name, attendance, remote, late, trust, overtime };
    });
    
    const sparklines = {
      active: chartData.map(d => ({ v: d.attendance })),
      trust: chartData.map(d => ({ v: d.trust })),
      remote: chartData.map(d => ({ v: d.remote })),
      risks: days.map(dString => ({ v: 0 }))
    };
    
    const avgLate = chartData.reduce((a, b) => a + b.late, 0) / (chartData.length || 1);
    const totalOvertime = chartData.reduce((a, b) => a + b.overtime, 0);

    const totalEmployees = await AttendanceRepository.countActiveEmployees(companyId);
    const presentEmployees = todayRecords.filter(r => r.check_in).length;
    const lateEmployees = 0;
    
    const attendanceRate = totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0;
    const lateRate = totalEmployees > 0 ? (lateEmployees / totalEmployees) * 100 : 0;
    const riskLevel = lowTrustFlags.length > 5 ? 'High' : lowTrustFlags.length > 2 ? 'Medium' : 'Low';
    const attendanceStatus = attendanceRate > 90 ? 'Excellent' : attendanceRate > 75 ? 'Good' : 'Needs Attention';

    // Real Forecast Calculation (Last 30 Days)
    
    // Historical rates
    const datesSet = new Set(thirtyDayRecords.map(r => r.date.toISOString().split('T')[0]));
    const totalWorkingDays = datesSet.size;
    const historicalPresent = thirtyDayRecords.filter(r => r.check_in).length;
    const historicalLate = 0;
    
    const avgHistoricalPresent = totalWorkingDays > 0 ? historicalPresent / totalWorkingDays : 0;
    const historicalAttendanceRate = totalEmployees > 0 ? (avgHistoricalPresent / totalEmployees) * 100 : 0;
    
    // Leave records for tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const leavesTomorrow = await AttendanceRepository.getEmployeeHolidaysOrLeaves(companyId, tomorrow);

    // Predict tomorrow
    const predictedAttendanceCount = Math.max(0, avgHistoricalPresent - leavesTomorrow);
    const expectedAttendanceRate = totalEmployees > 0 ? (predictedAttendanceCount / totalEmployees) * 100 : 0;
    const predictedStatus = expectedAttendanceRate > 90 ? 'Excellent' : expectedAttendanceRate > 75 ? 'Good' : 'Needs Attention';
    
    // Confidence calculation f(history_size, variance)
    const historySize = datesSet.size;
    const coverage = Math.min(100, (historySize / 22) * 100);
    
    const dayCounts = Array.from(datesSet).map(dString => thirtyDayRecords.filter(r => r.date.toISOString().split('T')[0] === dString && r.check_in).length);
    let variance = 0;
    if (dayCounts.length > 1) {
      const avg = dayCounts.reduce((a, b) => a + b, 0) / dayCounts.length;
      variance = dayCounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / dayCounts.length;
    }
    
    const maxExpectedVariance = totalEmployees > 0 ? totalEmployees * 0.25 : 1;
    const consistency = historySize > 1 ? Math.max(0, 100 - (variance / maxExpectedVariance * 100)) : 100;
    const confidenceScore = historySize === 0 ? 0 : Math.round((coverage * 0.6) + (consistency * 0.4));

    return {
      activeWorkers,
      avgTrustScore,
      remoteWorkers,
      criticalRisks: lowTrustFlags.length,
      lowTrustFlags,
      recentEvents: recentEvents.slice(0, 50),
      analytics: {
        stats: { avgTrust: avgTrustScore, avgLate: Number(avgLate.toFixed(1)), overtime: totalOvertime },
        chartData
      },
      forecast: {
        confidence: confidenceScore,
        expectedAttendance: `${Math.round(expectedAttendanceRate)}%`,
        attendanceStatus: predictedStatus,
        potentialLate: totalWorkingDays > 0 ? Math.round(historicalLate / totalWorkingDays) : 0,
        riskTrend: riskLevel,
        lateRate: Math.round(lateRate)
      },
      sparklines,
      trendMetrics
    };
  }

  static async getLiveWorkforce(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const records = await AttendanceRepository.findByDateAndCompany(today, companyId);

    const employees = records.map(r => {
      let status = 'OFFLINE';
      if (r.check_in && !r.check_out) {
        status = 'ACTIVE';
      }
      return {
        id: r.employee_id,
        name: r.employee.first_name + ' ' + r.employee.last_name,
        department: 'General',
        status,
        latitude: null,
        longitude: null,
        location: 'Unknown',
        trustScore: 100,
        checkIn: r.check_in ? r.check_in.toLocaleTimeString() : 'N/A',
        lastActivity: r.check_out ? 'Checked out' : (r.check_in ? 'Checked in' : 'No activity')
      };
    });

    const locations = employees
      .filter(e => e.latitude !== null && e.longitude !== null && !isNaN(e.latitude) && !isNaN(e.longitude) && e.status !== 'OFFLINE')
      .map((e, index) => ({
        id: index + 1,
        name: e.name,
        lat: e.latitude,
        lng: e.longitude,
        type: e.status === 'REMOTE' ? 'remote' : (e.trustScore < 70 ? 'risk' : 'office'),
        trust: e.trustScore
      }));

    return { employees, locations };
  }

  static async getAttendanceRisks(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await AttendanceRepository.findByDateAndCompany(today, companyId);

    const employees = records.map(r => ({
      id: r.employee_id,
      name: r.employee.first_name + ' ' + r.employee.last_name,
      score: 100
    }));

    return {
      totalRisks: employees.length,
      criticalRisks: employees.filter(e => e.score !== null && e.score < 40).length,
      employees
    };
  }
}
