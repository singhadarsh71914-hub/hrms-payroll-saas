import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { UserRole } from '@prisma/client';

const router = Router();

// All compliance routes require authentication
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.HR));

router.get('/', ComplianceController.getRules);
router.post('/rules', ComplianceController.createRule);
router.put('/rules/:id', ComplianceController.updateRule);
router.post('/tax-slabs', ComplianceController.createTaxSlab);
router.put('/tax-slabs/:id', ComplianceController.updateTaxSlab);

export default router;
