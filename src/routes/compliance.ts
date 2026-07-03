import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', ComplianceController.getRules);

// Only ADMIN and HR can view/edit compliance rules
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.HR));

router.post('/rules', ComplianceController.createRule);
router.put('/rules/:id', ComplianceController.updateRule);
router.post('/tax-slabs', ComplianceController.createTaxSlab);
router.put('/tax-slabs/:id', ComplianceController.updateTaxSlab);

export default router;
