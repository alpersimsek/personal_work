import type { Request, Response, NextFunction } from 'express';
import { findById } from '../repositories/usersRepo.js';

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = req.user ? await findById(req.user.userId) : undefined;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' });
    return;
  }
  next();
}
