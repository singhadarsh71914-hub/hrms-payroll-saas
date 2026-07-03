import { Request, Response } from 'express';
import { exportAccountData, deleteAccount } from './src/controllers/accountController.ts';
import prisma from './src/lib/prisma.ts';

async function run() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@e2e.com' } });

  const req = {
    user: { id: user.id },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'test' },
    body: { password: 'password123' }
  } as unknown as Request;

  const res = {
    status: (code: number) => {
      console.log('STATUS:', code);
      return res;
    },
    json: (data: any) => {
      console.log('JSON:', data);
    },
    attachment: (filename: string) => {
      console.log('ATTACHMENT:', filename);
    },
    setHeader: () => {},
    write: () => true,
    end: () => console.log('END'),
    on: () => res,
    once: () => res,
    emit: () => true,
    clearCookie: () => {}
  } as unknown as Response;

  console.log('--- TEST EXPORT ---');
  await exportAccountData(req, res);

  console.log('--- TEST DELETE ---');
  await deleteAccount(req, res);

  await prisma.$disconnect();
}
run();
