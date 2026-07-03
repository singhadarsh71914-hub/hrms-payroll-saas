import 'dotenv/config';
import axios from 'axios';

const BASE = 'http://localhost:3000/api';

async function testCreateEmployee() {
  console.log('Logging in as Admin...');
  let token;
  try {
    const lr = await axios.post(`${BASE}/auth/login`, {
      email: 'adarsh@123.com', password: 'Admin@123'
    });
    token = lr.data.accessToken;
    console.log('Login successful.');
  } catch (e) {
    console.error('Login failed:', e.response?.data || e.message);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  console.log('\nFetching Departments & Designations to use valid IDs...');
  const [deptRes, desigRes] = await Promise.all([
    axios.get(`${BASE}/org/departments`, { headers }),
    axios.get(`${BASE}/org/designations`, { headers })
  ]);
  
  const deptId = deptRes.data[0]?.id;
  const desigId = desigRes.data[0]?.id;

  if (!deptId || !desigId) {
    console.error('No departments or designations found. Seed failed?');
    return;
  }

  const payload = {
    employee_code: `TEST-${Date.now()}`,
    first_name: 'Test',
    last_name: 'Employee',
    work_email: `test.${Date.now()}@example.com`,
    date_of_joining: new Date().toISOString().split('T')[0],
    department_id: deptId,
    designation_id: desigId,
    employment_type: 'FULL_TIME',
    employment_status: 'ACTIVE',
    work_location: '',
    phone: '',
    aadhaar_number: '',
    pan_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  };

  console.log('\nAttempting to create employee with payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await axios.post(`${BASE}/employees`, payload, { headers });
    console.log('\n✅ SUCCESS! Employee created:', res.data);
  } catch (e) {
    console.log('\n❌ FAILED TO SAVE EMPLOYEE');
    console.log('Status:', e.response?.status);
    console.log('Response Body:', JSON.stringify(e.response?.data, null, 2));
  }
}

testCreateEmployee();
