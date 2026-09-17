import { Router, json } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { HttpError } from '../middleware/errorHandler.js';
import { parseBlogBackup } from '../validation/blogBackup.js';
import { exportBlogBackup, previewBlogRestore, restoreBlogBackup } from '../repositories/blogBackupRepo.js';

export const blogBackupRouter = Router();
blogBackupRouter.use(requireAuth, requireAdmin);
blogBackupRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
// Authenticate before accepting the larger backup payload.
blogBackupRouter.use(json({ limit: '50mb' }));

function validatedBackup(body: unknown) {
  try { return parseBlogBackup(body); }
  catch { throw new HttpError(400, 'Geçersiz blog yedeği. Dosya biçimini ve yazı verilerini kontrol edin.'); }
}

blogBackupRouter.get('/', async (_req, res) => {
  res.attachment(`tugba-blog-backup-${new Date().toISOString().slice(0, 10)}.json`);
  res.json(await exportBlogBackup());
});

blogBackupRouter.post('/preview', async (req, res) => {
  const backup = validatedBackup(req.body);
  res.json(await previewBlogRestore(backup.posts));
});

blogBackupRouter.post('/restore', async (req, res) => {
  const backup = validatedBackup(req.body);
  res.json(await restoreBlogBackup(backup.posts));
});
