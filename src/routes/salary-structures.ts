import { Router } from 'express';
import prisma from '../lib/prisma.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { upsertSalaryStructureSchema } from '../schemas/salaryStructure.schema.ts';

const router = Router();
router.use(authenticate);

// List structures
router.get('/', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const structures = await prisma.salaryStructure.findMany({
      where: { company_id: req.user!.company_id as string },
      include: {
        _count: {
          select: { salaries: { where: { employee: { is_active: true } } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    // Map _count.salaries to employee_count
    const mapped = structures.map(s => ({
      ...s,
      employee_count: s._count.salaries
    }));
    
    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

// Get by ID
router.get('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const structure = await prisma.salaryStructure.findUnique({
      where: { id: req.params.id as string },
      include: {
        components: {
          include: { salary_component: true },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    if (!structure || structure.company_id !== req.user!.company_id) {
      return res.status(404).json({ error: 'Structure not found' });
    }

    res.json(structure);
  } catch (err) {
    next(err);
  }
});

// Create
router.post('/', authorize('ADMIN', 'HR'), validate(upsertSalaryStructureSchema), async (req: AuthRequest, res, next) => {
  try {
    const { name, description, components } = req.body;
    const companyId = req.user!.company_id as string;

    // 1. Check unique name
    const existing = await prisma.salaryStructure.findUnique({
      where: { company_id_name: { company_id: companyId, name } }
    });
    if (existing) {
      return res.status(400).json({ error: 'A salary structure with this name already exists' });
    }

    // 2. Check active components
    const componentIds = components.map((c: any) => c.salary_component_id);
    const dbComponents = await prisma.salaryComponent.findMany({
      where: { id: { in: componentIds }, company_id: companyId }
    });
    
    if (dbComponents.length !== componentIds.length) {
      return res.status(400).json({ error: 'Some components do not exist or belong to another company' });
    }
    
    const inactive = dbComponents.filter((c: any) => !c.is_active);
    if (inactive.length > 0) {
      return res.status(400).json({ error: 'Cannot attach inactive components to a structure' });
    }

    const structure = await prisma.salaryStructure.create({
      data: {
        company_id: companyId,
        name,
        description,
        created_by: req.user!.id,
        components: {
          create: components.map((c: any) => ({
            salary_component_id: c.salary_component_id,
            calculation_type: c.calculation_type,
            value: c.value,
            max_limit: c.max_limit,
            sequence: c.sequence
          }))
        }
      },
      include: { components: true }
    });

    res.status(201).json(structure);
  } catch (err) {
    next(err);
  }
});

// Edit
router.put('/:id', authorize('ADMIN', 'HR'), validate(upsertSalaryStructureSchema), async (req: AuthRequest, res, next) => {
  try {
    const { name, description, components } = req.body;
    const companyId = req.user!.company_id as string;

    const existingStructure = await prisma.salaryStructure.findUnique({ where: { id: req.params.id as string } });
    if (!existingStructure || existingStructure.company_id !== companyId) {
      return res.status(404).json({ error: 'Structure not found' });
    }

    if (existingStructure.name === 'Standard Indian Corporate') {
      return res.status(400).json({ error: 'System structures cannot be modified directly' });
    }

    if (name !== existingStructure.name) {
      const duplicateName = await prisma.salaryStructure.findUnique({
        where: { company_id_name: { company_id: companyId, name } }
      });
      if (duplicateName) {
        return res.status(400).json({ error: 'A salary structure with this name already exists' });
      }
    }

    // Check active components
    const componentIds = components.map((c: any) => c.salary_component_id);
    const dbComponents = await prisma.salaryComponent.findMany({
      where: { id: { in: componentIds }, company_id: companyId }
    });
    const inactive = dbComponents.filter((c: any) => !c.is_active);
    if (inactive.length > 0) {
      return res.status(400).json({ error: 'Cannot attach inactive components to a structure' });
    }

    const structure = await prisma.$transaction(async (tx) => {
      // Clear old components
      await tx.salaryStructureComponent.deleteMany({
        where: { salary_structure_id: req.params.id as string }
      });

      // Update structure and create new components
      return await tx.salaryStructure.update({
        where: { id: req.params.id as string },
        data: {
          name,
          description,
          components: {
            create: components.map((c: any) => ({
              salary_component_id: c.salary_component_id,
              calculation_type: c.calculation_type,
              value: c.value,
              max_limit: c.max_limit,
              sequence: c.sequence
            }))
          }
        },
        include: { components: true }
      });
    });

    res.json(structure);
  } catch (err) {
    next(err);
  }
});

// Duplicate
router.post('/:id/duplicate', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user!.company_id as string;
    const existing = await prisma.salaryStructure.findUnique({
      where: { id: req.params.id as string },
      include: { components: true }
    });

    if (!existing || existing.company_id !== companyId) {
      return res.status(404).json({ error: 'Structure not found' });
    }

    const newName = existing.name + ' (Copy) ' + Date.now().toString().slice(-4);

    const duplicate = await prisma.salaryStructure.create({
      data: {
        company_id: companyId,
        name: newName,
        description: existing.description,
        created_by: req.user!.id,
        is_active: true,
        components: {
          create: existing.components.map((c: any) => ({
            salary_component_id: c.salary_component_id,
            calculation_type: c.calculation_type,
            value: c.value,
            max_limit: c.max_limit,
            sequence: c.sequence
          }))
        }
      },
      include: { components: true }
    });

    res.status(201).json(duplicate);
  } catch (err) {
    next(err);
  }
});

// Archive / Delete
router.delete('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const structure = await prisma.salaryStructure.findUnique({
      where: { id: req.params.id as string },
      include: {
        _count: {
          select: { salaries: { where: { employee: { is_active: true } } } }
        }
      }
    });

    if (!structure || structure.company_id !== req.user!.company_id as string) {
      return res.status(404).json({ error: 'Structure not found' });
    }

    if (structure.name === 'Standard Indian Corporate') {
      return res.status(400).json({ error: 'System structures cannot be deleted' });
    }

    if (structure._count.salaries > 0) {
      return res.status(400).json({ error: 'Cannot archive a structure assigned to active employees' });
    }

    const archived = await prisma.salaryStructure.update({
      where: { id: req.params.id as string },
      data: { is_active: false }
    });

    res.json({ message: 'Structure archived successfully', structure: archived });
  } catch (err) {
    next(err);
  }
});

// Assign structure to employees (Bulk)
router.post('/:id/assign', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const { employeeIds, effectiveFrom } = req.body;
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ error: 'employeeIds array is required' });
    }
    if (!effectiveFrom) {
      return res.status(400).json({ error: 'effectiveFrom date is required' });
    }

    const companyId = req.user!.company_id as string;
    const structure = await prisma.salaryStructure.findUnique({ where: { id: req.params.id as string } });
    
    if (!structure || structure.company_id !== companyId || !structure.is_active) {
      return res.status(400).json({ error: 'Invalid or inactive salary structure' });
    }

    // For each employee, we only update salary_structure_id of their *current* active EmployeeSalary record
    // Alternatively, the UI should pass the complete CTC, but we'll assume we are only updating the structure pointer.
    
    let updatedCount = 0;
    
    await prisma.$transaction(async (tx) => {
      for (const empId of employeeIds) {
        // Find current active salary
        const currentSalary = await tx.employeeSalary.findFirst({
          where: { employee_id: empId, effective_to: null }
        });
        
        if (currentSalary) {
          // End current salary
          await tx.employeeSalary.update({
            where: { id: currentSalary.id },
            data: { effective_to: new Date(effectiveFrom) }
          });
          
          // Create new salary record with the new structure, copying CTC
          await tx.employeeSalary.create({
            data: {
              employee_id: empId,
              salary_structure_id: structure.id,
              effective_from: new Date(effectiveFrom),
              ctc_annual: currentSalary.ctc_annual,
              ctc_monthly: currentSalary.ctc_monthly,
              revision_reason: 'Bulk Structure Re-assignment',
              created_by: req.user!.id
            }
          });
          updatedCount++;
        }
      }
    });

    res.json({ message: `Successfully assigned structure to ${updatedCount} employees`, assigned_employee_count: updatedCount });
  } catch (err) {
    next(err);
  }
});

export default router;
