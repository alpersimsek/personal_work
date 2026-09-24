import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Sparkles, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { ReflectionQuestion, ReflectionResult } from '../types';

const QUESTIONS: ReflectionQuestion[] = [
  {
    id: 1,
    question: 'Şu sıralar günlerini yaşarken kendini en çok nasıl hissediyorsun?',
    subtitle: 'İlk aklına gelen, en dürüst hissi seç.',
    options: [
      {
        label: 'Sürekli bir şeylere yetişmeye çalışıyor ama nereye gittiğimi bilmiyorum.',
        description: 'Zihnim dolu, önceliklerim belirsiz ve yön duygumu kaybettim.',
        focus: 'netlik',
      },
      {
        label: 'Ne yapmam gerektiğini biliyorum ama bir türlü başlayamıyor veya devam ettiremiyorum.',
        description: 'Düşüncelerde çok kalıyorum, eyleme geçişte tıkanıklık yaşıyorum.',
        focus: 'donusum',
      },
      {
        label: 'Dışarıdan her şey yolunda görünüyor ama içimde bana ait olmayan bir tempo var.',
        description: 'Tükenmişlik ve kendi ihtiyaçlarımı erteleme hissi ağır basıyor.',
        focus: 'denge',
      },
    ],
  },
  {
    id: 2,
    question: 'Hayatında en çok neyin değişmesini isterdin?',
    subtitle: 'Şu an seni en çok ferahlatacak şey ne olurdu?',
    options: [
      {
        label: 'Gereksiz karmaşayı temizleyip gerçek değerlerimi ve yolumu netleştirmek.',
        description: 'Kararsızlıktan çıkmak ve içimdeki şüpheleri susturmak.',
        focus: 'netlik',
      },
      {
        label: 'Tekrar eden döngülerimi kırıp sürdürülebilir, sakin alışkanlıklar edinmek.',
        description: 'Ertelemeyi bırakıp kendime verdiğim sözleri tutabilmek.',
        focus: 'donusum',
      },
      {
        label: 'İç sesimle barışık, daha telaşsız ve bana ait bir yaşam ritmi kurmak.',
        description: 'Başkalarının beklentileri yerine kendi sınırlarıma sahip çıkmak.',
        focus: 'denge',
      },
    ],
  },
  {
    id: 3,
    question: 'Bir koçluk yolculuğundan en temel beklentin nedir?',
    subtitle: 'Bu süreç sana ne kazandırmalı?',
    options: [
      {
        label: 'Güçlü sorularla kendi iç sesimi duymak ve net bir pusula kazanmak.',
        description: 'Zihinsel berraklık ve doğru karar alma güveni.',
        focus: 'netlik',
      },
      {
        label: 'Beni geride tutan inançları dönüştürüp somut adımlar atmak.',
        description: 'Düşünceden eyleme geçen sürdürülebilir disiplin.',
        focus: 'donusum',
      },
      {
        label: 'Tüm bu süreci güvenli, yargısız ve samimi bir alanda birlikte yürümek.',
        description: 'Kendi ritminde derinleşen içsel bir dönüşüm.',
        focus: 'denge',
      },
    ],
  },
];

interface SelfReflectionGuideProps {
  onStartBookingWithTopic: (topic: 'netlik' | 'donusum' | 'diger', note?: string) => void;
}

