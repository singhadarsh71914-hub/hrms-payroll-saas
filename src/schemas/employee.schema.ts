import { z } from 'zod';

const employeeBaseSchema = {
  employee_code: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  display_name: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  date_of_birth: z.string().optional(),
  date_of_joining: z.string().min(1),
  date_of_leaving: z.string().optional(),
  employment_status: z.string().optional(),
  employment_type: z.string().optional(),
  department_id: z.string().optional().nullable(),
  designation_id: z.string().optional().nullable(),
  reporting_manager_id: z.string().optional().nullable(),
  work_location: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  work_email: z.string().email(),
  personal_email: z.union([z.string().email(), z.literal(''), z.null()]).optional().transform(v => v === '' ? null : v),
  phone: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  pan_number: z.string().optional(),
  aadhaar_number: z.string().optional(),
  uan_number: z.string().optional(),
  esic_ip_number: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().optional(),
  probation_end_date: z.string().optional(),
  notice_period_days: z.union([z.number(), z.string().regex(/^\d+$/)]).optional(),
  avatar_url: z.string().optional(),
};

export const createEmployeeSchema = z.object({
  body: z.object(employeeBaseSchema)
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object(employeeBaseSchema).partial()
});
