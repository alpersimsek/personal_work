import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Award,
  HeartHandshake,
  Compass,
  Briefcase,
  GraduationCap,
  Sparkles,
  UserCheck,
  MessagesSquare,
} from 'lucide-react';

interface CoachProfileSectionProps {
  /** True on its own page (/hakkimda), where the heading is the page's H1. */
  asPage?: boolean;
}

export const CoachProfileSection: React.FC<CoachProfileSectionProps> = ({ asPage = false }) => {
  // On its own page the outline runs h1 > h2 > h3; inside the home page it sits one level lower.
  const Heading = asPage ? 'h1' : 'h2';
  const Sub = asPage ? 'h2' : 'h3';
  const Item = asPage ? 'h3' : 'h4';
  return (
    <section id="hakkimda" className="bg-black py-12 sm:py-16 md:py-20 lg:py-14 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header Title Badge */}
        <div className="text-center mb-8 md:mb-10 lg:mb-8">
          <div className="inline-flex items-center gap-3 mb-4 sm:mb-6 lg:mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
              <MessagesSquare size={20} />
            </div>
            <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
              DANIŞMANLIK & YOL ARKADAŞLIĞI
            </span>
          </div>
          <Heading className="serif-font text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15]">
            Koçun Hikayesi & Yaklaşımı
          </Heading>
        </div>

        {/* Main 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-6 items-stretch">
          
          {/* COLUMN 1: Portrait & Credentials */}
          <div className="relative flex flex-col">
            <div className="liquid-glass rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[4/4.8] lg:aspect-auto h-full min-h-[380px] border border-white/15 shadow-2xl relative group bg-neutral-950 flex flex-col justify-end">
              {/* Coach Portrait Image */}
              <img
                src="/profil.webp"
                alt="ICF Akredite Yaşam Koçu"
                width={1400}
                height={1482}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 contrast-105 brightness-95"
              />
              
              {/* Soft ambient gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

              {/* Floating Credential Tag */}
              <div className="relative bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 liquid-glass rounded-2xl p-4 border border-white/20 bg-black/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <Award size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-white/50 font-mono">
                      AKREDİTASYON
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white">
                      ICF Akredite Profesyonel Koç (PCC)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2 (MIDDLE): Koçun Hikayesi & Kısa Özgeçmiş (Bio) */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 lg:p-5 border border-white/15 bg-white/[0.02] flex flex-col justify-between text-left space-y-6 lg:space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono mb-4 lg:mb-3">
                <UserCheck size={14} className="text-white/80" />
                <span>KOÇUN HİKAYESİ & ÖZGEÇMİŞİ</span>
              </div>

              <Sub className="serif-font text-xl sm:text-2xl lg:text-xl text-white mb-3 lg:mb-2 font-medium leading-snug">
                Kurumsal Dünyadan İçsel Dönüşüme
              </Sub>

              <p className="text-white/70 text-xs sm:text-sm lg:text-[13px] leading-relaxed font-light mb-6 lg:mb-4">
                Finans ve yönetim alanındaki 10+ yıllık kurumsal deneyimimin ardından, sürdürülebilir başarının dışsal hedeflerden önce içsel dinginlikle başladığını fark ettim. Bugün, danışanlarıma zihinsel berraklık ve özgün yaşam ritimleri kurma yolunda eşlik ediyorum.
              </p>

              {/* Resume / Bio Timeline Cards */}
              <div className="space-y-3 lg:space-y-2">
                <div className="p-3.5 lg:p-3 rounded-2xl border border-white/10 bg-white/[0.02] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Briefcase size={15} />
                  </div>
                  <div>
                    <Item className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                      10+ Yıl Kurumsal Deneyim
                    </Item>
                    <p className="text-xs text-white/50 font-light mt-0.5 leading-relaxed">
                      Üst düzey yöneticilik, stratejik liderlik ve takım danışmanlığı birikimi.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 lg:p-3 rounded-2xl border border-white/10 bg-white/[0.02] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <GraduationCap size={15} />
                  </div>
                  <div>
                    <Item className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                      ICF PCC & Mindfulness
                    </Item>
                    <p className="text-xs text-white/50 font-light mt-0.5 leading-relaxed">
                      Uluslararası koçluk akreditasyonu, MBSR eğitmenliği ve 1000+ saat seans.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 lg:p-3 rounded-2xl border border-white/10 bg-white/[0.02] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <Item className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                      Bütüncül Yaşam Metodu
                    </Item>
                    <p className="text-xs text-white/50 font-light mt-0.5 leading-relaxed">
                      Farkındalık, zihinsel netlik ve eyleme dayalı sürdürülebilir gelişim.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 lg:pt-3 border-t border-white/10 text-[11px] text-white/40 font-mono">
              BİREBİR SEANSLAR • YÖNETİCİ KOÇLUĞU • MİNDFULNESS
            </div>
          </div>

          {/* COLUMN 3: Koçun Yaklaşımı & Etik İlkeler */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 lg:p-5 border border-white/15 bg-white/[0.02] flex flex-col justify-between text-left space-y-6 lg:space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono mb-4 lg:mb-3">
                <Compass size={14} className="text-white/80" />
                <span>KOÇLUK YAKLAŞIMI</span>
              </div>

              <blockquote className="serif-font text-lg sm:text-xl lg:text-lg text-white italic leading-snug mb-4 lg:mb-3 border-l-2 border-white/30 pl-4">
                "Cevapları sana vermek için değil, senin zaten bildiklerini hatırlatmak için buradayım."
              </blockquote>

              <p className="text-white/70 text-xs sm:text-sm lg:text-[13px] leading-relaxed font-light mb-6 lg:mb-4">
                Her seansı; yargılanma korkusunun olmadığı, kendi doğrularını masaya yatırabileceğin ve düşüncelerden kalıcı eylemlere adım atabileceğin güvenli bir duraklama alanı olarak tasarlıyorum.
              </p>

              {/* Ethics & Principles Grid */}
              <div className="space-y-3 lg:space-y-2">
                <div className="p-3.5 lg:p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-white text-xs font-medium mb-1">
                    <ShieldCheck size={16} className="text-white/80 shrink-0" />
                    <span>%100 Gizlilik & Etik Standartlar</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-light">
                    Tüm seanslar ICF etik tüzüğü kapsamında tam gizlilik ve güven altındadır.
                  </p>
                </div>

                <div className="p-3.5 lg:p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-white text-xs font-medium mb-1">
                    <HeartHandshake size={16} className="text-white/80 shrink-0" />
                    <span>Yargısız & Eşlikçi Alan</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-light">
                    Tavsiye vermek yerine kendi sezgilerini güçlendiren derinlikli içgörü alanı.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 lg:pt-3 border-t border-white/10 text-[11px] text-white/40 font-mono">
              GÜVENLİ & AÇIK İLETİŞİM • YARGI ALANINDAN UZAK
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

