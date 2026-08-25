import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, CheckCircle2, ArrowRight, Calendar, Clock, Video, VideoOff, ShieldCheck } from 'lucide-react';
import { BookingFormData } from '../types';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: 'netlik' | 'donusum' | 'diger';
  initialNote?: string;
}

const AVAILABLE_DAYS = [
  { label: 'Pazartesi', date: '1 Eyl' },
  { label: 'Salı', date: '2 Eyl' },
  { label: 'Çarşamba', date: '3 Eyl' },
  { label: 'Perşembe', date: '4 Eyl' },
  { label: 'Cuma', date: '5 Eyl' },
];

const TIME_SLOTS = ['11:00', '14:30', '16:00', '18:30', '20:00'];

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  initialTopic = 'netlik',
  initialNote = '',
}) => {
  const [activeTab, setActiveTab] = useState<'meet-calendar' | 'custom-form'>('meet-calendar');
  const [selectedDay, setSelectedDay] = useState(AVAILABLE_DAYS[0].date);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('16:00');

  const [formData, setFormData] = useState<BookingFormData>({
    fullName: '',
    email: '',
    phone: '',
    topic: initialTopic,
    message: initialNote,
    preferredDate: AVAILABLE_DAYS[0].date,
    preferredTimeSlot: '16:00',
    sessionType: 'google-meet',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      topic: 'netlik',
      message: '',
      preferredDate: AVAILABLE_DAYS[0].date,
      preferredTimeSlot: '16:00',
      sessionType: 'google-meet',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="consultation-modal-root" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl liquid-glass rounded-3xl p-6 sm:p-10 text-white z-10 my-8 shadow-2xl bg-[#0c0c0c]/95 border border-white/10"
          >
            {/* Close Button */}
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X size={20} />
            </button>

            {!submitted ? (
              <div>
                {/* Modal Header */}
                <div className="flex items-center gap-2 text-white/50 text-xs tracking-widest uppercase mb-2">
                  <Video size={15} className="text-white/80" />
                  <span>GOOGLE MEET İLE BİREBİR TANIŞMA GÖRÜŞMESİ</span>
                </div>

                <h3 className="serif-font text-2xl sm:text-4xl tracking-tight text-white mb-2">
                  25 Dakikalık Ücretsiz Seans
                </h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6 font-light">
                  Google Meet üzerinden görüntülü veya sesli olarak tanışalım, ihtiyacını netleştirelim ve koçluğun senin için doğru adım olup olmadığını birlikte keşfedelim.
                </p>

                {/* Google Meet Badge */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                    <Video size={16} />
                  </div>
                  <div className="text-xs">
                    <div className="text-white font-medium">Otomatik Google Meet Takvim Daveti</div>
                    <div className="text-white/40">Görüşme linki onay anında e-posta ve Google Calendar'ınıza gönderilir.</div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Step 1: Slot Selection */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium">
                      1. Tercih Ettiğiniz Gün
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {AVAILABLE_DAYS.map((d) => (
                        <button
                          key={d.date}
                          type="button"
                          onClick={() => {
                            setSelectedDay(d.date);
                            setFormData({ ...formData, preferredDate: d.date });
                          }}
                          className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                            formData.preferredDate === d.date
                              ? 'bg-white text-black border-white font-semibold'
                              : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="text-[10px] uppercase opacity-70">{d.label.slice(0, 3)}</div>
                          <div className="text-xs">{d.date}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium">
                      2. Saat Dilimi (Google Meet)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedTimeSlot(slot);
                            setFormData({ ...formData, preferredTimeSlot: slot });
                          }}
                          className={`py-2 rounded-xl text-xs text-center transition-all cursor-pointer border ${
                            formData.preferredTimeSlot === slot
                              ? 'bg-white text-black border-white font-semibold'
                              : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-medium">
                        Adınız Soyadınız
                      </label>
                      <input
                        id="input-name"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Örn. Selin Yılmaz"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-medium">
                        E-posta (Meet Daveti İçin)
                      </label>
                      <input
                        id="input-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="adiniz@ornek.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-medium">
                        Telefon (WhatsApp Hatırlatması)
                      </label>
                      <input
                        id="input-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+90 5XX XXX XX XX"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-medium">
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
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-medium">
                      Kısaca bahsetmek istediğin bir durum (Opsiyonel)
                    </label>
                    <textarea
                      id="textarea-message"
                      rows={2}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Şu anki tıkandığın veya derinleşmek istediğin konuyu paylaşabilirsin..."
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-submit-consultation"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full liquid-glass bg-white text-black hover:bg-white/90 font-medium py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-xl"
                    >
                      {isSubmitting ? (
                        <span>Google Meet Daveti Hazırlanıyor...</span>
                      ) : (
                        <>
                          <span>Google Meet Randevusunu Onayla ({formData.preferredDate} - {formData.preferredTimeSlot})</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[11px] text-white/40 text-center mt-3">
                      <ShieldCheck size={13} />
                      <span>%100 Gizlilik Garantisi • Ücretsiz 25 Dakika</span>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6 text-white">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="serif-font text-3xl sm:text-4xl text-white mb-2">
                  Google Meet Randevunuz Oluşturuldu
                </h3>
                <p className="text-white/70 text-sm leading-relaxed max-w-md mx-auto mb-6 font-light">
                  Harika bir başlangıç, {formData.fullName}. <strong className="text-white">{formData.preferredDate} saat {formData.preferredTimeSlot}</strong> için oluşturulan Google Meet bağlantı linki <strong className="text-white">{formData.email}</strong> adresinize iletildi.
                </p>

                <div className="liquid-glass p-4 rounded-2xl max-w-md mx-auto mb-8 border border-white/10 text-left text-xs text-white/60 space-y-1">
                  <div className="text-white font-medium">Görüşme Öncesi Küçük Bir Hatırlatma:</div>
                  <div>• Görüşme saatinden 5 dk önce sessiz bir ortama geçip kulaklıklarınızı hazırlamanız yeterlidir.</div>
                  <div>• Herhangi bir ön hazırlık yapmanız gerekmez, tamamen samimi bir tanışma alanıdır.</div>
                </div>

                <button
                  id="btn-modal-done"
                  onClick={handleReset}
                  className="liquid-glass px-8 py-3 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer border border-white/20"
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
};
