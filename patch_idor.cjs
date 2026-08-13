const fs = require('fs');

const path = 'src/routes/employees.ts';
let code = fs.readFileSync(path, 'utf8');

// Add authorize checks
// GET /
code = code.replace(
  "router.get('/', async (req: AuthRequest, res: any, next: any) => {",
  "router.get('/', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {"
);

const ensureSelfOrManager = `
    const isSelf = req.user?.employee_id === req.params.id;
    const isManager = ['ADMIN', 'HR', 'MANAGER'].includes(req.user?.role || '');
    if (!isSelf && !isManager) return next(new AppError('Unauthorized access', 403));
`;

// Inject into /:id
code = code.replace(
  "router.get('/:id', async (req: AuthRequest, res: any, next: any) => {\n  try {",
  "router.get('/:id', async (req: AuthRequest, res: any, next: any) => {\n  try {\n" + ensureSelfOrManager
);

// Inject into /:id/attendance
code = code.replace(
  "router.get('/:id/attendance', async (req: AuthRequest, res: any, next: any) => {\n  try {",
  "router.get('/:id/attendance', async (req: AuthRequest, res: any, next: any) => {\n  try {\n" + ensureSelfOrManager
);

// Inject into /:id/leaves
code = code.replace(
  "router.get('/:id/leaves', async (req: AuthRequest, res: any, next: any) => {\n  try {",
  "router.get('/:id/leaves', async (req: AuthRequest, res: any, next: any) => {\n  try {\n" + ensureSelfOrManager
);

// Inject into /:id/payrolls
code = code.replace(
  "router.get('/:id/payrolls', async (req: AuthRequest, res: any, next: any) => {\n  try {",
  "router.get('/:id/payrolls', async (req: AuthRequest, res: any, next: any) => {\n  try {\n" + ensureSelfOrManager
);

// Inject into /:id/documents
code = code.replace(
  "router.get('/:id/documents', async (req: AuthRequest, res: any, next: any) => {\n  try {",
  "router.get('/:id/documents', async (req: AuthRequest, res: any, next: any) => {\n  try {\n" + ensureSelfOrManager
);

// Inject into /:id/loans
code = code.replace(
  "router.get('/:id/loans', async (req: AuthRequest, res: any, next: any) => {\n  try {",
  "router.get('/:id/loans', async (req: AuthRequest, res: any, next: any) => {\n  try {\n" + ensureSelfOrManager
);

fs.writeFileSync(path, code);
console.log('Patched employees.ts');
