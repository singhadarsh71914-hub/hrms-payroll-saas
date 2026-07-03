# Biometrics & Facial Recognition Guide

To ensure attendance integrity, our platform utilizes browser-based facial recognition to verify identity during Check-In and Check-Out.

## 1. Initial Enrollment
When an employee attempts to check in for the first time on a new device, the system will prompt them for Enrollment.
1. The browser will request Camera permissions. Ensure the employee clicks **Allow**.
2. The employee must position their face inside the guide oval on the screen.
3. The system captures a high-resolution frame, converts it into a mathematical embedding, and stores it securely. **We do not store the raw photo.**

## 2. Daily Check-In
1. Navigate to the **Dashboard** or **Attendance** screen.
2. Click **Check In**.
3. The camera will activate. The AI will compare the live face against the enrolled embedding.
4. If a match is found (Confidence > 60%), the check-in is successful.

## 3. Best Practices & Troubleshooting
- **Lighting:** Ensure the employee is facing a light source. Backlighting (a window behind the employee) will cast the face in shadow and cause verification failures.
- **Angles:** The employee should look directly at the camera, not down at the keyboard.
- **Spoofing:** The system includes liveness detection. Attempting to hold up a photograph or a phone screen will result in a failed verification and flag the attempt in the `Attendance Intelligence` dashboard for HR review.

If an employee's appearance changes drastically (e.g., shaving a heavy beard), an HR Admin can reset their biometric profile by navigating to their profile and clicking **Reset Biometrics**, forcing a re-enrollment on their next check-in.
