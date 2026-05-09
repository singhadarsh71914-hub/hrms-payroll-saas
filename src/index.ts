import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.ts';
import employeeRoutes from './routes/employees.ts';
import orgRoutes from './routes/org.ts';
import { errorHandler } from './middleware/error.ts';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/org', orgRoutes);

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