export const SelfReflectionGuide: React.FC<SelfReflectionGuideProps> = ({
  onStartBookingWithTopic,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<('netlik' | 'donusum' | 'denge')[]>([]);

  const handleSelectOption = (focus: 'netlik' | 'donusum' | 'denge') => {
    const nextAnswers = [...answers, focus];
    setAnswers(nextAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(QUESTIONS.length); // Results screen
    }
  };

  const handleReset = () => {
    setAnswers([]);
    setCurrentStep(0);
  };

  // Compute insight from answers
  const computeResult = (): ReflectionResult => {
    const netlikCount = answers.filter((a) => a === 'netlik').length;
    const donusumCount = answers.filter((a) => a === 'donusum').length;

    if (netlikCount >= 2) {
      return {
        title: 'Önceliğin: Zihinsel Netlik & Yön Bulma',
        insight:
          'Şu an en çok ihtiyaç duyduğun şey daha fazla efor değil; enerjini tüketen gürültüyü sadeleştirmek ve senin için gerçekten neyin önemli olduğunu netleştirmek.',
        recommendedTopic: 'netlik',
        promptQuestion: 'Hangi kararları verirken iç sesini duymakta zorlanıyorsun?',
      };
    } else if (donusumCount >= 2) {
      return {
        title: 'Önceliğin: Düşünceden Eyleme & Sürdürülebilirlik',
        insight:
          'Zihninde hedeflerin var ancak seni aynı döngüde tutan alışkanlık kalıpları eyleme geçmeni zorlaştırıyor. Küçük, zarif ve kalıcı adımlarla dönüşüm tam senin aradığın alan.',
        recommendedTopic: 'donusum',
        promptQuestion: 'Seni en çok ertelemeye iten gizli korku veya inanç ne olabilir?',
      };
    } else {
      return {
        title: 'Önceliğin: Bütünsel Denge & Kendine Dönüş',
        insight:
          'Hem zihinsel berraklığa hem de kendi ritmini korumaya ihtiyaç duyuyorsun. Başkalarının beklentilerinden sıyrılıp sana ait bir yaşam alanı kurmak senin için dönüştürücü olacak.',
        recommendedTopic: 'diger',
        promptQuestion: 'Şu sıralar en çok hangi alanda kendinden ödün veriyorsun?',
      };
    }
  };

  const result = currentStep >= QUESTIONS.length ? computeResult() : null;

  return (
    <section id="ic-kesif" className="bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
              <Timer size={20} />
            </div>
            <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
              3 DAKİKALIK İÇSEL FARKINDALIK
            </span>
          </div>
          <h2 className="serif-font text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15]">
            Şu an hangi aşamadasın?
          </h2>
          <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-3 sm:mt-4 font-light leading-relaxed">
            Doğru ve yanlış yanıt yok. 3 kısa soruyla nerede olduğunu ve koçluğun sana en çok nerede alan açabileceğini gör.
          </p>
        </div>

        {/* Card Container */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-8 md:p-12 border border-white/10 shadow-2xl relative bg-[#0d0d0d]/90 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {currentStep < QUESTIONS.length ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="space-y-8"
              >
                {/* Progress bar & Step indicator */}
                <div className="flex items-center justify-between text-xs sm:text-sm md:text-base text-white/90 pb-4 border-b border-white/10 font-mono font-bold tracking-wider">
                  <span>SORU {currentStep + 1} / 3</span>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-2 w-9 sm:w-12 rounded-full transition-all ${i <= currentStep ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/20'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Question */}
                <div className="text-center sm:text-left">
                  <h3 className="serif-font text-xl sm:text-2xl md:text-3xl text-white tracking-tight mb-2.5">
                    {QUESTIONS[currentStep].question}
                  </h3>
                  <p className="text-white/80 text-sm md:text-base font-light mt-1">
                    {QUESTIONS[currentStep].subtitle}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3.5">
                  {QUESTIONS[currentStep].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt.focus)}
                      className="btn btn-option group"
                    >
                      <div>
                        <div className="text-sm md:text-base font-semibold mb-1.5 leading-snug">
                          {opt.label}
                        </div>
                        <div className="text-sm md:text-base font-normal leading-relaxed mt-1 opacity-75">
                          {opt.description}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-full border border-current/15 group-hover:bg-[var(--btn-solid)] group-hover:text-[var(--btn-solid-fg)] group-hover:border-transparent transition-colors shrink-0 mt-1">
                        <ArrowRight size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-4 space-y-6"
              >
                <div className="inline-flex p-3 rounded-full bg-white/10 border border-white/20 text-white mb-2">
                  <Sparkles size={26} />
                </div>

                <div className="text-xs sm:text-sm uppercase tracking-widest text-white/60 font-medium">
                  SENİN İÇSEL PUSULAN
                </div>

                <h3 className="serif-font text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
                  {result.title}
                </h3>

                <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto font-light">
                  {result.insight}
                </p>

                {/* Reflective prompt quote box */}
                <div className="liquid-glass rounded-2xl p-5 sm:p-7 max-w-lg mx-auto text-left border border-white/15 bg-white/[0.02]">
                  <div className="text-white/50 text-xs sm:text-sm uppercase tracking-wider mb-2 font-mono font-medium">
                    DÜŞÜNMEK İÇİN BİR BAŞLANGIÇ SORUSU:
                  </div>
                  <p className="serif-font text-xl sm:text-2xl text-white/90 italic">
                    "{result.promptQuestion}"
                  </p>
                </div>

                {/* CTA actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    id="btn-reflection-booking"
                    onClick={() =>
                      onStartBookingWithTopic(
                        result.recommendedTopic,
                        `İçsel netlik aracından gelen odak: ${result.title}`
                      )
                    }
                    className="btn btn-primary btn-lg w-full sm:w-auto"
                  >
                    <span>Bu Odakla Ön Görüşme Planla</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={handleReset}
                    className="btn btn-ghost btn-sm"
                  >
                    <RotateCcw size={15} />
                    <span>Yeniden Başlat</span>
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
