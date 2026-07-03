import { Router } from 'express';
import prisma from '../lib/prisma.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { createSalaryComponentSchema, updateSalaryComponentSchema } from '../schemas/salaryComponent.schema.ts';
import { FormulaEngine } from '../services/formula.service.ts';

const router = Router();
router.use(authenticate);

const SYSTEM_COMPONENTS = ['BASIC', 'HRA', 'PF', 'PT'];

// GET all components
router.get('/', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const components = await prisma.salaryComponent.findMany({
      where: { company_id: req.user!.company_id as string },
      orderBy: { name: 'asc' }
    });
    res.json(components);
  } catch (err) {
    next(err);
  }
});

// VALIDATE formula
router.post('/validate-formula', authorize('ADMIN', 'HR'), (req: AuthRequest, res: any) => {
  const { formula } = req.body;
  if (!formula) return res.status(400).json({ error: 'Formula is required' });
  const result = FormulaEngine.validate(formula);
  if (result.valid) return res.json({ valid: true });
  return res.status(400).json({ valid: false, error: result.error });
});

// CREATE custom component
router.post('/', authorize('ADMIN', 'HR'), validate(createSalaryComponentSchema), async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.salaryComponent.findFirst({
      where: { company_id: req.user!.company_id as string, code: req.body.code }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'A component with this code already exists' });
    }

    if (req.body.display_order !== undefined && req.body.display_order !== null) {
      const existingOrder = await prisma.salaryComponent.findFirst({
        where: { company_id: req.user!.company_id as string, display_order: req.body.display_order }
      });
      if (existingOrder) {
        return res.status(400).json({ error: 'display_order must be unique' });
      }
    }

    const component = await prisma.salaryComponent.create({
      data: {
        ...req.body,
        company_id: req.user!.company_id as string
      }
    });
    
    res.status(201).json(component);
  } catch (err) {
    next(err);
  }
});

// UPDATE component
router.put('/:id', authorize('ADMIN', 'HR'), validate(updateSalaryComponentSchema), async (req: AuthRequest, res, next) => {
  try {
    const comp = await prisma.salaryComponent.findUnique({ where: { id: req.params.id as string } });
    if (!comp || comp.company_id !== req.user!.company_id) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (SYSTEM_COMPONENTS.includes(comp.code) && req.body.code !== comp.code) {
      return res.status(400).json({ error: 'Cannot change code of system components' });
    }

    if (req.body.display_order !== undefined && req.body.display_order !== null && req.body.display_order !== comp.display_order) {
      const existingOrder = await prisma.salaryComponent.findFirst({
        where: { company_id: req.user!.company_id as string, display_order: req.body.display_order }
      });
      if (existingOrder) {
        return res.status(400).json({ error: 'display_order must be unique' });
      }
    }

    const component = await prisma.salaryComponent.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    
    res.json(component);
  } catch (err) {
    next(err);
  }
});

// DELETE / ARCHIVE component
router.delete('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const comp = await prisma.salaryComponent.findUnique({ where: { id: req.params.id as string } });
    if (!comp || comp.company_id !== req.user!.company_id) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (SYSTEM_COMPONENTS.includes(comp.code)) {
      return res.status(400).json({ error: 'System components cannot be deleted' });
    }

    // Instead of hard delete, we archive it (is_active = false)
    const archived = await prisma.salaryComponent.update({
      where: { id: req.params.id as string },
      data: { is_active: false }
    });
    
    res.json({ message: 'Component archived successfully', component: archived });
  } catch (err) {
    next(err);
  }
});

// DUPLICATE component
router.post('/:id/duplicate', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const comp = await prisma.salaryComponent.findUnique({ where: { id: req.params.id as string } });
    if (!comp || comp.company_id !== req.user!.company_id) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const duplicateCode = comp.code + '_COPY_' + Date.now().toString().slice(-4);
    
    const duplicate = await prisma.salaryComponent.create({
      data: {
        company_id: comp.company_id,
        name: comp.name + ' (Copy)',
        code: duplicateCode,
        description: comp.description,
        type: comp.type,
        category: comp.category,
        is_taxable: comp.is_taxable,
        is_statutory: comp.is_statutory,
        pf_applicable: comp.pf_applicable,
        esi_applicable: comp.esi_applicable,
        calculation_type: comp.calculation_type,
        value: comp.value,
        max_limit: comp.max_limit,
        is_active: true
      }
    });

    res.status(201).json(duplicate);
  } catch (err) {
    next(err);
  }
});

export default router;
