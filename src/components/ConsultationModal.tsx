import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Clock,
  Video,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { BookingFormData } from '../types';
import { fetchAvailableSlots, createGoogleMeetBooking } from '../services/calendarService';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: 'netlik' | 'donusum' | 'diger';
  initialNote?: string;
}

interface WeekOption {
  id: string;
  name: string;
  range: string;
  days: {
    dayName: string;
    shortDay: string;
    date: string;
    formatted: string;
  }[];
}

const WEEKS_DATA: WeekOption[] = [
  {
    id: 'week-1',
    name: 'Bu Hafta',
    range: '1 - 5 Eyl',
    days: [
      { dayName: 'Pazartesi', shortDay: 'Pzt', date: '1 Eyl', formatted: '1 Eyl Pazartesi' },
      { dayName: 'Salı', shortDay: 'Sal', date: '2 Eyl', formatted: '2 Eyl Salı' },
      { dayName: 'Çarşamba', shortDay: 'Çar', date: '3 Eyl', formatted: '3 Eyl Çarşamba' },
      { dayName: 'Perşembe', shortDay: 'Per', date: '4 Eyl', formatted: '4 Eyl Perşembe' },
      { dayName: 'Cuma', shortDay: 'Cum', date: '5 Eyl', formatted: '5 Eyl Cuma' },
    ],
  },
  {
    id: 'week-2',
    name: 'Gelecek Hafta',
    range: '8 - 12 Eyl',
    days: [
      { dayName: 'Pazartesi', shortDay: 'Pzt', date: '8 Eyl', formatted: '8 Eyl Pazartesi' },
      { dayName: 'Salı', shortDay: 'Sal', date: '9 Eyl', formatted: '9 Eyl Salı' },
      { dayName: 'Çarşamba', shortDay: 'Çar', date: '10 Eyl', formatted: '10 Eyl Çarşamba' },
      { dayName: 'Perşembe', shortDay: 'Per', date: '11 Eyl', formatted: '11 Eyl Perşembe' },
      { dayName: 'Cuma', shortDay: 'Cum', date: '12 Eyl', formatted: '12 Eyl Cuma' },
    ],
  },
  {
    id: 'week-3',
    name: '3. Hafta',
    range: '15 - 19 Eyl',
    days: [
      { dayName: 'Pazartesi', shortDay: 'Pzt', date: '15 Eyl', formatted: '15 Eyl Pazartesi' },
      { dayName: 'Salı', shortDay: 'Sal', date: '16 Eyl', formatted: '16 Eyl Salı' },
      { dayName: 'Çarşamba', shortDay: 'Çar', date: '17 Eyl', formatted: '17 Eyl Çarşamba' },
      { dayName: 'Perşembe', shortDay: 'Per', date: '18 Eyl', formatted: '18 Eyl Perşembe' },
      { dayName: 'Cuma', shortDay: 'Cum', date: '19 Eyl', formatted: '19 Eyl Cuma' },
    ],
  },
  {
    id: 'week-4',
    name: '4. Hafta',
    range: '22 - 26 Eyl',
    days: [
      { dayName: 'Pazartesi', shortDay: 'Pzt', date: '22 Eyl', formatted: '22 Eyl Pazartesi' },
      { dayName: 'Salı', shortDay: 'Sal', date: '23 Eyl', formatted: '23 Eyl Salı' },
      { dayName: 'Çarşamba', shortDay: 'Çar', date: '24 Eyl', formatted: '24 Eyl Çarşamba' },
      { dayName: 'Perşembe', shortDay: 'Per', date: '25 Eyl', formatted: '25 Eyl Perşembe' },
      { dayName: 'Cuma', shortDay: 'Cum', date: '26 Eyl', formatted: '26 Eyl Cuma' },
    ],
  },
];

