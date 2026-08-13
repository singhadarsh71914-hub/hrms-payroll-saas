import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import axios from 'axios';
import jwt from 'jsonwebtoken';

(async () => {
  const user = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, role: true, company_id: true } });
  const token = jwt.sign(
    { id: user.id, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1h' }
  );

  const headers = { Authorization: 'Bearer ' + token };
  const API_URL = 'http://localhost:3000/api';

  try {
    const headRes = await axios.get(API_URL + '/analytics/headcount?range=6m', { headers });
    console.log('HEADCOUNT:', JSON.stringify(headRes.data, null, 2));

    const miscRes = await axios.get(API_URL + '/analytics/misc-widgets?range=6m', { headers });
    console.log('MISC_WIDGETS (depts):', JSON.stringify(miscRes.data.data.departmentDistribution, null, 2));
    
    const actualEmps = await prisma.employee.count({ where: { company_id: user.company_id, employment_status: 'ACTIVE' }});
    console.log('ACTUAL DB EMPS:', actualEmps);
    
    const actualDepts = await prisma.department.count({ where: { company_id: user.company_id }});
    console.log('ACTUAL DB DEPTS:', actualDepts);
    
  } catch (e) {
    console.error(e.message);
  }
  await prisma.$disconnect();
})()
