import { Router } from 'express';
import { subscribeSchema, unsubscribeSchema } from '../validation/schemas.js';
import {
  findByEmail,
  createSubscriber,
  markUnsubscribed,
  resubscribe,
  listAll,
} from '../repositories/subscribersRepo.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { subscribeRateLimit, unsubscribeRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';
import { CURRENT_CONSENT_VERSION } from '../config/consent.js';

export const subscribersRouter = Router();
export const adminSubscribersRouter = Router();

const ALREADY_SUBSCRIBED = 'Bu e-posta adresi zaten bültene kayıtlı.';

subscribersRouter.post('/', subscribeRateLimit, async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Ad, e-posta ve onay gereklidir.');
  }

  if (parsed.data.honeypot) {
    res.status(201).json({ success: true });
    return;
  }

  if (parsed.data.consentVersion !== CURRENT_CONSENT_VERSION) {
    throw new HttpError(400, 'Onay metni güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.');
  }

  const { name, consentVersion } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const existing = await findByEmail(email);

  if (existing?.unsubscribed_at) {
    // Someone who left may come back; their new consent replaces the old one.
    const subscriber = await resubscribe(existing.id, { name, consentVersion });
    res.status(201).json({ id: subscriber.id, email: subscriber.email });
    return;
  }
  if (existing) {
    throw new HttpError(409, ALREADY_SUBSCRIBED);
  }

  try {
    const subscriber = await createSubscriber({ name, email, consentVersion });
    res.status(201).json({ id: subscriber.id, email: subscriber.email });
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, ALREADY_SUBSCRIBED);
    }
    throw error;
  }
});

/**
 * Takes an address off the newsletter.
 *
 * The answer is the same whether or not the address was subscribed, so this
 * cannot be used to find out who is on the list. Repeating it is harmless.
 */
subscribersRouter.post('/unsubscribe', unsubscribeRateLimit, async (req, res) => {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Lütfen geçerli bir e-posta adresi girin.');
  }

  await markUnsubscribed(parsed.data.email.toLowerCase());
  res.json({ success: true });
});

adminSubscribersRouter.use(requireAuth, requireAdmin);

adminSubscribersRouter.get('/', async (_req, res) => {
  res.json(await listAll());
});