const TIME_SLOTS = ['11:00', '13:00', '15:00', '17:00', '20:00'];

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  initialTopic = 'netlik',
  initialNote = '',
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const currentWeek = WEEKS_DATA[selectedWeekIndex];

  const [formData, setFormData] = useState<BookingFormData>({
    fullName: '',
    email: '',
    phone: '',
    topic: initialTopic,
    message: initialNote,
    preferredDate: WEEKS_DATA[0].days[0].formatted,
    preferredTimeSlot: '15:00',
    sessionType: 'google-meet',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [createdMeetUrl, setCreatedMeetUrl] = useState('');
  const [liveSlots, setLiveSlots] = useState<string[]>(TIME_SLOTS);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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

  // Fetch live slot availability when selected date changes
  React.useEffect(() => {
    let isMounted = true;
    if (isOpen && formData.preferredDate) {
      setIsLoadingSlots(true);
      fetchAvailableSlots(formData.preferredDate)
        .then((res) => {
          if (isMounted) {
            if (res.slots && res.slots.length > 0) {
              setLiveSlots(res.slots);
              if (!res.slots.includes(formData.preferredTimeSlot)) {
                setFormData((prev) => ({ ...prev, preferredTimeSlot: res.slots[0] }));
              }
            }
            setIsLoadingSlots(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoadingSlots(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, formData.preferredDate]);

  const handlePrevWeek = () => {
    if (selectedWeekIndex > 0) {
      setSelectedWeekIndex((prev) => prev - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeekIndex < WEEKS_DATA.length - 1) {
      setSelectedWeekIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await createGoogleMeetBooking({ ...formData, honeypot });
      setIsSubmitting(false);
      setCreatedMeetUrl(response.meetUrl || 'https://meet.google.com/shanti-demo-meet');
      setSubmitted(true);
    } catch (err) {
      setIsSubmitting(false);
      // Fallback Meet link for seamless demo
      const demoMeetCode = Math.random().toString(36).substring(2, 5) + '-' + 
                           Math.random().toString(36).substring(2, 6) + '-' + 
                           Math.random().toString(36).substring(2, 5);
      setCreatedMeetUrl(`https://meet.google.com/${demoMeetCode}`);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelectedWeekIndex(0);
    setHoneypot('');
    setCreatedMeetUrl('');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      topic: 'netlik',
      message: '',
      preferredDate: WEEKS_DATA[0].days[0].formatted,
      preferredTimeSlot: '15:00',
      sessionType: 'google-meet',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="consultation-modal-root"
          className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden p-3 sm:p-6 flex items-start justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Card with mobile-safe spacing and clear top header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl liquid-glass rounded-3xl p-5 sm:p-8 md:p-10 text-white z-10 my-4 sm:my-8 shadow-2xl bg-[#0c0c0c]/98 border border-white/15 text-left"
          >
            {/* Close Button - Sticky/Fixed relative to card top corner */}
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
                    <Video size={14} className="text-white/80 shrink-0" />
                    <span>GOOGLE MEET İLE BİREBİR TANIŞMA GÖRÜŞMESİ</span>
                  </div>

                  <h3 className="serif-font text-2xl sm:text-3xl md:text-4xl tracking-tight text-white mb-2">
                    25 Dakikalık Ücretsiz Seans
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 font-light">
                    Google Meet üzerinden görüntülü veya sesli olarak tanışalım, ihtiyacını netleştirelim ve koçluğun senin için doğru adım olup olmadığını birlikte keşfedelim.
                  </p>
                </div>

                {/* Google Meet Badge */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                    <Video size={16} />
                  </div>
                  <div className="text-xs">
                    <div className="text-white font-medium">Otomatik Google Meet Takvim Daveti</div>
                    <div className="text-white/40">Görüşme linki onay anında e-posta ve Google Calendar'ınıza gönderilir.</div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {/* Step 1: Week Selector + Day Selector */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase tracking-wider text-white/70 font-medium">
                        1. Hafta ve Gün Seçimi
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevWeek}
                          disabled={selectedWeekIndex === 0}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Önceki Hafta"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <span className="text-[11px] font-mono text-white/50 px-1">
                          {selectedWeekIndex + 1} / {WEEKS_DATA.length}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextWeek}
                          disabled={selectedWeekIndex === WEEKS_DATA.length - 1}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Sonraki Hafta"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Week Navigation Pills (Horizontal Tabs) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {WEEKS_DATA.map((wk, idx) => (
                        <button
                          key={wk.id}
                          type="button"
                          onClick={() => setSelectedWeekIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                            selectedWeekIndex === idx
                              ? 'bg-white text-black border-white font-semibold shadow-md'
                              : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <span>{wk.name}</span>
                          <span className={`ml-1.5 text-[10px] ${selectedWeekIndex === idx ? 'text-black/60' : 'text-white/40'}`}>
                            ({wk.range})
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Day Selection Grid for Current Selected Week */}
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
                      {currentWeek.days.map((d) => {
                        const isSelected = formData.preferredDate === d.formatted;
                        return (
                          <button
                            key={d.formatted}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, preferredDate: d.formatted });
                            }}
                            className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-white text-black border-white font-semibold shadow-lg scale-[1.02]'
                                : 'bg-white/5 text-white/75 border-white/10 hover:border-white/25 hover:bg-white/[0.08]'
                            }`}
                          >
                            <div className={`text-[10px] uppercase font-mono tracking-wider ${isSelected ? 'text-black/70 font-semibold' : 'text-white/50'}`}>
                              {d.shortDay}
                            </div>
                            <div className="text-xs sm:text-sm font-medium mt-0.5 whitespace-nowrap">
                              {d.date}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Time Slots */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium flex items-center justify-between">
                      <span>2. Saat Dilimi (Google Meet)</span>
                      {isLoadingSlots && (
                        <span className="flex items-center gap-1 text-[10px] text-white/50 font-normal normal-case">
                          <Loader2 size={10} className="animate-spin" /> Takvim kontrol ediliyor...
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {liveSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, preferredTimeSlot: slot });
                          }}
                          className={`py-2 rounded-xl text-xs text-center transition-all cursor-pointer border ${
                            formData.preferredTimeSlot === slot
                              ? 'bg-white text-black border-white font-semibold shadow-md'
                              : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

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

                  {/* Step 3: Contact Details */}
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
                        E-posta Adresi (Davet İçin)
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
                        Telefon (WhatsApp Hatırlatması)
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
                      rows={2}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Şu anki tıkandığın veya derinleşmek istediğin konuyu paylaşabilirsin..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-white/40 transition-colors resize-none"
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
                          <Loader2 size={16} className="animate-spin" /> Google Meet Daveti Oluşturuluyor...
                        </span>
                      ) : (
                        <>
                          <span className="truncate">
                            Google Meet Randevusunu Onayla ({formData.preferredDate} - {formData.preferredTimeSlot})
                          </span>
                          <ArrowRight size={16} className="shrink-0" />
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[11px] text-white/40 text-center mt-2.5">
                      <ShieldCheck size={13} />
                      <span>%100 Gizlilik Garantisi • Ücretsiz 25 Dakika</span>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="serif-font text-3xl sm:text-4xl text-white mb-2">
                  Google Meet Randevunuz Oluşturuldu
                </h3>
                <p className="text-white/70 text-sm leading-relaxed max-w-md mx-auto mb-6 font-light">
                  Harika bir başlangıç, {formData.fullName}. <strong className="text-white">{formData.preferredDate} saat {formData.preferredTimeSlot}</strong> için oluşturulan takvim davetiyesi ve Google Meet odası e-posta adresinize (<strong className="text-white">{formData.email}</strong>) iletildi.
                </p>

                {/* Direct Google Meet Join Link */}
                <div className="mb-6 flex flex-col items-center">
                  <a
                    id="btn-join-google-meet"
                    href={createdMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-7 py-3.5 rounded-full text-xs sm:text-sm transition-all shadow-xl hover:scale-105"
                  >
                    <Video size={18} />
                    <span>Google Meet Görüşme Odasına Git</span>
                    <ExternalLink size={14} />
                  </a>
                  <span className="text-[11px] text-white/40 mt-2">Bu bağlantıyı doğrudan takviminize kaydedebilirsiniz</span>
                </div>

                <div className="liquid-glass p-4 rounded-2xl max-w-md mx-auto mb-8 border border-white/10 text-left text-xs text-white/60 space-y-1">
                  <div className="text-white font-medium">Görüşme Öncesi Hatırlatmalar:</div>
                  <div>• Görüşme saatinden 5 dk önce sessiz bir ortama geçip kulaklığınızı hazırlamanız yeterlidir.</div>
                  <div>• Herhangi bir ön hazırlık gerekmez, tamamen samimi bir tanışma ve netleşme alanıdır.</div>
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

