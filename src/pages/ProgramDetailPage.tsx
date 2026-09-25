import React, { useLayoutEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Footer } from '../components/Footer';
import {
  COACHING_DISCLAIMER,
  PROCESS_STEPS,
  PROGRAMS,
  type Program,
} from '../../server/content/programs';
import { followInPage } from '../utils/followInPage';
import { navigateToPath } from '../routes';

interface ProgramDetailPageProps {
  program: Program;
  onNavigateHome: (sectionHref?: string) => void;
  onNavigateBlog: () => void;
  /** Opens the booking window with this program's topic selected. */
  onOpenBooking: (topic?: Program['topic']) => void;
}

const List: React.FC<{ items: readonly string[] }> = ({ items }) => (
  <ul className="space-y-3">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-3 text-white/80 text-base sm:text-lg font-light leading-relaxed">
        <Check size={18} className="mt-1.5 shrink-0 text-white/50" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/** One coaching area in full, at /programlar/<konu>. */
export const ProgramDetailPage: React.FC<ProgramDetailPageProps> = ({
  program,
  onNavigateHome,
  onNavigateBlog,
  onOpenBooking,
}) => {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [program.slug]);

  const others = PROGRAMS.filter((other) => other.slug !== program.slug);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col w-full font-sans">
      <main className="flex-1 pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <nav aria-label="Konum" className="mb-8 text-xs sm:text-sm text-white/50 flex flex-wrap items-center gap-x-2">
          <a href="/" onClick={followInPage(() => onNavigateHome())} className="hover:text-white/80">Ana Sayfa</a>
          <span aria-hidden="true">›</span>
          <a href="/programlar" onClick={followInPage(() => navigateToPath('/programlar'))} className="hover:text-white/80">Programlar</a>
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="text-white/70">{program.title}</span>
        </nav>

        <header className="mb-12">
          <p className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold mb-4">{program.tag}</p>
          <h1 className="serif-font text-4xl sm:text-6xl font-light tracking-tight leading-[1.1] mb-6">{program.title}</h1>
          <p className="text-white/80 text-lg sm:text-xl font-light leading-relaxed">{program.description}</p>
        </header>

        <section className="mb-12" aria-labelledby="for-whom">
          <h2 id="for-whom" className="serif-font text-2xl sm:text-3xl tracking-tight mb-5">Bu alan kimler için?</h2>
          <List items={program.forWhom} />
        </section>

        <section className="mb-12" aria-labelledby="what-we-do">
          <h2 id="what-we-do" className="serif-font text-2xl sm:text-3xl tracking-tight mb-5">Birlikte neler yaparız?</h2>
          <List items={program.whatWeDo} />
        </section>

        <section className="mb-12" aria-labelledby="process">
          <h2 id="process" className="serif-font text-2xl sm:text-3xl tracking-tight mb-5">Süreç nasıl işler?</h2>
          <ol className="space-y-5">
            {PROCESS_STEPS.map((step) => (
              <li key={step.number} className="flex gap-4">
                <span className="serif-font text-2xl text-white/40 tabular-nums shrink-0">{step.number}</span>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                  <p className="text-white/70 text-base font-light leading-relaxed">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="liquid-glass rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 mb-12 text-center">
          <h2 className="serif-font text-2xl sm:text-3xl tracking-tight mb-3">Bu alanda görüşme başlat</h2>
          <p className="text-white/70 text-base font-light leading-relaxed mb-6">
            30 dakikalık bir tanışma görüşmesiyle bulunduğun noktayı ve beklentilerini konuşalım.
          </p>
          <button onClick={() => onOpenBooking(program.topic)} className="btn btn-primary btn-lg">
            <span>Görüşme planla</span>
            <ArrowRight size={18} className="btn-arrow" />
          </button>
        </section>

        <section className="mb-10" aria-labelledby="other-areas">
          <h2 id="other-areas" className="serif-font text-2xl tracking-tight mb-4">Diğer koçluk alanları</h2>
          <ul className="space-y-2">
            {others.map((other) => (
              <li key={other.slug}>
                <a
                  href={`/programlar/${other.slug}`}
                  onClick={followInPage(() => navigateToPath(`/programlar/${other.slug}`))}
                  className="btn btn-link text-base"
                >
                  {other.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-white/40 text-xs leading-relaxed">{COACHING_DISCLAIMER}</p>
      </main>

      <Footer onOpenBooking={() => onOpenBooking()} onNavigateHome={onNavigateHome} onNavigateBlog={onNavigateBlog} />
    </div>
  );
};
