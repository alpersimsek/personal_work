import { Router } from 'express';
import { subscribeSchema } from '../validation/schemas.js';
import { findByEmail, createSubscriber, listAll } from '../repositories/subscribersRepo.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { subscribeRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';

export const subscribersRouter = Router();
export const adminSubscribersRouter = Router();

subscribersRouter.post('/', subscribeRateLimit, async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Ad, e-posta ve onay gereklidir.');
  }

  if (parsed.data.honeypot) {
    res.status(201).json({ success: true });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await findByEmail(email);
  if (existing) {
    throw new HttpError(409, 'Bu e-posta adresi zaten kayıtlı.');
  }

  try {
    const subscriber = await createSubscriber({ name: parsed.data.name, email });
    res.status(201).json({ id: subscriber.id, email: subscriber.email });
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Bu e-posta adresi zaten kayıtlı.');
    }
    throw error;
  }
});

adminSubscribersRouter.use(requireAuth, requireAdmin);

adminSubscribersRouter.get('/', async (_req, res) => {
  res.json(await listAll());
});
