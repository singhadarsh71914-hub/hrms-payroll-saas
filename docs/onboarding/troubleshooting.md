# Troubleshooting & Support

If you encounter issues while setting up or operating the platform, reference this guide before contacting support.

## Common Issues

### 1. Employees cannot Check-In
**Symptom:** The camera fails to load, or the employee gets a "Location Error".
**Solution:**
- Ensure the browser has Camera and Location permissions enabled.
- If using Geofencing, verify the employee is physically within the radius set in [Attendance Configuration](./attendance-configuration.md).
- If on a corporate Wi-Fi network, ensure WebSockets (WSS) and WebRTC traffic are not blocked by the firewall.

### 2. Payroll LOP Deductions seem incorrect
**Symptom:** An employee has a Loss of Pay deduction that shouldn't exist.
**Solution:**
- Go to the employee's **Attendance** logs for the month.
- Look for days marked `ABSENT`.
- If the employee was actually present or on approved leave, HR must manually override the attendance record for that specific date to `PRESENT` or ensure the Leave Request is moved to `APPROVED` status.
- Once corrected, re-run the draft payroll.

### 3. CSV Import Fails
**Symptom:** Uploading the bulk employee template throws a red error banner.
**Solution:**
- Ensure you are uploading a `.csv` file, not an `.xlsx` (Excel) file.
- Verify that all `work_email` values are unique.
- Verify that `date_of_joining` follows the exact `YYYY-MM-DD` format (e.g., 2024-01-15).

### 4. Emails are not being received
**Symptom:** Welcome emails or Payslip emails are not arriving in inboxes.
**Solution:**
- Check the SPAM or Junk folder.
- Have your IT department whitelist our sending domain `@hrms-platform.com` to prevent corporate spam filters from blocking automated alerts.

## Contacting Support
If the issue persists, Administrators can raise a support ticket directly from the **Help & Support** tab in the sidebar. Please include:
- A screenshot of the error.
- The specific Employee ID (if applicable).
- Steps to reproduce the problem.
