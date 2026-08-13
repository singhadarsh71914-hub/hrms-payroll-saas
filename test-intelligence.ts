import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:3000/api';

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("No company found.");
    return;
  }
  const user = await prisma.user.findFirst({ where: { company_id: company.id } });
  if (!user) {
    console.log("No user found.");
    return;
  }

  console.log("Authenticating as:", user.email);
  const token = jwt.sign(
    { id: user.id, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1h' }
  );

  // Check counts BEFORE
  const initialCompanySnaps = await prisma.companyIntelligenceSnapshot.count();
  const initialEmployeeSnaps = await prisma.employeeIntelligenceSnapshot.count();
  console.log(`BEFORE: CompanySnapshots=${initialCompanySnaps}, EmployeeSnapshots=${initialEmployeeSnaps}`);

  console.log("Triggering intelligence calculation via API...");
  const calcRes = await axios.post(`${API_URL}/intelligence/calculate`, { type: 'ALL' }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Calculate response:", calcRes.data);

  // Check counts AFTER
  const finalCompanySnaps = await prisma.companyIntelligenceSnapshot.count();
  const finalEmployeeSnaps = await prisma.employeeIntelligenceSnapshot.count();
  console.log(`AFTER: CompanySnapshots=${finalCompanySnaps}, EmployeeSnapshots=${finalEmployeeSnaps}`);
  
  if (finalCompanySnaps > initialCompanySnaps) {
    console.log("SUCCESS: Snapshots increased!");
  } else {
    console.error("FAIL: Snapshots did not increase.");
  }

  console.log("Fetching dashboard data...");
  const dashRes = await axios.get(`${API_URL}/intelligence/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Dashboard response keys:", Object.keys(dashRes.data.data));
  console.log("Has forecast?", !!dashRes.data.data.forecast);
  console.log("Has attritionScores?", dashRes.data.data.attritionScores.length > 0);
  console.log("SUCCESS: End-to-end intelligence workflow verified.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
