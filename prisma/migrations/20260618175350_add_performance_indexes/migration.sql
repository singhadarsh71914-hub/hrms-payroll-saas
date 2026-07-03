-- CreateIndex
CREATE INDEX "Attendance_employee_id_date_idx" ON "Attendance"("employee_id", "date");

-- CreateIndex
CREATE INDEX "Employee_company_id_is_active_idx" ON "Employee"("company_id", "is_active");

-- CreateIndex
CREATE INDEX "LeaveRequest_employee_id_status_idx" ON "LeaveRequest"("employee_id", "status");

-- CreateIndex
CREATE INDEX "Loan_employee_id_status_idx" ON "Loan"("employee_id", "status");

-- CreateIndex
CREATE INDEX "PayrollRun_company_id_month_year_idx" ON "PayrollRun"("company_id", "month", "year");

-- CreateIndex
CREATE INDEX "Payslip_payroll_run_id_idx" ON "Payslip"("payroll_run_id");
