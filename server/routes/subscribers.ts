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

/**
 * Adds an address to the newsletter.
 *
 * The answer is the same whether the address is new, coming back or already
 * subscribed, so this cannot be used to find out who is on the list.
 */
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
    await resubscribe(existing.id, { name, consentVersion });
  } else if (!existing) {
    await createUnlessDuplicate({ name, email, consentVersion });
  }
  // An active subscriber's row is left alone: a stranger must not be able to rename it.
  res.status(201).json({ success: true });
});

/** Two sign-ups for one address can race past the lookup; the loser is already subscribed. */
async function createUnlessDuplicate(input: { name: string; email: string; consentVersion: string }): Promise<void> {
  try {
    await createSubscriber(input);
  } catch (error) {
    if ((error as { code?: string }).code !== 'ER_DUP_ENTRY') throw error;
  }
}

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
