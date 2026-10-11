import React, { useEffect, useId, useRef } from 'react';
import { AlertCircle, CheckCircle2, Trash2, X } from 'lucide-react';

export type AdminMessageKind = 'success' | 'error' | 'confirm';

interface AdminMessageDialogProps {
  kind: AdminMessageKind;
  message: string;
  /** Overrides the default heading for the kind. */
  title?: string;
  /** Confirm only: label of the action button. */
  confirmLabel?: string;
  /** Confirm only: runs when the action button is pressed. */
  onConfirm?: () => void;
  onClose: () => void;
}

const DEFAULT_TITLE: Record<AdminMessageKind, string> = {
  success: 'Tamamlandı',
  error: 'Bir sorun oluştu',
  confirm: 'Emin misiniz?',
};

/**
 * Centred message box for the admin panel: a result (success / error) with a
 * single "Tamam", or a confirmation with "Vazgeç" and the action button.
 * Mount it only while there is something to say.
 */
export const AdminMessageDialog: React.FC<AdminMessageDialogProps> = ({
  kind,
  message,
  title,
  confirmLabel = 'Evet',
  onConfirm,
  onClose,
}) => {
  const titleId = useId();
  const messageId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const Icon = kind === 'success' ? CheckCircle2 : kind === 'error' ? AlertCircle : Trash2;
  const iconTone =
    kind === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : kind === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-neutral-200 bg-neutral-50 text-neutral-800';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-900/45 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role={kind === 'error' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-6 text-center text-neutral-900 shadow-2xl sm:p-8"
      >
        <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm absolute right-4 top-4" aria-label="Kapat">
          <X size={18} />
        </button>

        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${iconTone}`}>
          <Icon size={22} />
        </div>
        <h2 id={titleId} className="serif-font mb-2 text-2xl tracking-tight">
          {title ?? DEFAULT_TITLE[kind]}
        </h2>
        <p id={messageId} className="mb-6 text-sm leading-relaxed text-neutral-600">
          {message}
        </p>

        {kind === 'confirm' ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Vazgeç
            </button>
            <button ref={primaryRef} type="button" onClick={onConfirm} className="btn btn-primary">
              {confirmLabel}
            </button>
          </div>
        ) : (
          <button ref={primaryRef} type="button" onClick={onClose} className="btn btn-primary w-full">
            Tamam
          </button>
        )}
      </div>
    </div>
  );
};
