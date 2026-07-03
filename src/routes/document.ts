import { logError } from '../utils/logError.ts';
import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import prisma from '../lib/prisma.ts';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuditService, AuditAction } from '../services/audit.service.ts';
import { validate } from '../middleware/validate.ts';
import { uploadDocumentSchema } from '../schemas/document.schema.ts';

console.log("DOCUMENT ROUTE FILE LOADED");

const router = Router();

router.use((req, res, next) => {
  console.log("DOC REQUEST:", req.method, req.originalUrl);
  next();
});

router.use(authenticate);

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.ps1', '.sh'];
    if (dangerousExtensions.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error("Dangerous file type blocked"));
    }

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("File upload only supports the following filetypes - " + filetypes));
  }
});

const uploadMiddleware = (req: any, res: any, next: any) => {
  const multerUpload = upload.single('file');
  multerUpload(req, res, function (err: any) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ status: 'error', message: err.message });
    } else if (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    next();
  });
};

// Get my documents
router.get('/my', async (req: AuthRequest, res: any, next: any) => {
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { employee: { user_id: req.user!.id } },
      orderBy: { uploaded_at: 'desc' },
      include: { employee: true }
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Get employee documents
router.get('/employee/:id', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  try {
    if (req.user!.role === 'MANAGER') {
      const employee = await prisma.employee.findUnique({
        // @ts-ignore
        where: { id: req.params.id },
        select: { reporting_manager_id: true }
      });
      
      if (!employee || employee.reporting_manager_id !== req.user!.employee_id) {
        return res.status(403).json({ error: 'Unauthorized: You can only view your team documents' });
      }
    }

    const docs = await prisma.employeeDocument.findMany({
      where: { 
        // @ts-ignore
        employee_id: req.params.id,
        employee: { company_id: req.user!.company_id! }
      },
      orderBy: { uploaded_at: 'desc' },
      include: { employee: true }
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Get all documents (for HR)
router.get('/', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { company_id: req.user!.company_id! },
      orderBy: { uploaded_at: 'desc' },
      include: { employee: true }
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Download document
router.get('/:id/download', async (req: AuthRequest, res: any, next: any) => {
  console.log(`EXEC DOWNLOAD - ID: ${req.params.id}`);
  try {
    const doc = await prisma.employeeDocument.findUnique({
      // @ts-ignore
      where: { id: req.params.id },
      include: { employee: true }
    });

    if (!doc) {
      console.error(`DB: Document not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Document not found in database' });
    }

    console.log(`Found doc: ${doc.document_name}, Path in DB: ${doc.file_url}`);

    if (doc.company_id !== req.user!.company_id) {
      console.error(`Company mismatch: User ${req.user!.company_id} vs Doc ${doc.company_id}`);
      return res.status(403).json({ error: 'Unauthorized: Company mismatch' });
    }

    const { role, employee_id, id: userId } = req.user!;
    let isAuthorized = false;
    if (role === 'ADMIN' || role === 'HR') isAuthorized = true;
    // @ts-ignore
    else if (role === 'MANAGER' && doc.employee.reporting_manager_id === employee_id) isAuthorized = true;
    // @ts-ignore
    else if (role === 'EMPLOYEE' && doc.employee.user_id === userId) isAuthorized = true;

    if (!isAuthorized) {
      console.error(`Authorization failed for role ${role}`);
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const normalizedPath = doc.file_url.startsWith('/') ? doc.file_url.substring(1) : doc.file_url;
    const filePath = path.resolve(process.cwd(), normalizedPath);
    console.log(`Resolved full path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`DISK: File missing: ${filePath}`);
      return res.status(404).json({ error: 'File not found on server disk' });
    }

    const ext = path.extname(doc.file_url).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.document_name}${ext}"`);

    await AuditService.log({
      userId: req.user?.id,
      companyId: req.user?.company_id!,
      action: AuditAction.DOCUMENT_DOWNLOAD,
      entityType: 'DOCUMENT',
      entityId: doc.id,
      metadata: { document_name: doc.document_name },
      ipAddress: req.ip,
    });

    console.log('Streaming started...');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('STREAM ERROR:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Stream failed' });
    });
    stream.pipe(res);
  } catch (err) {
    console.error('DOWNLOAD ERROR:', err);
    next(err);
  }
});

// Upload document
router.post('/', authorize('ADMIN', 'HR'), uploadMiddleware, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { employee_id, document_type, document_name } = req.body;
    
    if (!employee_id) {
      return res.status(400).json({ status: 'error', message: 'employee_id is required' });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'file is required' });
    }
    if (!document_type) {
      return res.status(400).json({ status: 'error', message: 'document_type is required' });
    }
    if (!document_name) {
      return res.status(400).json({ status: 'error', message: 'document_name is required' });
    }

    const employeeExists = await prisma.employee.findUnique({ where: { id: employee_id } });
    if (!employeeExists) {
      return res.status(400).json({ status: 'error', message: 'Invalid employee_id' });
    }

    const validDocumentTypes = ['OFFER_LETTER', 'ID_PROOF', 'ADDRESS_PROOF', 'PF_FORM', 'FORM16', 'OTHER'];
    if (!validDocumentTypes.includes(document_type)) {
      return res.status(400).json({ status: 'error', message: 'Invalid document_type' });
    }

    const file_url = `uploads/${req.file.filename}`;
    
    const doc = await prisma.employeeDocument.create({
      data: {
        company_id: req.user!.company_id!,
        employee_id,
        document_type,
        document_name,
        file_url
      }
    });

    await AuditService.log({
      userId: req.user?.id,
      companyId: req.user?.company_id!,
      action: AuditAction.DOCUMENT_UPLOAD,
      entityType: 'DOCUMENT',
      entityId: doc.id,
      metadata: { employee_id, document_name, document_type },
      ipAddress: req.ip,
    });

    res.json(doc);
  } catch (err: any) {
    next(err);
  }
});

// Delete document
router.delete('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  console.log(`EXEC DELETE - ID: ${req.params.id}`);
  try {
    // @ts-ignore
    const doc = await prisma.employeeDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) {
      console.error(`DB: Doc not found for delete: ${req.params.id}`);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // @ts-ignore
    await prisma.employeeDocument.delete({ where: { id: req.params.id } });
    console.log('Record deleted from DB');

    await AuditService.log({
      userId: req.user?.id,
      companyId: req.user?.company_id!,
      action: AuditAction.DOCUMENT_DELETE,
      entityType: 'DOCUMENT',
      // @ts-ignore
      entityId: req.params.id,
      metadata: { document_name: doc.document_name },
      ipAddress: req.ip,
    });
    
    if (doc.file_url) {
      const normalizedPath = doc.file_url.startsWith('/') ? doc.file_url.substring(1) : doc.file_url;
      const filePath = path.resolve(process.cwd(), normalizedPath);
      console.log(`Deleting file: ${filePath}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('File removed from disk');
      } else {
        console.warn('File not found on disk');
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE ERROR:', err);
    next(err);
  }
});

export default router;
