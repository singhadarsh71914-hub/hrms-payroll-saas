# Payroll Setup & Processing

Our platform automates salary calculations, tax deductions, and compliance reporting.

## 1. Configuring Salary Components
1. Go to **Settings > Salary Components**.
2. **Earnings:** Define standard earnings like Basic Pay (typically 40-50% of CTC) and HRA (House Rent Allowance).
3. **Deductions:** Ensure PF (Provident Fund), PT (Professional Tax), and TDS (Income Tax) are marked as `STATUTORY` so the engine calculates them automatically based on government slabs.

## 2. Assigning Salary Structures
1. Go to **HR Core > Employees** and select an employee.
2. Navigate to the **Salary** tab.
3. Input their annual CTC (Cost to Company).
4. The system will automatically explode this CTC into the components defined in step 1.

## 3. Running the Monthly Payroll
Payroll should typically be run on the last working day of the month.
1. Navigate to **Finance > Payroll**.
2. Click **Run Payroll**.
3. Select the target Month and Year.
4. **Review Phase:** The system will present a draft table. It automatically calculates:
   - Gross Earnings.
   - LOP (Loss of Pay) deductions based on unapproved absences in the Attendance module.
   - Pro-rata deductions for employees who joined mid-month.
5. Click **Finalize**.

## 4. Disbursal & Payslips
Once finalized:
1. Payslips are instantly generated and emailed to all employees as password-protected PDFs.
2. You can download the **Bank Transfer Export (CSV)** to upload directly to your corporate banking portal for bulk NEFT/RTGS transfers.

**Next Step:** Ensure high-security attendance with the [Biometrics Guide](./biometrics-guide.md).
