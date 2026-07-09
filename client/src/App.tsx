import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import SetPassword from './pages/SetPassword';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import EmployeeDetails from './pages/EmployeeDetails';
import Payroll from './pages/Payroll';
import Leave from './pages/Leave';
import EmployeeLeaves from './pages/EmployeeLeaves';
import EmployeePayslips from './pages/EmployeePayslips';
import LoanManagement from './pages/LoanManagement';
import MyLoans from './pages/MyLoans';
import TaxManagement from './pages/TaxManagement';
import MyTax from './pages/MyTax';
import Attendance from './pages/Attendance';
import Holidays from './pages/Holidays';
import Performance from './pages/Performance';
import Reimbursements from './pages/Reimbursements';
import Documents from './pages/Documents';
import Announcements from './pages/Announcements';
import Analytics from './pages/Analytics';
import WorkforceIntelligence from './pages/analytics/WorkforceIntelligence';
import AttendanceIntelligence from './pages/AttendanceIntelligence';
import AuditLogs from './pages/AuditLogs';
import StatutoryConfig from './pages/admin/StatutoryConfig';
import CompanySettings from './pages/CompanySettings';
import SalaryComponents from './pages/SalaryComponents';
import SalaryStructures from './pages/SalaryStructures';
import './styles/global.css';

import { ConnectivityBanner } from './components/ConnectivityBanner';
import { NotificationProvider } from './context/NotificationContext';

const Home = () => {
  const { user } = useAuth();
  return user?.role === 'EMPLOYEE' ? <EmployeeDashboard /> : <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <ConnectivityBanner />
            <BrowserRouter>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/statutory-config" element={<Layout><StatutoryConfig /></Layout>} />
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                
                {/* Admin/HR Routes */}
                <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
                <Route path="/workforce-intelligence" element={<Layout><WorkforceIntelligence /></Layout>} />
                <Route path="/employees" element={<Layout><EmployeeList /></Layout>} />
                <Route path="/employees/add" element={<Layout><EmployeeForm /></Layout>} />
                <Route path="/employees/edit/:id" element={<Layout><EmployeeForm /></Layout>} />
                <Route path="/employees/:id" element={<Layout><EmployeeDetails /></Layout>} />
                <Route path="/attendance" element={<Layout><Attendance /></Layout>} />
                <Route path="/attendance/intelligence" element={<Layout><AttendanceIntelligence /></Layout>} />
                <Route path="/payroll" element={<Layout><Payroll /></Layout>} />
                <Route path="/salary-components" element={<Layout><SalaryComponents /></Layout>} />
                <Route path="/salary-structures" element={<Layout><SalaryStructures /></Layout>} />
                <Route path="/loans" element={<Layout><LoanManagement /></Layout>} />
                <Route path="/tax" element={<Layout><TaxManagement /></Layout>} />
                <Route path="/leave" element={<Layout><Leave /></Layout>} />
                <Route path="/holidays" element={<Layout><Holidays /></Layout>} />
                <Route path="/performance" element={<Layout><Performance /></Layout>} />
                <Route path="/reimbursements" element={<Layout><Reimbursements /></Layout>} />
                <Route path="/documents" element={<Layout><Documents /></Layout>} />
                <Route path="/announcements" element={<Layout><Announcements /></Layout>} />
                <Route path="/audit-logs" element={<Layout><AuditLogs /></Layout>} />
                <Route path="/company-settings" element={<Layout><CompanySettings /></Layout>} />

                {/* Employee Routes */}
                <Route path="/my-leaves" element={<Layout><EmployeeLeaves /></Layout>} />
                <Route path="/my-payslips" element={<Layout><EmployeePayslips /></Layout>} />
                <Route path="/my-loans" element={<Layout><MyLoans /></Layout>} />
                <Route path="/my-tax" element={<Layout><MyTax /></Layout>} />
              </Route>
            </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
