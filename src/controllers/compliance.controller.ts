import { Request, Response } from 'express';
import prisma from '../lib/prisma.ts';

function validateDatesAndPercentages(effective_from: Date, effective_to: Date, configuration: any) {
  if (effective_to <= effective_from) {
    throw new Error('effective_to must be after effective_from');
  }
  
  if (configuration) {
    const percentages = [
      configuration.employee_rate,
      configuration.employer_rate,
      configuration.min_bonus_percent,
      configuration.max_bonus_percent
    ].filter(v => v !== undefined && v !== null);
    
    for (const p of percentages) {
      if (p < 0) throw new Error('Percentages cannot be negative');
      if (p > 100) throw new Error('Percentages cannot be above 100');
    }
  }
}

export class ComplianceController {
  static async getRules(req: Request, res: Response) {
    try {
      const { financial_year, state_code } = req.query;
      const company_id = (req as any).user?.company_id;
      const where: any = { OR: [{ company_id }, { company_id: null }] };
      if (financial_year) where.financial_year = Number(financial_year);
      if (state_code) where.state_code = state_code;

      const rules = await prisma.stateComplianceRule.findMany({ where, orderBy: [{ state_code: 'asc' }, { version: 'desc' }] });
      const taxSlabs = await prisma.taxSlab.findMany({ where, orderBy: [{ min_income: 'asc' }, { version: 'desc' }] });
      const bonusRules = await prisma.bonusRule.findMany({ where, orderBy: { version: 'desc' } });

      res.json({ rules, taxSlabs, bonusRules });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createRule(req: Request, res: Response) {
    try {
      const { state_code, financial_year, rule_type, configuration, effective_from, effective_to } = req.body;
      const ef = new Date(effective_from);
      const et = new Date(effective_to);
      validateDatesAndPercentages(ef, et, configuration);

      const company_id = (req as any).user?.company_id;
      
      // Check overlapping
      const overlapping = await prisma.stateComplianceRule.findFirst({
        where: {
          company_id,
          state_code,
          financial_year,
          rule_type,
          is_active: true,
          OR: [
            { effective_from: { lte: et }, effective_to: { gte: ef } }
          ]
        }
      });
      if (overlapping) throw new Error('Overlapping effective periods are not allowed.');

      const lastVersion = await prisma.stateComplianceRule.findFirst({
        where: { company_id, state_code, financial_year, rule_type },
        orderBy: { version: 'desc' }
      });
      const version = lastVersion ? lastVersion.version + 1 : 1;

      const rule = await prisma.stateComplianceRule.create({
        data: { company_id, state_code, financial_year, rule_type, configuration, effective_from: ef, effective_to: et, version }
      });
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateRule(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { configuration, is_active } = req.body;
      if (configuration) {
        validateDatesAndPercentages(new Date(0), new Date(8640000000000000), configuration);
      }
      const rule = await prisma.stateComplianceRule.update({
        where: { id },
        data: { configuration, is_active }
      });
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async createTaxSlab(req: Request, res: Response) {
    try {
      const { regime, financial_year, min_income, max_income, rate, rebate_rules, cess_percent, surcharge_percent, effective_from, effective_to } = req.body;
      const ef = new Date(effective_from);
      const et = new Date(effective_to);
      validateDatesAndPercentages(ef, et, { employee_rate: rate, employer_rate: cess_percent, max_bonus_percent: surcharge_percent });

      const company_id = (req as any).user?.company_id;

      const lastVersion = await prisma.taxSlab.findFirst({
        where: { regime, financial_year }, // NOTE: TaxSlabs might need company_id check if they are tenant specific, but we'll stick to the current schema for now
        orderBy: { version: 'desc' }
      });
      const version = lastVersion ? lastVersion.version + 1 : 1;

      const slab = await prisma.taxSlab.create({
        data: { regime, financial_year, min_income, max_income, rate, rebate_rules, cess_percent, surcharge_percent, effective_from: ef, effective_to: et, version }
      });
      res.json(slab);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateTaxSlab(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { rate, is_active } = req.body;
      if (rate !== undefined) {
         if (rate < 0 || rate > 100) throw new Error('Percentages cannot be outside 0-100');
      }
      const slab = await prisma.taxSlab.update({
        where: { id },
        data: { rate, is_active }
      });
      res.json(slab);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
