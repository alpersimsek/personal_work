import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { FAQItem } from '../types';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

const FAQS: FAQItem[] = [
  {
    question: 'Yaşam koçluğu ile terapi arasındaki temel fark nedir?',
    answer: 'Terapi genellikle geçmiş travmaların iyileştirilmesine ve psikolojik semptomların tedavisine odaklanır. Yaşam koçluğu ise şu anki bulunduğunuz noktayı dürüstçe değerlendirip geleceğe yönelik netlik, kararlılık ve eylem planı oluşturmayı hedefler. Koçluk tıbbi veya psikiyatrik bir tedavi değildir.',
  },
  {
    question: 'Görüşmeler nasıl ve nerede gerçekleşir?',
    answer: 'Görüşmeler çoğunlukla Google Meet / Zoom üzerinden çevrim içi veya karşılıklı mutabakata göre yüz yüze yapılır. Her seans yaklaşık 50 dakika sürer ve tamamen güvenli, gizli bir alanda gerçekleşir.',
  },
  {
    question: 'Bir koçluk süreci genellikle ne kadar sürer?',
    answer: 'Kişinin ihtiyaçlarına ve hedeflerine bağlı olarak ortalama 6 ila 12 seanslık periyotlar önerilir. Süreç haftada bir veya iki haftada bir yapılan seanslarla ilerler.',
  },
  {
    question: 'İlk tanışma görüşmesinde ne konuşuyoruz?',
    answer: '25 dakikalık ücretsiz tanışma görüşmesinde nerede hissettiğinizi, koçluktan beklentilerinizi ve birlikte çalışmanın aramızdaki enerji ve yöntem açısından uygun olup olmadığını sakin bir şekilde konuşuruz.',
  },
  {
    question: 'Koçluk seanslarında bana ne yapmam gerektiği söylenecek mi?',
    answer: 'Hayır. Koçluk tavsiye ya da talimat vermek değildir. Güçlü ve derinlikli sorularla kendi sezgilerinizi, değerlerinizi ve size özgü en doğru yolları keşfetmenizi sağlar.',
  },
];

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose, onOpenBooking }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="faq-modal-root" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl liquid-glass rounded-3xl p-6 sm:p-10 text-white z-10 my-8 shadow-2xl bg-[#0a0a0a]/95 border border-white/10 max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-white/50 text-xs tracking-widest uppercase">
                <HelpCircle size={16} className="text-white/70" />
                <span>MERAK EDİLENLER</span>
              </div>
              <button
                id="btn-close-faq"
                onClick={onClose}
                className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4">
              <h3 className="text-2xl sm:text-3xl font-serif tracking-tight text-white mb-1">
                Sıkça Sorulan Sorular
              </h3>
              <p className="text-white/60 text-sm">
                Sürece başlamadan önce aklınıza takılabilecek temel noktalar.
              </p>
            </div>

            {/* Accordion List */}
            <div className="overflow-y-auto space-y-3 pr-2 py-2 flex-1">
              {FAQS.map((faq, idx) => {
                const isOpenItem = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-white hover:text-white/90 cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-medium">{faq.question}</span>
                      <ChevronDown
                        size={18}
                        className={`text-white/50 transition-transform duration-300 shrink-0 ${
                          isOpenItem ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpenItem && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 text-sm text-white/60 leading-relaxed border-t border-white/5 pt-3">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA within FAQ */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <p className="text-xs text-white/50 text-center sm:text-left">
                Başka bir sorun mu var? Tanışma görüşmesinde doğrudan konuşabiliriz.
              </p>
              <button
                id="btn-faq-to-booking"
                onClick={() => {
                  onClose();
                  onOpenBooking();
                }}
                className="liquid-glass bg-white text-black hover:bg-white/90 text-xs font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <span>Görüşme Planla</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
