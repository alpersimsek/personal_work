import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Award, HeartHandshake, Compass } from 'lucide-react';
import coachPhotoDefault from '../assets/profil_test.jpg';

export const CoachProfileSection: React.FC = () => {
  return (
    <section id="hakkimda-koc" className="bg-black py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Main 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Portrait and credentials badge */}
          <div className="lg:col-span-5 relative">
            <div className="liquid-glass rounded-3xl overflow-hidden aspect-[4/5] max-w-md mx-auto lg:max-w-none border border-white/15 shadow-2xl relative group bg-neutral-950">
              {/* Coach Portrait Image */}
              <img
                src={coachPhotoDefault || '/profil_test.jpg'}
                alt="ICF Akredite Yaşam Koçu"
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 contrast-105 brightness-95"
                referrerPolicy="no-referrer"
              />
              
              {/* Subtle ambient gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Floating Credential Tag */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 liquid-glass rounded-2xl p-3.5 sm:p-4 border border-white/20 bg-black/70 backdrop-blur-md z-10 pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <Award size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-mono">
                      PROFESYONEL AKREDİTASYON
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-white">
                      ICF Akredite Profesyonel Koç & Mindfulness Eğitmeni
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Core Ethics */}
          <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-8 text-left">
            <div>
              <div className="text-white/40 text-xs sm:text-sm tracking-[0.25em] uppercase font-medium mb-3 flex items-center gap-2">
                <Compass size={15} className="text-white/60" />
                <span>KOÇUN HİKAYESİ & YAKLAŞIMI</span>
              </div>
              <h2 className="serif-font text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15] mb-5 sm:mb-6">
                "Cevapları sana vermek için değil, senin zaten bildiklerini hatırlatmak için buradayım."
              </h2>
              <p className="text-white/70 text-sm sm:text-base md:text-lg leading-relaxed font-light mb-4">
                Kurumsal liderlik, derin mindfulness pratikleri ve ICF onaylı koçluk metodolojilerini harmanlayarak danışanlarıma güvenli, şeffaf ve telaşsız bir keşif alanı sunuyorum.
              </p>
              <p className="text-white/50 text-xs sm:text-sm sm:text-base leading-relaxed font-light">
                Her seansı; yargılanma korkusunun olmadığı, kendi doğrularını korkmadan masaya yatırabileceğin ve düşünceden kalıcı eylemlere adım atabileceğin bir duraklama alanı olarak görüyorum.
              </p>
            </div>

            {/* Ethics & Principles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-4 border-t border-white/10">
              <div className="liquid-glass rounded-2xl p-4 sm:p-5 border border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-2.5 text-white text-sm font-medium mb-1.5">
                  <ShieldCheck size={18} className="text-white/80 shrink-0" />
                  <span>%100 Gizlilik & Güven</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed font-light">
                  Tüm seans içerikleri ve paylaşımlar ICF etik standartları kapsamında kesin gizlilik altındadır.
                </p>
              </div>

              <div className="liquid-glass rounded-2xl p-4 sm:p-5 border border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-2.5 text-white text-sm font-medium mb-1.5">
                  <HeartHandshake size={18} className="text-white/80 shrink-0" />
                  <span>Yargısız & Eşlikçi Alan</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed font-light">
                  Tavsiye vermek yerine kendi sezgilerini güçlendiren derinlikli soru ve içgörü alanı.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
