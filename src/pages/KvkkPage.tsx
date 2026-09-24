import React, { useLayoutEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';
import { NoticeSections } from '../components/NoticeSections';
import { KVKK_INTRO, KVKK_SECTIONS, KVKK_UPDATED_LABEL, KVKK_VERSION } from '../legal/kvkk';

interface KvkkPageProps {
  onNavigateHome: (sectionHref?: string) => void;
  onOpenBooking: () => void;
  onNavigateBlog: () => void;
}

/** The newsletter privacy notice and consent wording, at /kvkk. */
export const KvkkPage: React.FC<KvkkPageProps> = ({ onNavigateHome, onOpenBooking, onNavigateBlog }) => {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col w-full selection:bg-white/20 font-sans">
      <main className="flex-1 pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <button onClick={() => onNavigateHome('#bulten')} className="btn btn-secondary mb-8">
          <ArrowLeft size={16} className="btn-arrow-back" />
          <span>Ana Sayfaya Dön</span>
        </button>

        <header className="mb-10">
          <h1 className="serif-font text-3xl sm:text-5xl font-light text-white leading-tight tracking-tight mb-4">
            Bülten Aydınlatma Metni ve Açık Rıza Beyanı
          </h1>
          <p className="text-white/50 text-xs sm:text-sm">
            Son güncelleme: {KVKK_UPDATED_LABEL} · Sürüm {KVKK_VERSION}
          </p>
        </header>

        <NoticeSections intro={KVKK_INTRO} sections={KVKK_SECTIONS} />
      </main>

      <Footer onOpenBooking={onOpenBooking} onNavigateHome={onNavigateHome} onNavigateBlog={onNavigateBlog} />
    </div>
  );
};
