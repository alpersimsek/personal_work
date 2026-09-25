import React, { useLayoutEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Footer } from '../components/Footer';
import { PROGRAMS } from '../../server/content/programs';
import { followInPage } from '../utils/followInPage';
import { navigateToPath } from '../routes';

interface ProgramsPageProps {
  onNavigateHome: (sectionHref?: string) => void;
  onNavigateBlog: () => void;
  onOpenBooking: () => void;
}

/** The three coaching areas, at /programlar, each leading to its own page. */
export const ProgramsPage: React.FC<ProgramsPageProps> = ({ onNavigateHome, onNavigateBlog, onOpenBooking }) => {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col w-full font-sans">
      <main className="flex-1 pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <header className="text-center mb-10 md:mb-12">
          <p className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold mb-4">KOÇLUK ALANLARI</p>
          <h1 className="serif-font text-3xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.15] mb-4">
            Birlikte neyin üzerinde çalışabiliriz?
          </h1>
          <p className="text-white/70 text-base sm:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Her alan kendi sorusundan başlar. Hangisinin sana yakın olduğunu bilmiyorsan, tanışma görüşmesinde birlikte bakarız.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROGRAMS.map((program) => (
            <article key={program.slug} className="liquid-glass rounded-3xl border border-white/15 bg-white/[0.02] p-6 sm:p-8 flex flex-col">
              <p className="text-white/50 text-xs tracking-[0.2em] uppercase font-semibold mb-3">{program.tag}</p>
              <h2 className="serif-font text-2xl sm:text-3xl tracking-tight mb-3">{program.title}</h2>
              <p className="text-white/75 text-sm sm:text-base font-light leading-relaxed mb-6 flex-1">{program.description}</p>
              <a
                href={`/programlar/${program.slug}`}
                onClick={followInPage(() => navigateToPath(`/programlar/${program.slug}`))}
                className="btn btn-secondary self-start"
              >
                <span>Ayrıntılar</span>
                <ArrowRight size={16} className="btn-arrow" />
              </a>
            </article>
          ))}
        </div>
      </main>

      <Footer onOpenBooking={onOpenBooking} onNavigateHome={onNavigateHome} onNavigateBlog={onNavigateBlog} />
    </div>
  );
};
