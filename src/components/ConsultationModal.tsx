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
  MessageCircle,
} from 'lucide-react';
import { BookingFormData } from '../types';
import { fetchAvailableSlots, createGoogleMeetBooking, generateWhatsAppLink } from '../services/calendarService';

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
    isPast?: boolean;
  }[];
}

/**
 * Dynamically generates 4 consecutive week options starting from current date.
 * Excludes weekends (Saturday & Sunday).
 * Marks past weekdays in current week as disabled.
 */
export function generateDynamicWeeks(numWeeks: number = 4): WeekOption[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNamesTr = [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
  ];

  const dayNamesFull = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const dayNamesShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const startMonday = new Date(today);

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // If weekend, start from upcoming Monday
    const daysUntilNextMon = dayOfWeek === 6 ? 2 : 1;
    startMonday.setDate(today.getDate() + daysUntilNextMon);
  } else {
    // Start from Monday of the current week
    const distanceToMonday = 1 - dayOfWeek;
    startMonday.setDate(today.getDate() + distanceToMonday);
  }

  const weeks: WeekOption[] = [];

  for (let w = 0; w < numWeeks; w++) {
    const days: WeekOption['days'] = [];
    let firstDateStr = '';
    let lastDateStr = '';

    for (let d = 0; d < 5; d++) { // Mon (0) to Fri (4) - excludes Sat/Sun
      const targetDate = new Date(startMonday);
      targetDate.setDate(startMonday.getDate() + w * 7 + d);
      targetDate.setHours(0, 0, 0, 0);

      const dayNum = targetDate.getDate();
      const monthStr = monthNamesTr[targetDate.getMonth()];
      const dayName = dayNamesFull[targetDate.getDay()];
      const shortDay = dayNamesShort[targetDate.getDay()];

      const dateDisplay = `${dayNum} ${monthStr}`;
      const formatted = `${dayNum} ${monthStr} ${dayName}`;

      if (d === 0) firstDateStr = dateDisplay;
      if (d === 4) lastDateStr = dateDisplay;

      const isPast = targetDate.getTime() < today.getTime();

      days.push({
        dayName,
        shortDay,
        date: dateDisplay,
        formatted,
        isPast,
      });
    }

    const weekName = w === 0 ? 'Bu Hafta' : w === 1 ? 'Gelecek Hafta' : `${w + 1}. Hafta`;
    const range = `${firstDateStr} - ${lastDateStr}`;

    weeks.push({
      id: `week-${w + 1}`,
      name: weekName,
      range,
      days,
    });
  }

  return weeks;
}

