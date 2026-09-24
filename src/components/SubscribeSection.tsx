import React, { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Mail } from 'lucide-react';
import { isPlausibleEmail, subscribe } from '../services/subscribeService';
import { UnsubscribeModal } from './UnsubscribeModal';
import { CONSENT_STATEMENT, KVKK_PATH, KVKK_VERSION } from '../legal/kvkk';
import { navigateToPath } from '../routes';

const DRAFT_KEY = 'tugba-subscribe-draft';

/** Name and e-mail survive a trip to the notice page. Consent never does: it must be given fresh. */
function readDraft(): { name: string; email: string } {
  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}');
    return { name: typeof draft.name === 'string' ? draft.name : '', email: typeof draft.email === 'string' ? draft.email : '' };
  } catch {
    return { name: '', email: '' };
  }
}

export const SubscribeSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const [name, setName] = useState(() => readDraft().name);
  const [email, setEmail] = useState(() => readDraft().email);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [unsubscribeOpen, setUnsubscribeOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotice({ type: 'error', text: 'Lütfen adınızı ve soyadınızı yazın.' });
      return;
    }
    if (!isPlausibleEmail(email)) {
      setNotice({ type: 'error', text: 'Lütfen geçerli bir e-posta adresi girin, örneğin ad@eposta.com.' });
      return;
    }
    if (!consent) {
      setNotice({ type: 'error', text: 'Bültene katılmak için lütfen onay kutusunu işaretleyin.' });
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      const result = await subscribe({ name, email, consent, consentVersion: KVKK_VERSION, honeypot });
      if (result.success) {
        setNotice({ type: 'success', text: 'Kaydınız alındı, teşekkürler!' });
        setName('');
        setEmail('');
        setConsent(false);
        sessionStorage.removeItem(DRAFT_KEY);
      } else {
        setNotice({ type: 'error', text: result.message || 'Kaydınız şu anda alınamadı.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="bulten" className="bg-black px-4 sm:px-6 pt-6 sm:pt-10 md:pt-12 pb-6 sm:pb-10 md:pb-12 relative" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-glass rounded-[2rem] px-5 py-12 sm:px-10 sm:py-16 md:px-16 md:py-20 text-center relative overflow-hidden border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent shadow-lg"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
                <Mail size={20} />
              </div>
              <h2 className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
                Bültene Katıl
              </h2>
            </div>

            <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed mb-8 font-light px-2">
              İçsel netlik, farkındalık ve yaşam dönüşümü üzerine yazıları e-posta ile ilk sen öğren.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
              {/* Anti-bot Honeypot Input */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website_url"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="subscribe-name" className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-medium">
                    Ad Soyad
                  </label>
                  <input
                    id="subscribe-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label htmlFor="subscribe-email" className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-medium">
                    E-posta
                  </label>
                  <input
                    id="subscribe-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@eposta.com"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Unticked by default and separate from the notice: consent must be an active, specific choice. */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-white/70 pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-black/50 text-white focus:ring-0 shrink-0"
                />
                <span>{CONSENT_STATEMENT}</span>
              </label>
              <p className="text-xs leading-relaxed text-white/50">
                Kişisel verilerinizin işlenmesine ilişkin{' '}
                <a
                  href={KVKK_PATH}
                  onClick={(e) => {
                    e.preventDefault();
                    try {
                      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, email }));
                    } catch {
                      // Storage can be unavailable (private mode); the form simply starts empty on return.
                    }
                    navigateToPath(KVKK_PATH, { returnTo: '#bulten' });
                  }}
                  className="underline underline-offset-4 decoration-white/30 hover:text-white/80 transition-colors"
                >
                  Aydınlatma Metni
                </a>
                &apos;ni inceleyebilirsiniz.
              </p>

              {notice && (
                <p
                  role={notice.type === 'error' ? 'alert' : 'status'}
                  className={`text-xs sm:text-sm ${notice.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
                >
                  {notice.text}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg w-full"
              >
                {submitting ? 'Gönderiliyor…' : 'Bültene Katıl'}
              </button>

              <div className="text-center">
                <button type="button" onClick={() => setUnsubscribeOpen(true)} className="btn btn-link text-xs sm:text-sm">
                  Bültenden çık
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <UnsubscribeModal isOpen={unsubscribeOpen} onClose={() => setUnsubscribeOpen(false)} initialEmail={email} />
    </section>
  );
};
