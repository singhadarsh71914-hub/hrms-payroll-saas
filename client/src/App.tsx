import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import SetPassword from './pages/SetPassword';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
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
import './styles/global.css';

const Home = () => {
  const { user } = useAuth();
  return user?.role === 'EMPLOYEE' ? <EmployeeDashboard /> : <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/set-password" element={<SetPassword />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout><Home /></Layout>} />
                
                {/* Admin/HR Routes */}
                <Route path="/employees" element={<Layout><EmployeeList /></Layout>} />
                <Route path="/employees/add" element={<Layout><EmployeeForm /></Layout>} />
                <Route path="/employees/edit/:id" element={<Layout><EmployeeForm /></Layout>} />
                <Route path="/attendance" element={<Layout><Attendance /></Layout>} />
                <Route path="/payroll" element={<Layout><Payroll /></Layout>} />
                <Route path="/loans" element={<Layout><LoanManagement /></Layout>} />
                <Route path="/tax" element={<Layout><TaxManagement /></Layout>} />
                <Route path="/leave" element={<Layout><Leave /></Layout>} />
                <Route path="/holidays" element={<Layout><Holidays /></Layout>} />
                <Route path="/performance" element={<Layout><Performance /></Layout>} />
                <Route path="/reimbursements" element={<Layout><Reimbursements /></Layout>} />
                <Route path="/documents" element={<Layout><Documents /></Layout>} />
                <Route path="/announcements" element={<Layout><Announcements /></Layout>} />

                {/* Employee Routes */}
                <Route path="/my-leaves" element={<Layout><EmployeeLeaves /></Layout>} />
                <Route path="/my-payslips" element={<Layout><EmployeePayslips /></Layout>} />
                <Route path="/my-loans" element={<Layout><MyLoans /></Layout>} />
                <Route path="/my-tax" element={<Layout><MyTax /></Layout>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
