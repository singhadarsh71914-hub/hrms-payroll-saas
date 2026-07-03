import rateLimit from 'express-rate-limit';

export const payrollRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many payroll requests from this company, please try again after an hour',
  keyGenerator: (req: any) => req.user?.company_id || req.ip
});

export const pdfRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Too many PDF generations, please try again after an hour',
  keyGenerator: (req: any) => req.user?.company_id || req.ip
});

export const complianceRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many compliance edits, please try again after an hour',
  keyGenerator: (req: any) => req.user?.company_id || req.ip
});
