import React, { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Mail } from 'lucide-react';
import { subscribe } from '../services/subscribeService';

export const SubscribeSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setNotice({ type: 'error', text: 'Devam etmek için lütfen onay kutusunu işaretleyin.' });
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      const result = await subscribe({ name, email, consent, honeypot });
      if (result.success) {
        setNotice({ type: 'success', text: 'Kaydınız alındı, teşekkürler!' });
        setName('');
        setEmail('');
        setConsent(false);
      } else {
        setNotice({ type: 'error', text: result.message || 'Kaydınız şu anda alınamadı.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-black px-4 sm:px-6 pb-16 sm:pb-24 md:pb-28 relative" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-glass rounded-[2rem] px-5 py-12 sm:px-10 sm:py-16 md:px-16 md:py-20 text-center relative overflow-hidden border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent shadow-2xl"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 mb-5 text-white">
              <Mail size={20} />
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl text-white font-serif tracking-tight leading-[1.15] mb-4">
              Bültene Katıl
            </h2>

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

              {/* Placeholder consent wording — needs a lawyer-reviewed KVKK-compliant
                  text and privacy notice link before this goes live. */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-white/70 pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-black/50 text-white focus:ring-0 shrink-0"
                />
                <span>Adımı ve e-posta adresimi bülten gönderimi amacıyla işlenmesine onay veriyorum.</span>
              </label>

              {notice && (
                <p
                  role={notice.type === 'error' ? 'alert' : 'status'}
                  className={`text-xs sm:text-sm ${notice.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
                >
                  {notice.text}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                className="w-full rounded-full px-8 py-3.5 bg-white text-black font-semibold text-sm sm:text-base hover:bg-white/90 transition-all cursor-pointer shadow-xl border border-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Gönderiliyor…' : 'Bültene Katıl'}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
