import 'dotenv/config';
import prisma from './src/lib/prisma';

async function runAudit() {
  const companies = await prisma.company.count();
  const employees = await prisma.employee.count();
  const departments = await prisma.department.count();
  const attendance = await prisma.attendance.count();
  const payrollRuns = await prisma.payrollRun.count();
  const salaryComponents = await prisma.salaryComponent.count();
  const salaryStructures = await prisma.salaryStructure.count();
  
  const allEmployees = await prisma.employee.findMany({ select: { id: true, company_id: true } });
  
  const tenantCompany = await prisma.company.findFirst();
  const tenantCompanyId = tenantCompany ? tenantCompany.id : 'none';
  
  const notInTenant = allEmployees.filter(e => e.company_id !== tenantCompanyId);
  
  console.log(JSON.stringify({
    companies,
    employees,
    departments,
    attendance,
    payrollRuns,
    salaryComponents,
    salaryStructures,
    tenantCompanyId,
    notInTenantCount: notInTenant.length
  }, null, 2));
}

runAudit()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // hack to prevent hang since pg pool might not close automatically without pgpool.end() if using driver adapter
    process.exit(0);
  });
