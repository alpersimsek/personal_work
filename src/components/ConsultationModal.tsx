import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Loader2,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { BookingFormData } from '../types';
import { submitManualBooking, generateWhatsAppLink } from '../services/calendarService';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFAQ?: () => void;
  initialTopic?: 'netlik' | 'donusum' | 'diger';
  initialNote?: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  onOpenFAQ,
  initialTopic = 'netlik',
  initialNote = '',
}) => {
  const [formData, setFormData] = useState<BookingFormData>({
    fullName: '',
    email: '',
    phone: '',
    topic: initialTopic,
    message: initialNote,
    sessionType: 'google-meet',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [createdWhatsAppUrl, setCreatedWhatsAppUrl] = useState('');

  // Sync initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        topic: initialTopic,
        message: initialNote || prev.message,
      }));
    }
  }, [isOpen, initialTopic, initialNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const whatsAppUrl = generateWhatsAppLink(formData);
    setCreatedWhatsAppUrl(whatsAppUrl);

    try {
      const response = await submitManualBooking({ ...formData, honeypot });
      setIsSubmitting(false);
      if (response.whatsAppUrl) {
        setCreatedWhatsAppUrl(response.whatsAppUrl);
      }
      setSubmitted(true);
    } catch {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setHoneypot('');
    setCreatedWhatsAppUrl('');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      topic: 'netlik',
      message: '',
      sessionType: 'google-meet',
    });
    onClose();
  };

  if (!isOpen) return null;

  const modalJSX = (
    <AnimatePresence>
      {isOpen && (
        <div
          id="consultation-modal-root"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-0"
          />

          {/* Modal Card - 100% Viewport Centered via Portal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl liquid-glass rounded-3xl p-5 sm:p-8 md:p-10 text-white z-10 shadow-2xl bg-[#0c0c0c]/98 border border-white/15 text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-20 border border-white/10 bg-black/40"
              aria-label="Kapat"
            >
              <X size={18} />
            </button>

            {!submitted ? (
              <div>
                {/* Modal Header */}
                <div className="pr-8">
                  <div className="flex items-center gap-2 text-white/50 text-[11px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2">
                    <MessageCircle size={14} className="text-white/80 shrink-0" />
                    <span>TANIŞMA SEANSI RANDEVU TALEBİ</span>
                  </div>

                  <h3 className="serif-font text-2xl sm:text-3xl md:text-4xl tracking-tight text-white mb-2">
                    15 Dakikalık Tanışma Seansı Talebi
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 font-light">
                    Bilgilerinizi doldurun, randevu talebiniz koçumuza doğrudan iletilsin.
                  </p>
                </div>

                {/* Info Badge */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <MessageCircle size={16} />
                  </div>
                  <div className="text-xs">
                    <div className="text-white font-medium flex items-center gap-1.5">
                      <span>Birebir İletişim & Manuel Teyit</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-normal">Esnek Planlama</span>
                    </div>
                    <div className="text-white/40 text-[11px] mt-0.5 leading-relaxed">
                      Talebiniz alındıktan sonra koçumuz sizinle WhatsApp veya e-posta üzerinden iletişime geçerek uygun gün ve saat detaylarını netleştirecektir.
                    </div>
                  </div>
                </div>

                {/* FAQ Quick Link Banner */}
                {onOpenFAQ && (
                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 mb-5">
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <HelpCircle size={15} className="text-white/70 shrink-0" />
                      <span>Aklınıza takılan sorular mı var?</span>
                    </div>
                    <button
                      type="button"
                      id="btn-modal-open-faq"
                      onClick={() => {
                        onClose();
                        onOpenFAQ();
                      }}
                      className="text-[11px] sm:text-xs font-semibold text-white hover:text-white/90 bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                    >
                      <span>Sıkça Sorulan Sorular</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  {/* Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-1 font-medium">
                        Ad Soyad
                      </label>
                      <input
                        id="input-fullname"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Örn: Caner Yılmaz"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-1 font-medium">
                        E-posta Adresi
                      </label>
                      <input
                        id="input-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="caner@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-1 font-medium">
                        Telefon Numarası
                      </label>
                      <input
                        id="input-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0532 000 00 00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-1 font-medium">
                        Odak Alanı
                      </label>
                      <select
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value as any })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
                      >
                        <option value="netlik">Zihinsel Netlik & Yön Bulma</option>
                        <option value="donusum">Düşünceden Eyleme & Alışkanlıklar</option>
                        <option value="diger">Bütünsel Yaşam & Denge</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-1 font-medium">
                      Kısaca bahsetmek istediğin bir durum (Opsiyonel)
                    </label>
                    <textarea
                      id="textarea-message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Şu anki tıkandığın veya derinleşmek istediğin konuyu paylaşabilirsin..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-submit-consultation"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-white text-black hover:bg-white/90 font-medium py-3 sm:py-3.5 px-4 sm:px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer text-xs sm:text-sm shadow-xl"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin text-black" /> Talep Gönderiliyor...
                        </span>
                      ) : (
                        <>
                          <MessageCircle size={16} className="shrink-0" />
                          <span className="truncate">
                            Talebi Gönder & WhatsApp'ta Görüş
                          </span>
                          <ArrowRight size={16} className="shrink-0" />
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[11px] text-white/40 text-center mt-2.5">
                      <ShieldCheck size={13} />
                      <span>%100 Gizlilik Garantisi • Doğrudan Koç İle İletişim</span>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 text-white">
                  <CheckCircle2 size={36} />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-3">
                  <MessageCircle size={14} />
                  <span>Randevu Talebiniz Alındı</span>
                </div>

                <h3 className="serif-font text-2xl sm:text-3xl md:text-4xl text-white mb-2">
                  Talebiniz Başarıyla İletildi
                </h3>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6 font-light">
                  Sayın <strong className="text-white">{formData.fullName}</strong>, randevu talebiniz kayıt altına alındı.
                  <br />
                  Koçumuz kısa süre içerisinde detayları netleştirmek üzere sizinle iletişime geçecektir. İsterseniz WhatsApp üzerinden sohbeti hemen başlatabilirsiniz.
                </p>

                {/* Primary Action: Direct WhatsApp Chat Launch */}
                <div className="mb-6 flex flex-col items-center">
                  <a
                    id="btn-start-whatsapp-chat"
                    href={createdWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 bg-white text-black hover:bg-white/90 font-medium px-8 py-3.5 rounded-full text-xs sm:text-sm transition-all shadow-xl hover:scale-105"
                  >
                    <MessageCircle size={18} />
                    <span>Koç ile WhatsApp Sohbetini Başlat</span>
                    <ExternalLink size={14} />
                  </a>
                  <span className="text-[11px] text-white/40 mt-2">Tıkladığınızda hazır talep mesajınızla WhatsApp açılacaktır</span>
                </div>

                <button
                  id="btn-modal-done"
                  onClick={handleReset}
                  className="liquid-glass px-8 py-2.5 rounded-full text-white text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer border border-white/20"
                >
                  Tamamla ve Kapat
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalJSX, document.body)
    : null;
};




