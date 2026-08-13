import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { NotificationProvider } from './context/NotificationContext';
import './styles/global.css';

// Lazy load all pages for bundle route splitting
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const SetPassword = React.lazy(() => import('./pages/SetPassword'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const EmployeeDashboard = React.lazy(() => import('./pages/EmployeeDashboard'));
const EmployeeList = React.lazy(() => import('./pages/EmployeeList'));
const EmployeeForm = React.lazy(() => import('./pages/EmployeeForm'));
const EmployeeDetails = React.lazy(() => import('./pages/EmployeeDetails'));
const Payroll = React.lazy(() => import('./pages/Payroll'));
const Leave = React.lazy(() => import('./pages/Leave'));
const EmployeeLeaves = React.lazy(() => import('./pages/EmployeeLeaves'));
const EmployeePayslips = React.lazy(() => import('./pages/EmployeePayslips'));
const LoanManagement = React.lazy(() => import('./pages/LoanManagement'));
const MyLoans = React.lazy(() => import('./pages/MyLoans'));
const TaxManagement = React.lazy(() => import('./pages/TaxManagement'));
const MyTax = React.lazy(() => import('./pages/MyTax'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Holidays = React.lazy(() => import('./pages/Holidays'));
const Performance = React.lazy(() => import('./pages/Performance'));
const Reimbursements = React.lazy(() => import('./pages/Reimbursements'));
const Documents = React.lazy(() => import('./pages/Documents'));
const Announcements = React.lazy(() => import('./pages/Announcements'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const WorkforceIntelligence = React.lazy(() => import('./pages/analytics/WorkforceIntelligence'));
const AttendanceIntelligence = React.lazy(() => import('./pages/AttendanceIntelligence'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));
const StatutoryConfig = React.lazy(() => import('./pages/admin/StatutoryConfig'));
const CompanySettings = React.lazy(() => import('./pages/CompanySettings'));
const SalaryComponents = React.lazy(() => import('./pages/SalaryComponents'));
const SalaryStructures = React.lazy(() => import('./pages/SalaryStructures'));

const Home = () => {
  const { user } = useAuth();
  return user?.role === 'EMPLOYEE' ? <EmployeeDashboard /> : <Dashboard />;
};

const LoadingFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'var(--bg)' }}>
    <div className="spinner"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <ConnectivityBanner />
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
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
              </Suspense>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
