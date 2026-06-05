import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.ts';
import employeeRoutes from './routes/employees.ts';
import selfServiceRoutes from './routes/self-service.ts';
import loanRoutes from './routes/loans.ts';
import orgRoutes from './routes/org.ts';
import payrollRoutes from './routes/payroll.ts';
import leaveRoutes from './routes/leave.ts';
import attendanceRoutes from './routes/attendance.ts';
import holidayRoutes from './routes/holidays.ts';
import salaryRoutes from './routes/salary.ts';
import dashboardRoutes from './routes/dashboard.ts';
import analyticsRoutes from './routes/analytics.ts';
import taxRoutes from './routes/tax.ts';
import announcementRoutes from './routes/announcement.ts';
import performanceRoutes from './routes/performance.ts';
import reimbursementRoutes from './routes/reimbursement.ts';
import documentRoutes from './routes/document.ts';
import { errorHandler } from './middleware/error.ts';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/self-service', selfServiceRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/documents', documentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to HRMS & Payroll API' });
});

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
