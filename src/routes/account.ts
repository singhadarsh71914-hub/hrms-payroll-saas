import { Router } from 'express';
// @ts-ignore
import { exportAccountData, deleteAccount } from '../controllers/accountController';
// @ts-ignore
import { authenticate } from '../middleware/auth';
// @ts-ignore
import { requireVerifiedEmail } from '../middleware/verification';
import { rateLimit } from 'express-rate-limit';

const accountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: { error: 'Too many requests. Please try again later.' }
});

const router = Router();

router.use(authenticate);
router.use(requireVerifiedEmail);
router.use(accountLimiter);

router.get('/export', exportAccountData);
router.post('/delete', deleteAccount); // using POST since we need password body payload, DELETE with body is often dropped by proxies

export default router;
