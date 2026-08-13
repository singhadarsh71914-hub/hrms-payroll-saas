const fs = require('fs');

// Patch leave.ts
let leaveCode = fs.readFileSync('src/routes/leave.ts', 'utf8');
if (!leaveCode.includes("const reqData = await prisma.leaveRequest.findUnique")) {
  leaveCode = leaveCode.replace(
    "const result = await LeaveService.updateLeaveStatus(id as string, status, approvedBy);",
    `
      const reqData = await import('../lib/prisma.ts').then(m => m.default.leaveRequest.findUnique({ where: { id: id as string }, include: { employee: true } }));
      if (!reqData || reqData.employee.company_id !== req.user?.company_id) return next(new AppError('Unauthorized', 403));
      const result = await LeaveService.updateLeaveStatus(id as string, status, approvedBy);
    `
  );
  fs.writeFileSync('src/routes/leave.ts', leaveCode);
}

// Patch loans.ts
let loansCode = fs.readFileSync('src/routes/loans.ts', 'utf8');

// Patch GET /:id
if (!loansCode.includes("loan.employee.company_id !== req.user?.company_id")) {
  loansCode = loansCode.replace(
    "if (req.user?.role === 'EMPLOYEE' && loan.employee_id !== req.user.employee_id) {",
    `
    // @ts-ignore
    if (loan.employee.company_id !== req.user?.company_id) return next(new AppError('Unauthorized access', 403));
    if (req.user?.role === 'EMPLOYEE' && loan.employee_id !== req.user.employee_id) {
    `
  );
}

// Patch PUT /:id/approve
if (!loansCode.includes("const loanDataApprove")) {
  loansCode = loansCode.replace(
    "// @ts-ignore\n    const loan = await LoanService.approveLoan(req.params.id, req.user!.id);",
    `
    const loanDataApprove = await import('../lib/prisma.ts').then(m => m.default.loan.findUnique({ where: { id: req.params.id as string }, include: { employee: true } }));
    if (!loanDataApprove || loanDataApprove.employee.company_id !== req.user?.company_id) return next(new AppError('Unauthorized', 403));
    const loan = await LoanService.approveLoan(req.params.id as string, req.user!.id);
    `
  );
}

// Patch PUT /:id/reject
if (!loansCode.includes("const loanDataReject")) {
  loansCode = loansCode.replace(
    "// @ts-ignore\n    const loan = await LoanService.rejectLoan(req.params.id, req.user!.id, req.body.remarks);",
    `
    const loanDataReject = await import('../lib/prisma.ts').then(m => m.default.loan.findUnique({ where: { id: req.params.id as string }, include: { employee: true } }));
    if (!loanDataReject || loanDataReject.employee.company_id !== req.user?.company_id) return next(new AppError('Unauthorized', 403));
    const loan = await LoanService.rejectLoan(req.params.id as string, req.user!.id, req.body.remarks);
    `
  );
}

fs.writeFileSync('src/routes/loans.ts', loansCode);
console.log('Patched cross-tenant vulnerabilities in leave and loans.');
