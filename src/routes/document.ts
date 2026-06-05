import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import prisma from '../lib/prisma.ts';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
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
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("File upload only supports the following filetypes - " + filetypes));
  }
});

// Get my documents
router.get('/my', async (req: AuthRequest, res: any, next: any) => {
  console.log('GET /api/documents/my');
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { employee: { user_id: req.user!.id } },
      orderBy: { uploaded_at: 'desc' }
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Get employee documents
router.get('/employee/:id', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  console.log(`GET /api/documents/employee/${req.params.id}`);
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { 
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
  console.log('GET /api/documents');
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { employee: { company_id: req.user!.company_id! } },
      orderBy: { uploaded_at: 'desc' },
      include: { employee: true }
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Upload document
router.post('/', authorize('ADMIN', 'HR'), upload.single('file'), async (req: AuthRequest, res: any, next: any) => {
  console.log('POST /api/documents');
  try {
    const { employee_id, document_type, document_name } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : '';
    
    if (!employee_id || !document_type || !document_name || !req.file) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const doc = await prisma.employeeDocument.create({
      data: {
        company_id: req.user!.company_id!,
        employee_id,
        document_type,
        document_name,
        file_url
      },
      include: { employee: true }
    });
    res.json(doc);
  } catch (err: any) {
    if (req.file) {
       try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(err);
  }
});

// Delete document
router.delete('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  console.log(`DELETE /api/documents/${req.params.id}`);
  try {
    const doc = await prisma.employeeDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    await prisma.employeeDocument.delete({ where: { id: req.params.id } });
    
    if (doc.file_url) {
      const filePath = path.join(__dirname, '../../', doc.file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
