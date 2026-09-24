import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, MailMinus, X } from 'lucide-react';
import { isPlausibleEmail, unsubscribe } from '../services/subscribeService';

interface UnsubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fills the field, e.g. with what the visitor already typed in the sign-up form. */
  initialEmail?: string;
}

const INVALID_EMAIL = 'Lütfen geçerli bir e-posta adresi girin, örneğin ad@eposta.com.';

/** Lets someone leave the newsletter by typing the address they signed up with. */
export const UnsubscribeModal: React.FC<UnsubscribeModalProps> = ({ isOpen, onClose, initialEmail = '' }) => {
  const titleId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState('');

  // Start fresh each time it opens, and give focus back to whatever opened it.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    setEmail(initialEmail);
    setError('');
    setDone(false);
    setSubmitting(false);
    inputRef.current?.focus();
    return () => opener?.focus?.();
  }, [isOpen, initialEmail]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!isPlausibleEmail(email)) {
      setError(INVALID_EMAIL);
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError('');
    const result = await unsubscribe(email.trim());
    setSubmitting(false);
    if (result.success) {
      setRequestedEmail(email.trim());
      setDone(true);
    }
    else setError(result.message ?? INVALID_EMAIL);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-0"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-8 text-white z-10 shadow-2xl bg-[#0a0a0a]/98 border border-white/15 text-left"
          >
            <button onClick={onClose} className="btn btn-secondary btn-icon btn-sm absolute top-4 right-4" aria-label="Kapat">
              <X size={18} />
            </button>

            {done ? (
              <div role="status" className="text-center pt-2">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/15">
                  <CheckCircle2 size={22} />
                </div>
                <h2 id={titleId} className="serif-font text-2xl sm:text-3xl tracking-tight mb-3">
                  Talebin alındı
                </h2>
                <p className="text-white/70 text-sm leading-relaxed font-light mb-2">
                  <span className="break-all font-medium text-white">{requestedEmail}</span> adresi bültene kayıtlıysa listeden çıkarıldı; artık size bülten göndermeyeceğiz.
                </p>
                <p className="text-white/50 text-xs leading-relaxed mb-6">
                  Gizliliğiniz için bir adresin listede olup olmadığını söylemiyoruz. Adresi yanlış yazdıysanız başka bir adresle yeniden deneyebilirsiniz.
                </p>
                <div className="flex flex-col gap-2">
                  <button autoFocus onClick={onClose} className="btn btn-primary w-full">
                    Kapat
                  </button>
                  <button type="button" onClick={() => setDone(false)} className="btn btn-ghost w-full">
                    Başka bir adres dene
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/15">
                  <MailMinus size={20} />
                </div>
                <h2 id={titleId} className="serif-font text-2xl sm:text-3xl tracking-tight mb-2">
                  Bültenden çık
                </h2>
                <p className="text-white/70 text-sm leading-relaxed font-light mb-5">
                  Bültene katılırken kullandığın e-posta adresini yaz, seni listeden çıkaralım. Bunun için başka bir bilgiye gerek yok.
                </p>

                <label htmlFor="unsubscribe-email" className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-medium">
                  E-posta
                </label>
                <input
                  id="unsubscribe-email"
                  ref={inputRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="ornek@eposta.com"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40"
                />

                {error && (
                  <p id={errorId} role="alert" className="mt-2 text-xs sm:text-sm leading-relaxed text-red-300">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={onClose} className="btn btn-ghost">
                    Vazgeç
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Gönderiliyor…' : 'Bültenden çık'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
