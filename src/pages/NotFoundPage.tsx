import React, { useLayoutEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Footer } from '../components/Footer';

interface NotFoundPageProps {
  onNavigateHome: (sectionHref?: string) => void;
  onNavigateBlog: () => void;
  onOpenBooking: () => void;
}

/** Shown for an address the site does not have. The server answers it with a real 404. */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateHome, onNavigateBlog, onOpenBooking }) => {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col w-full font-sans">
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-16 text-center">
        <p className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold mb-4">404</p>
        <h1 className="serif-font text-4xl sm:text-6xl font-light tracking-tight mb-4">Sayfa bulunamadı</h1>
        <p className="text-white/70 text-base sm:text-lg font-light max-w-md leading-relaxed mb-8">
          Aradığın sayfa taşınmış ya da hiç var olmamış olabilir. Ana sayfadan devam edebilirsin.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button onClick={() => onNavigateHome()} className="btn btn-primary btn-lg">
            <span>Ana sayfaya dön</span>
            <ArrowRight size={18} className="btn-arrow" />
          </button>
          <button onClick={onNavigateBlog} className="btn btn-ghost btn-lg">
            Yazılara göz at
          </button>
        </div>
      </main>

      <Footer onOpenBooking={onOpenBooking} onNavigateHome={onNavigateHome} onNavigateBlog={onNavigateBlog} />
    </div>
  );
};
