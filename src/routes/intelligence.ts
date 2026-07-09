import { Router } from 'express';
import { authenticate } from '../middleware/auth.ts';
import { addWorkforceIntelligenceJob } from '../services/queue.service.ts';
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
    const job = await addWorkforceIntelligenceJob(req.user?.company_id, undefined);
    res.json({ message: 'Calculation started in background', jobId: job.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard sync data
router.get('/dashboard', async (req: any, res: any) => {
  try {
    const companyId = req.user.company_id;
    MetricsService.recordHistogram('ai_dashboard_load_ms', Date.now());
    
    // Now reads from the feature store snapshots instead of raw DB!
    const latest = await FeatureStoreService.getLatestCompanySnapshot(companyId);
    
    if (latest) {
      res.json({
        success: true,
        data: {
          attritionScores: [], // Could fetch employee snapshots
          forecast: latest.forecast_payload || { trend_multiplier: 1.0 },
          latestSnapshot: latest
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        attritionScores: [],
        forecast: { trend_multiplier: 1.05 }
      }
    });
  } catch (err: any) {
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
