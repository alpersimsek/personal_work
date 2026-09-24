import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, CheckCircle2, Eye, EyeOff, KeyRound, Minus, X, XCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called once the password has changed, so the page can say so after the window closes. */
  onChanged: () => void;
}

const MIN_LENGTH = 12;

interface RuleResult {
  label: string;
  met: boolean;
}

/** The rules the server enforces that can be judged while typing. Leaked, repetitive and similar cases come back from the server. */
function passwordRules(current: string, next: string): RuleResult[] {
  return [
    { label: `En az ${MIN_LENGTH} karakter`, met: next.length >= MIN_LENGTH },
    { label: 'Harf ile birlikte rakam veya sembol', met: /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(next) && /[0-9\W_]/.test(next) },
    { label: 'Mevcut şifreden farklı', met: next.length > 0 && next !== current },
  ];
}

type MatchState = 'idle' | 'match' | 'mismatch';

/** Whether the repeat box agrees with the new password; silent until something is typed in it. */
function matchState(next: string, confirm: string): MatchState {
  if (!confirm) return 'idle';
  return next === confirm ? 'match' : 'mismatch';
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  inputRef?: React.Ref<HTMLInputElement>;
  describedBy?: string;
  invalid?: boolean;
}

/** A password box with its own show/hide switch. */
const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  value,
  onChange,
  autoComplete,
  inputRef,
  describedBy,
  invalid,
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="w-full rounded-xl px-4 py-2.5 pr-11 text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? `${label} alanını gizle` : `${label} alanını göster`}
          aria-pressed={visible}
          className="btn btn-ghost btn-icon btn-sm absolute right-1 top-1/2 -translate-y-1/2"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
};

/**
 * Change-password window for the admin panel.
 *
 * Three fields: the current password, the new one and the new one again. The
 * rules light up as you type; anything only the server can judge (a leaked
 * password, for instance) comes back as a plain sentence.
 */
export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onChanged }) => {
  const titleId = useId();
  const errorId = useId();
  const rulesId = useId();
  const matchId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    setCurrent('');
    setNext('');
    setConfirm('');
    setError('');
    setDone(false);
    setSubmitting(false);
    firstFieldRef.current?.focus();
    return () => opener?.focus?.();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rules = passwordRules(current, next);
  const match = matchState(next, confirm);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!current) {
      setError('Lütfen mevcut şifrenizi yazın.');
      return;
    }
    const unmet = rules.find((rule) => !rule.met);
    if (unmet) {
      setError(`Yeni şifre için eksik: ${unmet.label.toLocaleLowerCase('tr-TR')}.`);
      return;
    }

    if (match !== 'match') {
      setError(
        confirm
          ? 'Yeni şifre ile tekrarı eşleşmiyor. Lütfen ikisini de kontrol edin.'
          : 'Lütfen yeni şifreyi bir kez daha yazın.',
      );
      return;
    }

    setSubmitting(true);
    setError('');
    const result = await authService.changePassword({
      currentPassword: current,
      newPassword: next,
      confirmPassword: confirm,
    });
    setSubmitting(false);
    if (result.success) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(true);
      onChanged();
    } else {
      setError(result.message ?? 'Şifre değiştirilemedi.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/45 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-2xl sm:p-8"
      >
        <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm absolute right-4 top-4" aria-label="Kapat">
          <X size={18} />
        </button>

        {done ? (
          <div role="status" className="pt-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
              <CheckCircle2 size={22} />
            </div>
            <h2 id={titleId} className="serif-font mb-2 text-2xl tracking-tight sm:text-3xl">
              Şifren değişti
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-neutral-600">
              Bu cihazda oturumun açık kalıyor. Başka cihazlardaki oturumlar güvenlik için kapatıldı.
            </p>
            <button autoFocus onClick={onClose} className="btn btn-primary w-full">
              Tamam
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
              <KeyRound size={20} />
            </div>
            <h2 id={titleId} className="serif-font mb-1 text-2xl tracking-tight sm:text-3xl">
              Şifre değiştir
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-neutral-600">
              Değiştirdiğinde başka cihazlardaki oturumların kapanır.
            </p>

            <div className="space-y-4">
              <PasswordField
                id="current-password"
                label="Mevcut şifre"
                value={current}
                onChange={(value) => {
                  setCurrent(value);
                  setError('');
                }}
                autoComplete="current-password"
                inputRef={firstFieldRef}
                describedBy={error ? errorId : undefined}
              />
              <PasswordField
                id="new-password"
                label="Yeni şifre"
                value={next}
                onChange={(value) => {
                  setNext(value);
                  setError('');
                }}
                autoComplete="new-password"
                describedBy={rulesId}
              />
              <PasswordField
                id="confirm-password"
                label="Yeni şifre (tekrar)"
                value={confirm}
                onChange={(value) => {
                  setConfirm(value);
                  setError('');
                }}
                autoComplete="new-password"
                describedBy={matchId}
                invalid={match === 'mismatch'}
              />
              {/* Match check under the repeat box: red while they differ, green once they agree. Its height is reserved so nothing jumps. */}
              <div id={matchId} aria-live="polite" className="-mt-2.5 min-h-8">
                {match !== 'idle' && (
                  <p
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                      match === 'match'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {match === 'match' ? (
                      <CheckCircle2 size={14} className="shrink-0" />
                    ) : (
                      <XCircle size={14} className="shrink-0" />
                    )}
                    <span>{match === 'match' ? 'Şifreler eşleşiyor' : 'Şifreler eşleşmiyor'}</span>
                  </p>
                )}
              </div>
            </div>

            <ul id={rulesId} aria-label="Şifre koşulları" className="mt-4 space-y-1.5 text-xs">
              {rules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 ${rule.met ? 'text-emerald-700' : 'text-neutral-500'}`}
                >
                  {rule.met ? <Check size={14} className="shrink-0" /> : <Minus size={14} className="shrink-0" />}
                  <span>{rule.label}</span>
                  <span className="sr-only">{rule.met ? '(sağlandı)' : '(henüz sağlanmadı)'}</span>
                </li>
              ))}
            </ul>

            {error && (
              <p id={errorId} role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-relaxed text-rose-700 sm:text-sm">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Vazgeç
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Değiştiriliyor…' : 'Şifreyi değiştir'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
