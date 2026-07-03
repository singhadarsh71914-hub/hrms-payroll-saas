import prisma from './src/lib/prisma.ts';

async function check() {
  const payslips = await prisma.payslip.findMany({ include: { employee: true } });
  console.log("Payslips found: ", payslips.length);
  if (payslips.length > 0) {
    console.log("Employee ID with payslip:", payslips[0].employee_id);
    console.log("Run ID:", payslips[0].payroll_run_id);
  }
}
check();
