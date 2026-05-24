import prisma from '../lib/prisma.ts';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { sendEmail } from '../lib/email.ts';

const { Decimal } = Prisma;

export class PayrollService {
  static async calculateTDS(annualGross: number): Promise<number> {
    const standardDeduction = 75000;
    const taxableIncome = Math.max(0, annualGross - standardDeduction);

    // Rebate u/s 87A for FY 2025-26: Taxable income up to 12,00,000 is tax-free
    if (taxableIncome <= 1200000) {
      return 0;
    }

    let tax = 0;
    // Slabs for FY 2025-26 (New Regime)
    // 0 - 4,00,000: 0%
    // 4,00,001 - 8,00,000: 5%
    // 8,00,001 - 12,00,000: 10%
    // 12,00,001 - 16,00,000: 15%
    // 16,00,001 - 20,00,000: 20%
    // 20,00,001 - 24,00,000: 25%
    // Above 24,00,000: 30%

    if (taxableIncome > 2400000) {
      tax += (taxableIncome - 2400000) * 0.30;
      tax += 400000 * 0.25; // 20-24L
      tax += 400000 * 0.20; // 16-20L
      tax += 400000 * 0.15; // 12-16L
      tax += 400000 * 0.10; // 8-12L
      tax += 400000 * 0.05; // 4-8L
    } else if (taxableIncome > 2000000) {
      tax += (taxableIncome - 2000000) * 0.25;
      tax += 400000 * 0.20;
      tax += 400000 * 0.15;
      tax += 400000 * 0.10;
      tax += 400000 * 0.05;
    } else if (taxableIncome > 1600000) {
      tax += (taxableIncome - 1600000) * 0.20;
      tax += 400000 * 0.15;
      tax += 400000 * 0.10;
      tax += 400000 * 0.05;
    } else if (taxableIncome > 1200000) {
      tax += (taxableIncome - 1200000) * 0.15;
      tax += 400000 * 0.10;
      tax += 400000 * 0.05;
    }

    // Add 4% Health and Education Cess
    const totalTax = tax * 1.04;
    return totalTax;
  }

