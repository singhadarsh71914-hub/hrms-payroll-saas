import prisma from '../lib/prisma.ts';
import PDFDocument from 'pdfkit';
import AdmZip from 'adm-zip';

export class TaxService {
  static getFinancialYearDates(fyStartYear: number) {
    return {
      startDate: new Date(fyStartYear, 3, 1), // April 1st
      endDate: new Date(fyStartYear + 1, 2, 31) // March 31st
    };
  }

  static async calculateTaxSummary(employeeId: string, fyStartYear: number) {
    const payslips = await prisma.payslip.findMany({
      where: {
        employee_id: employeeId,
        status: 'FINALIZED',
        OR: [
          { year: fyStartYear, month: { gte: 4 } },
          { year: fyStartYear + 1, month: { lte: 3 } }
        ]
      }
    });

    let totalGross = 0;
    let totalTdsDeducted = 0;
    const quarters = [0, 0, 0, 0];

    payslips.forEach(p => {
      totalGross += Number(p.gross_salary);
      totalTdsDeducted += Number(p.tds);

      if (p.year === fyStartYear) {
        if (p.month >= 4 && p.month <= 6) quarters[0] += Number(p.tds);
        else if (p.month >= 7 && p.month <= 9) quarters[1] += Number(p.tds);
        else if (p.month >= 10 && p.month <= 12) quarters[2] += Number(p.tds);
      } else if (p.year === fyStartYear + 1 && p.month >= 1 && p.month <= 3) {
        quarters[3] += Number(p.tds);
      }
    });

    // New Regime Tax Computation 2026
    const standardDeduction = 75000;
    const taxableIncome = Math.max(0, totalGross - standardDeduction);

    let tax = 0;
    if (taxableIncome > 1200000) {
      if (taxableIncome > 2400000) {
        tax += (taxableIncome - 2400000) * 0.30;
        tax += 400000 * 0.25;
        tax += 400000 * 0.20;
        tax += 400000 * 0.15;
        tax += 400000 * 0.10;
        tax += 400000 * 0.05;
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
    }

    const cess = tax * 0.04;
    const totalTaxLiability = tax + cess;
    const balanceTax = totalTaxLiability - totalTdsDeducted;

    return {
      totalGross,
      totalTdsDeducted,
      quarters,
      taxableIncome,
      baseTax: tax,
      cess,
      totalTaxLiability,
      balanceTax,
      standardDeduction,
      payslips
    };
  }

  static async generateForm16(employeeId: string, fyStartYear: number): Promise<PDFKit.PDFDocument> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true }
    });

    if (!employee) throw new Error('Employee not found');

    const summary = await this.calculateTaxSummary(employeeId, fyStartYear);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // --- PART A ---
    doc.fontSize(16).font('Helvetica-Bold').text('FORM NO. 16', { align: 'center' });
    doc.fontSize(10).text('[See rule 31(1)(a)]', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text('PART A', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source on salary', { align: 'center' });
    doc.moveDown();

    let top = doc.y;
    doc.rect(40, top, 515, 120).stroke();
    
    // Employer Info
    doc.font('Helvetica-Bold').text('Name and address of the Employer', 45, top + 5);
    doc.font('Helvetica').text(employee.company.name, 45, top + 20);
    doc.text(employee.company.address || 'N/A', 45, top + 35);
    doc.text(`PAN: ${employee.company.pan || 'N/A'}`, 45, top + 50);
    doc.text(`TAN: ${employee.company.tan || 'N/A'}`, 45, top + 65);

    // Employee Info
    doc.moveTo(297, top).lineTo(297, top + 120).stroke();
    doc.font('Helvetica-Bold').text('Name and designation of the Employee', 305, top + 5);
    doc.font('Helvetica').text(`${employee.first_name} ${employee.last_name}`, 305, top + 20);
    doc.text(`Designation: ${employee.designation_id || 'Employee'}`, 305, top + 35);
    doc.text(`PAN: ${employee.pan_number || 'NOT PROVIDED'}`, 305, top + 50);

    // Assessment Year
    doc.moveTo(40, top + 85).lineTo(555, top + 85).stroke();
    doc.font('Helvetica-Bold').text('Assessment Year', 45, top + 90);
    doc.font('Helvetica').text(`${fyStartYear + 1}-${(fyStartYear + 2).toString().slice(2)}`, 45, top + 105);
    doc.moveTo(297, top + 85).lineTo(297, top + 120).stroke();
    doc.font('Helvetica-Bold').text('Period', 305, top + 90);
    doc.font('Helvetica').text(`From: 01-Apr-${fyStartYear}  To: 31-Mar-${fyStartYear + 1}`, 305, top + 105);

    doc.moveDown(2);

    // TDS Summary Table
    doc.font('Helvetica-Bold').text('Summary of amount paid/credited and tax deducted at source thereon in respect of the employee', { align: 'center' });
    doc.moveDown(0.5);

    top = doc.y;
    doc.rect(40, top, 515, 120).stroke();
    doc.moveTo(40, top + 20).lineTo(555, top + 20).stroke();
    
    doc.text('Quarter', 45, top + 5, { width: 100 });
    doc.text('Receipt Numbers', 145, top + 5, { width: 100 });
    doc.text('Amount Paid (Rs.)', 250, top + 5, { width: 150 });
    doc.text('Tax Deducted (Rs.)', 400, top + 5, { width: 150 });

    const quartersArr = [
      { name: 'Q1 (Apr-Jun)', receipt: 'PRN/Q1', amount: summary.totalGross * 0.25, tds: summary.quarters[0] },
      { name: 'Q2 (Jul-Sep)', receipt: 'PRN/Q2', amount: summary.totalGross * 0.25, tds: summary.quarters[1] },
      { name: 'Q3 (Oct-Dec)', receipt: 'PRN/Q3', amount: summary.totalGross * 0.25, tds: summary.quarters[2] },
      { name: 'Q4 (Jan-Mar)', receipt: 'PRN/Q4', amount: summary.totalGross * 0.25, tds: summary.quarters[3] }
    ];

    doc.font('Helvetica');
    quartersArr.forEach((q, idx) => {
      const y = top + 25 + (idx * 20);
      doc.text(q.name, 45, y, { width: 100 });
      doc.text(q.receipt, 145, y, { width: 100 });
      doc.text(q.amount.toFixed(2), 250, y, { width: 150 });
      doc.text(q.tds.toFixed(2), 400, y, { width: 150 });
    });

    doc.moveTo(40, top + 100).lineTo(555, top + 100).stroke();
    doc.font('Helvetica-Bold');
    doc.text('Total', 45, top + 105, { width: 100 });
    doc.text(summary.totalGross.toFixed(2), 250, top + 105, { width: 150 });
    doc.text(summary.totalTdsDeducted.toFixed(2), 400, top + 105, { width: 150 });

    doc.addPage();

    // --- PART B ---
    doc.fontSize(14).font('Helvetica-Bold').text('PART B (Annexure)', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Details of Salary paid and any other income and tax deducted', { align: 'center' });
    doc.moveDown(2);

    const drawLine = (text: string, amount: string, yPos: number, isBold: boolean = false) => {
      if (isBold) doc.font('Helvetica-Bold');
      else doc.font('Helvetica');
      doc.text(text, 45, yPos, { width: 400 });
      doc.text(amount, 450, yPos, { width: 100, align: 'right' });
    };

    top = doc.y;
    drawLine('1. Gross Salary', summary.totalGross.toFixed(2), top, true);
    drawLine('(a) Salary as per provisions contained in section 17(1)', summary.totalGross.toFixed(2), top + 20);
    drawLine('(b) Value of perquisites u/s 17(2)', '0.00', top + 40);
    drawLine('(c) Profits in lieu of salary u/s 17(3)', '0.00', top + 60);
    
    drawLine('2. Less: Allowances to the extent exempt u/s 10', '0.00', top + 90, true);
    drawLine('   (Not applicable under New Tax Regime)', '', top + 110);
    
    drawLine('3. Balance (1 - 2)', summary.totalGross.toFixed(2), top + 140, true);
    
    drawLine('4. Deductions under Section 16', summary.standardDeduction.toFixed(2), top + 170, true);
    drawLine('(a) Standard deduction u/s 16(ia)', summary.standardDeduction.toFixed(2), top + 190);
    
    drawLine('5. Income chargeable under the head "Salaries" (3 - 4)', summary.taxableIncome.toFixed(2), top + 220, true);

    drawLine('6. Deductions under Chapter VI-A', '0.00', top + 250, true);
    drawLine('   (Not applicable under New Tax Regime)', '', top + 270);
    
    drawLine('7. Total Taxable Income (5 - 6)', summary.taxableIncome.toFixed(2), top + 300, true);
    
    drawLine('8. Tax on Total Income', summary.baseTax.toFixed(2), top + 330, true);
    drawLine('9. Rebate under section 87A', summary.totalTaxLiability === 0 ? summary.baseTax.toFixed(2) : '0.00', top + 350);
    drawLine('10. Surcharge', '0.00', top + 370);
    drawLine('11. Health and Education Cess @ 4%', summary.cess.toFixed(2), top + 390);
    
    drawLine('12. Tax Payable (8 - 9 + 10 + 11)', summary.totalTaxLiability.toFixed(2), top + 420, true);
    drawLine('13. Less: Relief under section 89', '0.00', top + 440);
    
    drawLine('14. Net Tax Payable', summary.totalTaxLiability.toFixed(2), top + 470, true);
    drawLine('15. Total Tax Deducted at Source (TDS)', summary.totalTdsDeducted.toFixed(2), top + 490, true);

    const balanceText = summary.balanceTax > 0 ? 'Tax Payable' : 'Refundable';
    drawLine(`16. Balance ${balanceText}`, Math.abs(summary.balanceTax).toFixed(2), top + 520, true);

    doc.moveDown(4);
    doc.font('Helvetica-Bold').text('Verification', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').text(
      `I, _______________________________, working in the capacity of _______________________________ do hereby certify that the information given above is true, complete and correct and is based on the books of account, documents, TDS statements, and other available records.`,
      { align: 'justify' }
    );
    doc.moveDown(3);
    doc.text('Place: __________________', 45, doc.y);
    doc.text('(Signature of person responsible for deduction of tax)', 300, doc.y - 10);
    doc.text('Date: __________________', 45, doc.y + 20);
    doc.text(`Full Name: __________________________`, 300, doc.y + 10);

    doc.end();
    return doc;
  }

  static async generateBulkForm16(companyId: string, fyStartYear: number): Promise<Buffer> {
    const employees = await prisma.employee.findMany({
      where: { company_id: companyId }
    });

    const zip = new AdmZip();

    for (const emp of employees) {
      try {
        const doc = await this.generateForm16(emp.id, fyStartYear);
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: any[] = [];
          doc.on('data', chunk => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);
        });

        const fileName = `Form16_${fyStartYear}-${fyStartYear+1}_${emp.first_name}_${emp.last_name}_${emp.employee_code}.pdf`;
        zip.addFile(fileName, pdfBuffer);
      } catch (err) {
        console.error(`Failed to generate Form 16 for ${emp.id}`, err);
      }
    }

    return zip.toBuffer();
  }

  static async getCompanyTaxSummary(companyId: string, fyStartYear: number) {
    const employees = await prisma.employee.findMany({
      where: { company_id: companyId },
      include: {
        payslips: {
          where: {
            status: 'FINALIZED',
            OR: [
              { year: fyStartYear, month: { gte: 4 } },
              { year: fyStartYear + 1, month: { lte: 3 } }
            ]
          }
        }
      }
    });

    const summary = [];
    for (const emp of employees) {
      if (emp.payslips.length === 0) continue;

      const taxDetails = await this.calculateTaxSummary(emp.id, fyStartYear);
      summary.push({
        employeeId: emp.id,
        firstName: emp.first_name,
        lastName: emp.last_name,
        employeeCode: emp.employee_code,
        pan: emp.pan_number || 'N/A',
        totalGross: taxDetails.totalGross,
        totalTds: taxDetails.totalTdsDeducted,
        taxLiability: taxDetails.totalTaxLiability,
        balanceTax: taxDetails.balanceTax
      });
    }

    return summary;
  }
}
