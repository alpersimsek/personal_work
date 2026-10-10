import { Router } from 'express';
import { listAll } from '../repositories/subscribersRepo.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { subscribeRateLimit, unsubscribeRateLimit } from '../middleware/rateLimit.js';
import type { Request, Response } from 'express';

export const subscribersRouter = Router();
export const adminSubscribersRouter = Router();

/**
 * An email address and a checked box do not prove mailbox ownership.
 * Keep public writes closed until verified opt-in and signed opt-out links
 * exist. This preserves consent/opt-out records and never sends email.
 */
function publicChangesUnavailable(_req: Request, res: Response): void {
  res.setHeader('Cache-Control', 'no-store');
  res.status(403).json({
    error: 'Bülten işlemleri geçici olarak kapalı. Katılmak veya listeden çıkmak için lütfen iletişim adresimizden bize ulaşın.',
  });
}

subscribersRouter.post('/', subscribeRateLimit, publicChangesUnavailable);
subscribersRouter.post('/unsubscribe', unsubscribeRateLimit, publicChangesUnavailable);

adminSubscribersRouter.use(requireAuth, requireAdmin);
adminSubscribersRouter.get('/', async (_req, res) => {
  res.json(await listAll());
});
