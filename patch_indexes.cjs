const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

function addIndex(modelName, fields) {
  const regex = new RegExp(`model ${modelName} \\{[^}]*\\}`, 'g');
  schema = schema.replace(regex, (match) => {
    let newMatch = match;
    for (const field of fields) {
      const idxStr = `@@index([${field}])`;
      if (!newMatch.includes(idxStr)) {
        newMatch = newMatch.replace(/\n\}/, `\n  ${idxStr}\n}`);
      }
    }
    return newMatch;
  });
}

addIndex('Department', ['company_id']);
addIndex('Designation', ['company_id']);
addIndex('Employee', ['company_id', 'department_id', 'reporting_manager_id']);
addIndex('Loan', ['employee_id']);
addIndex('LoanRepayment', ['loan_id', 'payroll_run_id']);
addIndex('EmployeeDocument', ['employee_id', 'company_id']);
addIndex('SalaryComponent', ['company_id']);
addIndex('SalaryStructure', ['company_id']);
addIndex('SalaryStructureComponent', ['salary_structure_id']);
addIndex('EmployeeSalary', ['employee_id', 'salary_structure_id']);
addIndex('PayrollRun', ['company_id']);
addIndex('Payslip', ['payroll_run_id', 'employee_id']);
addIndex('PayslipLineItem', ['payslip_id']);
addIndex('Attendance', ['employee_id']);
addIndex('LeaveRequest', ['employee_id']);
addIndex('LeaveBalance', ['employee_id']);
addIndex('User', ['company_id']);
addIndex('Holiday', ['company_id']);
addIndex('Announcement', ['company_id']);
addIndex('Reimbursement', ['employee_id']);
addIndex('RefreshToken', ['user_id']);
addIndex('Notification', ['company_id', 'user_id']);
addIndex('EmployeeBonus', ['employee_id', 'company_id']);
addIndex('StateComplianceRule', ['company_id']);
addIndex('BonusRule', ['company_id']);
addIndex('TaxSlab', ['regime']);
addIndex('PayrollAdjustment', ['original_run_id']);
addIndex('PayrollReversal', ['original_run_id']);
addIndex('PayrollJob', ['company_id']);
addIndex('PayrollBatch', ['payroll_job_id']);
addIndex('PayrollExecutionToken', ['company_id']);
addIndex('ReportSchedule', ['report_type']);
addIndex('ScheduledReport', ['company_id']);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Added indexes to Prisma schema.');
