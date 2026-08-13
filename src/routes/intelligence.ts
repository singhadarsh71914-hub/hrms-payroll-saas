import { Router } from 'express';
import { authenticate } from '../middleware/auth.ts';
import { addWorkforceIntelligenceJob } from '../services/queue.service.ts';
import { processWorkforceIntelligenceJob } from '../workers/intelligence.worker.ts';
import prisma from '../lib/prisma.ts';
import { AttendanceIntelligenceService } from '../services/intelligence/attendance.service.ts';
import { PayrollForecastService } from '../services/intelligence/payroll-forecast.service.ts';
import { MetricsService } from '../services/metrics.service.ts';
import { FeatureStoreService } from '../services/intelligence/feature-store.service.ts';

const router = Router();

router.use(authenticate);

// Trigger a background calculation
router.post('/calculate', async (req: any, res: any) => {
  try {
    const { type } = req.body;
    const job = await addWorkforceIntelligenceJob(req.user?.company_id, undefined, type);
    
    // If Redis is disabled, the job ID is 'mock'. Execute synchronously!
    if (job.id === 'mock') {
      await processWorkforceIntelligenceJob({ companyId: req.user?.company_id, type: type || 'ALL' });
      res.json({ message: 'Calculation completed synchronously', jobId: job.id });
    } else {
      res.json({ message: 'Calculation started in background', jobId: job.id });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard sync data
router.get('/dashboard', async (req: any, res: any) => {
  try {
    const companyId = req.user.company_id;
    MetricsService.recordHistogram('ai_dashboard_load_ms', Date.now());

    const latest = await FeatureStoreService.getLatestCompanySnapshot(companyId);

    // Get top employee risk snapshots for attrition heatmap
    const empSnapshots = await FeatureStoreService.getLatestEmployeeSnapshots(companyId);
    const attritionScores = empSnapshots.map((s: any) => ({
      employee_id: s.employee_id,
      name: s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : s.employee_id,
      attrition_risk: s.attrition_risk,
      burnout_risk: s.burnout_risk,
      attendance_score: s.attendance_score,
      reasons: s.anomalies || []
    }));

    // Forecast — from snapshot if available, otherwise compute live
    let forecast = {
      predicted_next_month: 0,
      confidence_interval: { lower: 0, upper: 0 },
      quarterly_projection: 0,
      hiring_impact: 0,
      trend_multiplier: 1.0
    };

    if (latest?.forecast_payload && typeof latest.forecast_payload === 'object') {
      const fp = latest.forecast_payload as any;
      forecast = {
        predicted_next_month: fp.predicted_next_month || 0,
        confidence_interval: fp.confidence_interval || { lower: 0, upper: 0 },
        quarterly_projection: fp.quarterly_projection || 0,
        hiring_impact: fp.hiring_impact || 0,
        trend_multiplier: fp.trend_multiplier || 1.0
      };
    } else {
      // Live computation fallback when no snapshot exists yet
      forecast = await PayrollForecastService.forecastCompanyPayroll(companyId);
    }

    res.json({
      success: true,
      data: {
        attritionScores,
        forecast,
        latestSnapshot: latest || null,
        hasData: !!latest
      }
    });
  } catch (err: any) {
    console.error('[Intelligence Dashboard]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get('/company', async (req: any, res: any) => {
  try {
    const companyId = req.user.company_id;
    const history = await FeatureStoreService.getCompanyHistory(companyId, 30);
    const latest = await FeatureStoreService.getLatestCompanySnapshot(companyId);
    res.json({ success: true, data: { latest, history } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/departments/:id', async (req: any, res: any) => {
  try {
    const companyId = req.user.company_id;
    const { id } = req.params;
    
    const snapshots = await prisma.departmentIntelligenceSnapshot.findMany({
      where: { company_id: companyId, department_id: id },
      orderBy: { snapshot_date: 'asc' }
    });
    
    res.json({ success: true, data: { history: snapshots } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/employees/:id', async (req: any, res: any) => {
  try {
    const companyId = req.user.company_id;
    const { id } = req.params;
    
    const snapshots = await prisma.employeeIntelligenceSnapshot.findMany({
      where: { company_id: companyId, employee_id: id },
      orderBy: { snapshot_date: 'asc' }
    });
    
    res.json({ success: true, data: { history: snapshots } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
