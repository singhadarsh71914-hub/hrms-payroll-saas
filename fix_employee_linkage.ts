import prisma from './src/lib/prisma.ts';

async function main() {
  const users = await prisma.user.findMany({
    include: { employee: true }
  });
  
  for (const user of users) {
    if (user.employee) continue; // Already linked
    
    if (!user.company_id) {
      console.log(`User ${user.email} has no company_id. Skipping.`);
      continue;
    }
    
    // Check if employee with same email exists
    const existingEmployee = await prisma.employee.findFirst({
      where: { work_email: user.email }
    });
    
    if (existingEmployee) {
      // Link them
      await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: { user_id: user.id }
      });
      console.log(`Linked existing employee ${existingEmployee.id} to user ${user.email}`);
    } else {
      // Create new employee
      const employeeCount = await prisma.employee.count({
        where: { company_id: user.company_id }
      });
      const empCode = `EMP-${String(employeeCount + 1).padStart(3, '0')}-${Math.floor(Math.random()*1000)}`;
      const [firstName, ...lastNames] = user.email.split('@')[0].split('.');
      const lastName = lastNames.length > 0 ? lastNames.join(' ') : 'User';
      
      const newEmp = await prisma.employee.create({
        data: {
          company_id: user.company_id,
          user_id: user.id,
          first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          work_email: user.email,
          employee_code: empCode,
          date_of_joining: new Date(),
        }
      });
      console.log(`Created new employee ${newEmp.id} for user ${user.email}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
