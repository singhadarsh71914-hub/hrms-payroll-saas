import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { TaxService } from '../services/tax.service.ts';

const router = Router();

router.use(authenticate);

// 1. Get Company Tax Summary (HR/Admin)
router.get('/summary/:financialYear', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const fy = parseInt(req.params.financialYear);
    if (isNaN(fy)) return next(new AppError('Invalid financial year', 400));
    const summary = await TaxService.getCompanyTaxSummary(req.user!.company_id!, fy);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// 3. Bulk Download Form 16 as ZIP (HR/Admin)
router.get('/form16/bulk/:financialYear', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const fy = parseInt(req.params.financialYear);
    if (isNaN(fy)) return next(new AppError('Invalid financial year', 400));

    const zipBuffer = await TaxService.generateBulkForm16(req.user!.company_id!, fy);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=Form16_Bulk_${fy}-${fy+1}.zip`);
    res.send(zipBuffer);
  } catch (err) {
    next(err);
  }
});

// 2. Download Form 16 for specific employee (HR/Admin)
router.get('/form16/:employeeId/:financialYear', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const fy = parseInt(req.params.financialYear);
    if (isNaN(fy)) return next(new AppError('Invalid financial year', 400));

    const doc = await TaxService.generateForm16(req.params.employeeId, fy);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Form16_${req.params.employeeId}_${fy}.pdf`);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
});

// 4. Employee Self-Service: My Tax Summary
router.get('/my-summary/:financialYear', async (req: AuthRequest, res: any, next: any) => {
  try {
    if (!req.user?.employee_id) return next(new AppError('Employee profile not found', 403));
    const fy = parseInt(req.params.financialYear);
    if (isNaN(fy)) return next(new AppError('Invalid financial year', 400));

    const summary = await TaxService.calculateTaxSummary(req.user.employee_id, fy);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// 5. Employee Self-Service: Download My Form 16
router.get('/my-form16/:financialYear', async (req: AuthRequest, res: any, next: any) => {
  try {
    if (!req.user?.employee_id) return next(new AppError('Employee profile not found', 403));
    const fy = parseInt(req.params.financialYear);
    if (isNaN(fy)) return next(new AppError('Invalid financial year', 400));

    const doc = await TaxService.generateForm16(req.user.employee_id, fy);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Form16_${fy}.pdf`);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
