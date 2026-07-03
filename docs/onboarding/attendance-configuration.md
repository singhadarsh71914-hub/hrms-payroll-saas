# Attendance & Geofencing Configuration

Our platform supports strict location-based check-ins to prevent time theft.

## 1. Setting Up Shift Timings
By default, the platform expects a standard 9-to-5 workflow.
1. Navigate to **Settings > Attendance Policies**.
2. Set the standard `Check-In Time` (e.g., 09:00 AM).
3. Set the `Grace Period` (e.g., 15 minutes). If an employee checks in at 09:16 AM, they will be automatically marked as **LATE**.
4. Set the `Half-Day Threshold`. If an employee works less than this duration (e.g., 4 hours), they are marked for a half-day.

## 2. Configuring GPS Geofences
If your employees work at physical office locations, you can restrict check-ins to a physical radius.
1. Go to **Settings > Locations**.
2. Click **Add Office Location**.
3. Use the interactive map to drop a pin on your office building.
4. Set the allowed radius (e.g., 50 meters).
5. Toggle **Enforce Geofencing** to ON.

**Note on Remote Work:** If an employee has the `Work From Home` flag enabled on their profile, geofencing is bypassed, but their GPS coordinates are still logged for auditing purposes.

**Next Step:** Define time-off rules in [Leave Management](./leave-management.md).