  static async processPayroll(companyId: string, month: number, year: number) {
    const existingRun = await prisma.payrollRun.findFirst({
      where: { company_id: companyId, month, year }
    });
    if (existingRun) return existingRun;

    const employees = await prisma.employee.findMany({
      where: { company_id: companyId, employment_status: 'ACTIVE' },
      include: {
        salaries: {
          where: {
            effective_from: { lte: new Date() },
            OR: [{ effective_to: null }, { effective_to: { gte: new Date() } }]
          },
          include: {
            salary_structure: {
              include: {
                components: {
                  include: { salary_component: true },
                  orderBy: { sequence: 'asc' }
                }
              }
            }
          },
          orderBy: { effective_from: 'desc' },
          take: 1
        }
      }
    });

    if (employees.length === 0) {
      throw new Error(`No active employees found for company ID: ${companyId}. Please ensure employees are added and their status is set to ACTIVE.`);
    }

    const results: any[] = [];
    let totalGrossAll = 0;
    let totalDeductionsAll = 0;
    let totalNetAll = 0;
    const employeesMissingSalary: string[] = [];
    const employeesFound = employees.length;

    for (const employee of employees) {
      const salary = employee.salaries[0];
      if (!salary) {
        employeesMissingSalary.push(`${employee.first_name} ${employee.last_name} (${employee.employee_code}) - No effective salary found`);
        continue;
      }
      if (!salary.salary_structure) {
        employeesMissingSalary.push(`${employee.first_name} ${employee.last_name} (${employee.employee_code}) - No salary structure linked`);
        continue;
      }
      if (!salary.salary_structure.components || salary.salary_structure.components.length === 0) {
        employeesMissingSalary.push(`${employee.first_name} ${employee.last_name} (${employee.employee_code}) - Salary structure has no components`);
        continue;
      }

      let grossEarnings = 0;
      let basicAmount = 0;
      const earningsItems: any[] = [];

      // Calculate Earnings First to get Basic
      // We need to find Basic first because other components might depend on it
      const components = salary.salary_structure.components;
      
      // Pass 1: Find Basic
      const basicComp = components.find(c => c.salary_component.code === 'BASIC');
      if (basicComp) {
        if (basicComp.calculation_type === 'FLAT_AMOUNT') {
          basicAmount = Number(basicComp.value);
        } else if (basicComp.calculation_type === 'PERCENTAGE_OF_CTC') {
          basicAmount = (Number(salary.ctc_monthly) * Number(basicComp.value)) / 100;
        }
      }

      // Pass 2: Calculate all earnings
      for (const structComp of components) {
        if (structComp.salary_component.type === 'EARNING') {
          let amount = 0;
          if (structComp.calculation_type === 'FLAT_AMOUNT') {
            amount = Number(structComp.value);
          } else if (structComp.calculation_type === 'PERCENTAGE_OF_CTC') {
            amount = (Number(salary.ctc_monthly) * Number(structComp.value)) / 100;
          } else if (structComp.calculation_type === 'PERCENTAGE_OF_BASIC') {
            amount = (basicAmount * Number(structComp.value)) / 100;
          }

          grossEarnings += amount;
          earningsItems.push({
            componentId: structComp.salary_component.id,
            name: structComp.salary_component.name,
            amount,
          });
        }
      }

      // PF: 12% of basic, capped at 1800
      const pf = Math.min(1800, basicAmount * 0.12);
      
      // ESI: 0.75% of gross, only if gross < 21000
      const esi = grossEarnings < 21000 ? (grossEarnings * 0.0075) : 0;

      // TDS
      const annualGross = grossEarnings * 12;
      const annualTax = await this.calculateTDS(annualGross);
      const monthlyTDS = annualTax / 12;

      const totalDeductions = pf + esi + monthlyTDS;
      const netSalary = grossEarnings - totalDeductions;

      results.push({
        employeeId: employee.id,
        grossEarnings,
        totalDeductions,
        netSalary,
        pf,
        esi,
        tds: monthlyTDS,
        earningsItems
      });

      totalGrossAll += grossEarnings;
      totalDeductionsAll += totalDeductions;
      totalNetAll += netSalary;
    }

    if (results.length === 0) {
      if (employeesMissingSalary.length > 0) {
        throw new Error(`Payroll could not be processed. The following active employees are missing salary structures: ${employeesMissingSalary.join(', ')}`);
      }
      throw new Error('No eligible employees found for payroll processing.');
    }

    const payrollRun = await prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          company_id: companyId,
          month,
          year,
          run_date: new Date(),
          status: 'PROCESSED',
          total_employees: results.length,
          total_gross: new Decimal(totalGrossAll),
          total_deductions: new Decimal(totalDeductionsAll),
          total_net: new Decimal(totalNetAll)
        }
      });

      for (const res of results) {
        await tx.payslip.create({
          data: {
            payroll_run_id: run.id,
            employee_id: res.employeeId,
            month,
            year,
            working_days: 30,
            paid_days: 30,
            lop_days: 0,
            gross_salary: new Decimal(res.grossEarnings),
            total_deductions: new Decimal(res.totalDeductions),
            net_salary: new Decimal(res.netSalary),
            pf_employee: new Decimal(res.pf),
            esi_employee: new Decimal(res.esi),
            tds: new Decimal(res.tds),
            pf_employer: new Decimal(0),
            esi_employer: new Decimal(0),
            professional_tax: new Decimal(0),
            status: 'FINALIZED',
            line_items: {
              create: res.earningsItems.map((e: any) => ({
                salary_component_id: e.componentId,
                component_name: e.name,
                component_type: 'EARNING',
                amount: new Decimal(e.amount)
              }))
            }
          }
        });
      }

      return run;
    });

    // Send emails asynchronously after transaction
    console.log(`Starting background email process for payroll run: ${payrollRun.id}`);
    this.sendPayslipsByEmail(payrollRun.id).catch(err => console.error('Failed to send payslip emails:', err));

    return payrollRun;
  }

  static async sendPayslipsByEmail(runId: string) {
    console.log(`Fetching payslips for run: ${runId}`);
    const payslips = await prisma.payslip.findMany({
      where: { payroll_run_id: runId },
      include: {
        employee: true,
      }
    });

    console.log(`Found ${payslips.length} payslips to process.`);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    for (const payslip of payslips) {
      if (!payslip.employee.work_email) {
        console.warn(`Skipping employee ${payslip.employee.id} - No work email found.`);
        continue;
      }

      console.log(`Processing payslip for ${payslip.employee.work_email}...`);
      try {
        const doc = await this.generatePayslipPDF(runId, payslip.employee_id);
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: any[] = [];
          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', (err) => reject(err));
        });

        const monthName = months[payslip.month - 1];

        await sendEmail(
          payslip.employee.work_email,
          `Your Payslip for ${monthName} ${payslip.year}`,
          `
            <p>Dear ${payslip.employee.first_name} ${payslip.employee.last_name},</p>
            <p>Please find attached your payslip for <b>${monthName} ${payslip.year}</b>.</p>
            <p><b>Net Salary Summary:</b> ₹${Number(payslip.net_salary).toLocaleString()}</p>
            <p>Regards,<br>HR Team</p>
          `,
          [
            {
              filename: `payslip_${monthName}_${payslip.year}.pdf`,
              content: pdfBuffer
            }
          ]
        );
      } catch (err) {
        console.error(`Failed to process/send email for employee ${payslip.employee_id}:`, err);
      }
    }
  }

  static async getPayrollRuns(companyId: string) {
    return prisma.payrollRun.findMany({
      where: { company_id: companyId },
      orderBy: { run_date: 'desc' }
    });
  }

  static async getPayslipsForRun(runId: string) {
    return prisma.payslip.findMany({
      where: { payroll_run_id: runId },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_code: true
          }
        },
        line_items: true
      }
    });
  }

  static async generatePayslipPDF(runId: string, employeeId: string) {
    const payslip = await prisma.payslip.findFirst({
      where: { payroll_run_id: runId, employee_id: employeeId },
      include: {
        employee: true,
        payroll_run: {
          include: { company: true }
        },
        line_items: true
      }
    });

    if (!payslip) throw new Error('Payslip not found');

    const doc = new PDFDocument({ margin: 50 });
    const company = payslip.payroll_run.company;
    const employee = payslip.employee;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Header
    doc.fontSize(20).text(company.name, { align: 'center' });
    doc.fontSize(10).text(company.address || '', { align: 'center' });
    doc.text(`${company.city || ''}, ${company.state || ''} - ${company.pincode || ''}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Payslip for ${months[payslip.month - 1]} ${payslip.year}`, { align: 'center', underline: true });
    doc.moveDown();

    // Employee Details
    doc.fontSize(10);
    const leftCol = 50;
    const rightCol = 300;
    let top = doc.y;

    doc.text(`Employee Name: ${employee.first_name} ${employee.last_name}`, leftCol, top);
    doc.text(`Employee ID: ${employee.employee_code}`, leftCol, top + 15);
    doc.text(`Designation: ${employee.designation_id || 'N/A'}`, leftCol, top + 30);

    doc.text(`Bank Name: ${employee.bank_name || 'N/A'}`, rightCol, top);
    doc.text(`Account No: ${employee.bank_account_number || 'N/A'}`, rightCol, top + 15);
    doc.text(`PAN: ${employee.pan_number || 'N/A'}`, rightCol, top + 30);

    doc.moveDown(4);
    
    // Table Headers
    top = doc.y;
    doc.rect(50, top, 500, 20).fill('#f3f4f6').stroke('#000');
    doc.fillColor('#000').text('EARNINGS', 60, top + 5, { width: 240 });
    doc.text('AMOUNT', 240, top + 5, { width: 50, align: 'right' });
    doc.text('DEDUCTIONS', 310, top + 5, { width: 190 });
    doc.text('AMOUNT', 490, top + 5, { width: 50, align: 'right' });
    
    doc.moveDown();
    top = doc.y + 5;

    // Line Items (Earnings)
    let currentY = top;
    payslip.line_items.forEach((item) => {
      doc.text(item.component_name, 60, currentY);
      doc.text(Number(item.amount).toFixed(2), 240, currentY, { width: 50, align: 'right' });
      currentY += 15;
    });

    // Deductions
    let deductY = top;
    const deductions = [
      { name: 'Provident Fund (PF)', amount: payslip.pf_employee },
      { name: 'ESIC', amount: payslip.esi_employee },
      { name: 'Income Tax (TDS)', amount: payslip.tds }
    ];

    deductions.forEach((d) => {
      doc.text(d.name, 310, deductY);
      doc.text(Number(d.amount).toFixed(2), 490, deductY, { width: 50, align: 'right' });
      deductY += 15;
    });

    const tableBottom = Math.max(currentY, deductY) + 10;
    doc.moveTo(50, top - 5).lineTo(50, tableBottom).stroke();
    doc.moveTo(300, top - 5).lineTo(300, tableBottom).stroke();
    doc.moveTo(550, top - 5).lineTo(550, tableBottom).stroke();
    doc.moveTo(50, tableBottom).lineTo(550, tableBottom).stroke();

    // Totals
    doc.moveDown();
    top = doc.y + 10;
    doc.text(`Gross Earnings: `, 60, top);
    doc.text(`₹${Number(payslip.gross_salary).toFixed(2)}`, 240, top, { width: 50, align: 'right' });
    
    doc.text(`Total Deductions: `, 310, top);
    doc.text(`₹${Number(payslip.total_deductions).toFixed(2)}`, 490, top, { width: 50, align: 'right' });

    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.rect(50, doc.y, 500, 30).fill('#e5e7eb').stroke('#000');
    doc.fillColor('#000').text(`NET SALARY: ₹${Number(payslip.net_salary).toLocaleString()}`, 60, doc.y + 10, { align: 'center' });

    doc.moveDown(4);
    doc.fontSize(10).font('Helvetica-Oblique').text('This is a computer generated document and does not require a signature.', { align: 'center' });

    doc.end();
    return doc;
  }
}
