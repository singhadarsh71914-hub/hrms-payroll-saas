# Employee Import

The platform supports adding employees one by one, or via bulk CSV upload.

## 1. Single Employee Addition
1. Go to **HR Core > Employees**.
2. Click **+ Add Employee**.
3. Fill in the Personal Details (Name, Work Email, Phone).
4. Assign the **Employee Code** (e.g., EMP-001). This must be unique across your organization.
5. Select the Department, Designation, and Reporting Manager.
6. Click **Save**. The employee will receive an automated welcome email with a secure link to set their password.

## 2. Bulk CSV Import (Recommended for 10+ employees)
1. Go to **HR Core > Employees**.
2. Click the **Import CSV** button.
3. Download the `Sample_Template.csv` from the modal.
4. Fill out the CSV. **Required columns:** 
   - `first_name`
   - `last_name`
   - `work_email`
   - `employee_code`
   - `date_of_joining` (Format: YYYY-MM-DD)
5. Upload the completed CSV. The system will perform validation.
6. If any row fails validation (e.g., duplicate email), the system will highlight the error. Fix the CSV and re-upload.
7. Click **Confirm Import**.

## 3. Reporting Lines (Org Chart)
The org chart is automatically generated based on the `Reporting Manager` field assigned to each employee. Ensure top-level executives have no reporting manager (leave blank) to act as the root of the tree.

**Next Step:** Configure tracking in [Attendance Configuration](./attendance-configuration.md).
