import React from 'react';
import { ArrowRight, Award, MessagesSquare } from 'lucide-react';
import { COACH } from '../../server/seo/homeContent';
import { followInPage } from '../utils/followInPage';
import { navigateToPath } from '../routes';

const ABOUT_PATH = '/hakkimda';

/** The home page's short version of the coach's story; the full one lives at /hakkimda. */
export const AboutSummary: React.FC = () => (
  <section id="hakkimda" className="bg-black py-12 sm:py-16 md:py-20 lg:py-14 px-4 sm:px-6 relative overflow-hidden">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8 md:mb-10 lg:mb-8">
        <div className="inline-flex items-center gap-3 mb-4 sm:mb-6 lg:mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
            <MessagesSquare size={20} />
          </div>
          <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
            DANIŞMANLIK & YOL ARKADAŞLIĞI
          </span>
        </div>
        <h2 className="serif-font text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15]">
          {COACH.heading}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-stretch">
        <div className="lg:col-span-2 liquid-glass rounded-3xl overflow-hidden aspect-[4/4.4] lg:aspect-auto min-h-[320px] border border-white/15 shadow-2xl relative group bg-neutral-950 flex flex-col justify-end">
          <img
            src="/profil.webp"
            alt="ICF Akredite Yaşam Koçu"
            width={1400}
            height={1482}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 contrast-105 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
          <div className="relative m-4 sm:m-6 liquid-glass rounded-2xl p-4 border border-white/20 bg-black/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                <Award size={20} />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-white/50 font-mono">AKREDİTASYON</div>
                <div className="text-xs sm:text-sm font-semibold text-white">ICF Akredite Profesyonel Koç (PCC)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 liquid-glass rounded-3xl p-6 sm:p-8 border border-white/15 bg-white/[0.02] flex flex-col justify-center text-left">
          <h3 className="serif-font text-xl sm:text-2xl text-white mb-3 font-medium leading-snug">{COACH.storyTitle}</h3>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed font-light mb-6">{COACH.story}</p>
          <blockquote className="serif-font text-lg sm:text-xl text-white italic leading-snug mb-8 border-l-2 border-white/30 pl-4">
            "{COACH.quote}"
          </blockquote>
          <div>
            <a
              href={ABOUT_PATH}
              onClick={followInPage(() => navigateToPath(ABOUT_PATH))}
              className="btn btn-secondary"
            >
              <span>Hikâyemin tamamını oku</span>
              <ArrowRight size={16} className="btn-arrow" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);
