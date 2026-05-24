import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.ts';
import employeeRoutes from './routes/employees.ts';
import orgRoutes from './routes/org.ts';
import payrollRoutes from './routes/payroll.ts';
import leaveRoutes from './routes/leave.ts';
import attendanceRoutes from './routes/attendance.ts';
import holidayRoutes from './routes/holidays.ts';
import salaryRoutes from './routes/salary.ts';
import dashboardRoutes from './routes/dashboard.ts';
import { errorHandler } from './middleware/error.ts';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to HRMS & Payroll API' });
});

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
