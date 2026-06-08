import api from './api';

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  run_date: string;
  status: string;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
}

export interface Payslip {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  pf_employee: number;
  esi_employee: number;
  tds: number;
  employee: {
    first_name: string;
    last_name: string;
    employee_code: string;
    department?: {
      name: string;
    };
  };
}

export const payrollService = {
  runPayroll: async (month: number, year: number) => {
    const response = await api.post('/payroll/run', { month, year });
    return response.data;
  },
  getRuns: async () => {
    const response = await api.get('/payroll/runs');
    return response.data;
  },
  getPayslips: async (runId: string) => {
    const response = await api.get(`/payroll/runs/${runId}/payslips`);
    return response.data;
  },
  downloadPayslip: async (runId: string, employeeId: string) => {
    return api.get(`/payroll/${runId}/payslip/${employeeId}`, {
      responseType: 'blob',
    });
  },
};
