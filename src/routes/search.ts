import { Router, Response } from 'express';
import prisma from '../lib/prisma.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string)?.trim();

  if (!q || q.length < 2) {
    return res.json({ results: { employees: [], leaves: [], payrolls: [], loans: [] } });
  }

  const company_id = req.user!.company_id;
  if (!company_id) {
    return res.status(403).json({ error: 'User not associated with a company' });
  }

  try {
    const nameParts = q.split(/\s+/).filter(Boolean);
    
    // Unified condition for employee name matching
    const nameMatchConditions: any[] = [
      { first_name: { contains: q, mode: 'insensitive' } },
      { last_name: { contains: q, mode: 'insensitive' } },
    ];

    if (nameParts.length > 1) {
      nameMatchConditions.push({
        AND: [
          { first_name: { contains: nameParts[0], mode: 'insensitive' } },
          { last_name: { contains: nameParts[nameParts.length - 1], mode: 'insensitive' } }
        ]
      });
      nameMatchConditions.push({
        AND: [
          { first_name: { contains: nameParts[nameParts.length - 1], mode: 'insensitive' } },
          { last_name: { contains: nameParts[0], mode: 'insensitive' } }
        ]
      });
    }

    // Pre-fetch matching employee IDs for consistent results across related entities
    const matchingEmployees = await prisma.employee.findMany({
      where: {
        company_id,
        is_active: true,
        OR: nameMatchConditions
      },
      select: { id: true }
    });
    const matchingEmployeeIds = matchingEmployees.map(e => e.id);

    let employees: any[] = [];
    let leaves: any[] = [];
    let payrolls: any[] = [];
    let loans: any[] = [];

    // 1. Employee Search
    try {
      employees = await prisma.employee.findMany({
        where: {
          company_id,
          is_active: true,
          employment_status: 'ACTIVE',
          OR: [
            ...nameMatchConditions,
            { employee_code: { contains: q, mode: 'insensitive' } },
            { work_email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { 
          id: true, 
          first_name: true, 
          last_name: true, 
          employee_code: true, 
          department: { select: { name: true } }, 
          designation: { select: { name: true } } 
        },
        take: 5,
      });
    } catch (e: any) { console.error('[Search] Employee query failed:', e.message); }

    // 2. Leave Search
    try {
      leaves = await prisma.leaveRequest.findMany({
        where: {
          OR: [
            { employee_id: { in: matchingEmployeeIds } },
            { 
              employee: { company_id },
              leave_type: { contains: q, mode: 'insensitive' }
            }
          ]
        },
        include: { employee: { select: { first_name: true, last_name: true } } },
        take: 3,
      });
    } catch (e: any) { console.error('[Search] Leave query failed:', e.message); }

    // 3. Payslip Search
    try {
      payrolls = await prisma.payslip.findMany({
        where: {
          OR: [
            { employee_id: { in: matchingEmployeeIds } },
            {
              employee: { 
                company_id,
                employee_code: { contains: q, mode: 'insensitive' }
              }
            }
          ]
        },
        include: { employee: { select: { first_name: true, last_name: true } } },
        take: 3,
      });
    } catch (e: any) { console.error('[Search] Payslip query failed:', e.message); }

    // 4. Loan Search
    try {
      loans = await prisma.loan.findMany({
        where: {
          OR: [
            { employee_id: { in: matchingEmployeeIds } },
            {
              employee: { company_id },
              loan_type: { equals: q.toUpperCase() as any }
            }
          ]
        },
        include: { employee: { select: { first_name: true, last_name: true } } },
        take: 3,
      }).catch(async () => {
        return await prisma.loan.findMany({
          where: { employee_id: { in: matchingEmployeeIds } },
          include: { employee: { select: { first_name: true, last_name: true } } },
          take: 3,
        });
      });
    } catch (e: any) { console.error('[Search] Loan query failed:', e.message); }

    const results = {
      employees: employees.map((e: any) => ({
        id: e.id,
        label: `${e.first_name} ${e.last_name}`,
        sub: `${e.employee_code} · ${e.department?.name || 'No Dept'} · ${e.designation?.name || 'No Desig'}`,
        type: 'employee',
        href: `/employees/${e.id}`,
      })),
      leaves: leaves.map((l: any) => ({
        id: l.id,
        label: `${l.employee?.first_name ?? ''} ${l.employee?.last_name ?? ''} — ${l.leave_type}`,
        sub: `Status: ${l.status}`,
        type: 'leave',
        href: `/leave`,
      })),
      payrolls: payrolls.map((p: any) => ({
        id: p.id,
        label: `${p.employee?.first_name ?? ''} ${p.employee?.last_name ?? ''} — ${p.month}/${p.year}`,
        sub: `Status: ${p.status}`,
        type: 'payroll',
        href: `/payroll`,
      })),
      loans: loans.map((l: any) => ({
        id: l.id,
        label: `${l.employee?.first_name ?? ''} ${l.employee?.last_name ?? ''} — ${l.loan_type}`,
        sub: `Status: ${l.status}`,
        type: 'loan',
        href: `/loans`,
      })),
    };

    res.json({ results });
  } catch (error: any) {
    console.error('[Search] Fatal error:', error.message);
    res.status(500).json({ error: 'Search failed on server', details: error.message });
  }
});

export default router;