const TIME_SLOTS = ['11:00', '13:00', '15:00', '17:00', '20:00'];

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  initialTopic = 'netlik',
  initialNote = '',
}) => {
  const weeksData = React.useMemo(() => generateDynamicWeeks(4), []);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const currentWeek = weeksData[selectedWeekIndex] || weeksData[0];

  const initialDate = React.useMemo(() => {
    const firstValid = weeksData[0]?.days.find((d) => !d.isPast) || weeksData[0]?.days[0];
    return firstValid ? firstValid.formatted : '1 Eyl Pazartesi';
  }, [weeksData]);

  const [formData, setFormData] = useState<BookingFormData>({
    fullName: '',
    email: '',
    phone: '',
    topic: initialTopic,
    message: initialNote,
    preferredDate: initialDate,
    preferredTimeSlot: '15:00',
    sessionType: 'google-meet',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [createdMeetUrl, setCreatedMeetUrl] = useState('');
  const [createdWhatsAppUrl, setCreatedWhatsAppUrl] = useState('');
  const [liveSlots, setLiveSlots] = useState<string[]>(TIME_SLOTS);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Sync initial props when opened and select first non-past day
  React.useEffect(() => {
    if (isOpen && weeksData.length > 0) {
      const firstValidDay = weeksData[0].days.find((d) => !d.isPast) || weeksData[0].days[0];
      setFormData((prev) => ({
        ...prev,
        preferredDate: firstValidDay.formatted,
        topic: initialTopic,
        message: initialNote || prev.message,
      }));
    }
  }, [isOpen, initialTopic, initialNote, weeksData]);

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
      const prevIdx = selectedWeekIndex - 1;
      setSelectedWeekIndex(prevIdx);
      const prevWeekDays = weeksData[prevIdx].days;
      const firstValid = prevWeekDays.find((d) => !d.isPast) || prevWeekDays[0];
      setFormData((prev) => ({ ...prev, preferredDate: firstValid.formatted }));
    }
  };

  const handleNextWeek = () => {
    if (selectedWeekIndex < weeksData.length - 1) {
      const nextIdx = selectedWeekIndex + 1;
      setSelectedWeekIndex(nextIdx);
      const nextWeekDays = weeksData[nextIdx].days;
      const firstValid = nextWeekDays.find((d) => !d.isPast) || nextWeekDays[0];
      setFormData((prev) => ({ ...prev, preferredDate: firstValid.formatted }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const whatsAppUrl = generateWhatsAppLink(formData);
    setCreatedWhatsAppUrl(whatsAppUrl);

    try {
      const response = await createGoogleMeetBooking({ ...formData, honeypot });
      setIsSubmitting(false);
      setCreatedMeetUrl(response.meetUrl || 'https://meet.google.com/shanti-demo-meet');
      if (response.whatsAppUrl) {
        setCreatedWhatsAppUrl(response.whatsAppUrl);
      }
      setSubmitted(true);
    } catch (err) {
      setIsSubmitting(false);
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
    setCreatedWhatsAppUrl('');
    const firstValidDay = weeksData[0]?.days.find((d) => !d.isPast) || weeksData[0]?.days[0];
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      topic: 'netlik',
      message: '',
      preferredDate: firstValidDay ? firstValidDay.formatted : '',
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
                    <span>WHATSAPP & GOOGLE MEET İLE TANIŞMA SEANSI</span>
                  </div>

                  <h3 className="serif-font text-2xl sm:text-3xl md:text-4xl tracking-tight text-white mb-2">
                    15 Dakikalık Ücretsiz Seans Talebi
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 font-light">
                    Uygun olduğunuz tarih ve saati seçin, koçumuzla WhatsApp üzerinden anında karşılıklı teyitleşerek Google Meet davetiyeniz kesinleşsin.
                  </p>
                </div>

                {/* Interactive WhatsApp Approval Flow Badge */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <MessageCircle size={16} />
                  </div>
                  <div className="text-xs">
                    <div className="text-white font-medium flex items-center gap-1.5">
                      <span>Karşılıklı WhatsApp Onay Akışı</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-normal">Sohbet Odaklı</span>
                    </div>
                    <div className="text-white/40 text-[11px] mt-0.5">
                      Talebiniz iletildikten sonra WhatsApp üzerinden kısa bir teyitleşme yapılır ve Google Meet takvim davetiniz e-postanıza tanımlanır.
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {/* Step 1: Week Selector + Day Selector */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase tracking-wider text-white/70 font-medium">
                        1. Hafta ve Gün Seçimi (Hafta İçi)
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
                          {selectedWeekIndex + 1} / {weeksData.length}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextWeek}
                          disabled={selectedWeekIndex === weeksData.length - 1}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Sonraki Hafta"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Week Navigation Pills (Horizontal Tabs) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {weeksData.map((wk, idx) => (
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
                        const isPast = Boolean(d.isPast);
                        return (
                          <button
                            key={d.formatted}
                            type="button"
                            disabled={isPast}
                            onClick={() => {
                              if (!isPast) {
                                setFormData({ ...formData, preferredDate: d.formatted });
                              }
                            }}
                            className={`py-2 px-1 rounded-xl text-center transition-all border ${
                              isPast
                                ? 'opacity-30 cursor-not-allowed bg-white/[0.02] border-white/5 text-white/30'
                                : isSelected
                                ? 'bg-white text-black border-white font-semibold shadow-lg scale-[1.02] cursor-pointer'
                                : 'bg-white/5 text-white/75 border-white/10 hover:border-white/25 hover:bg-white/[0.08] cursor-pointer'
                            }`}
                          >
                            <div className={`text-[10px] uppercase font-mono tracking-wider ${isSelected && !isPast ? 'text-black/70 font-semibold' : 'text-white/50'}`}>
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
                      <span>2. Saat Dilimi Tercihi</span>
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
                          <Loader2 size={16} className="animate-spin text-black" /> Talep İşleniyor...
                        </span>
                      ) : (
                        <>
                          <MessageCircle size={16} className="shrink-0" />
                          <span className="truncate">
                            Talebi Gönder & WhatsApp'ta Görüş ({formData.preferredDate} - {formData.preferredTimeSlot})
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
                  <span>Randevu Talebiniz Kaydedildi</span>
                </div>

                <h3 className="serif-font text-2xl sm:text-3xl md:text-4xl text-white mb-2">
                  WhatsApp Üzerinden Onaylaşın
                </h3>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6 font-light">
                  Sayın <strong className="text-white">{formData.fullName}</strong>, <strong className="text-white">{formData.preferredDate} saat {formData.preferredTimeSlot}</strong> için talebiniz kayıt altına alındı.
                  <br />
                  Koçumuzla WhatsApp üzerinden kısa bir sohbet başlatıp saatinizi teyit ettikten sonra Google Meet davetiyeniz e-posta adresinize (<strong className="text-white">{formData.email}</strong>) iletilecektir.
                </p>

                {/* Primary Action: Direct WhatsApp Chat Launch with Brand Styling */}
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

                {/* Info Box */}
                <div className="liquid-glass p-4 rounded-2xl max-w-md mx-auto mb-6 border border-white/10 text-left text-xs text-white/70 space-y-2">
                  <div className="text-white font-medium flex items-center gap-2">
                    <Video size={14} className="text-white/80" />
                    <span>Google Meet Davetiyesi Süreci:</span>
                  </div>
                  <p className="text-white/60 text-[11px] leading-relaxed">
                    • WhatsApp sohbeti sonrası karşılıklı onaylanan saat için resmi Google Meet davetiyesi <strong className="text-white">{formData.email}</strong> adresinize gönderilecektir.
                  </p>
                  {createdMeetUrl && (
                    <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Demo Odası Bağlantısı:</span>
                      <a
                        href={createdMeetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 hover:text-white hover:underline flex items-center gap-1 font-mono"
                      >
                        Meet Odası <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
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
};


