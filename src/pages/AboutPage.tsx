import React, { useLayoutEffect } from 'react';
import { Footer } from '../components/Footer';
import { CoachProfileSection } from '../components/CoachProfileSection';

interface AboutPageProps {
  onNavigateHome: (sectionHref?: string) => void;
  onNavigateBlog: () => void;
  onOpenBooking: () => void;
}

/** The coach's full story and approach, at /hakkimda. The home page shows a short version. */
export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateHome, onNavigateBlog, onOpenBooking }) => {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col w-full font-sans">
      <main className="flex-1 pt-20 sm:pt-24">
        <CoachProfileSection asPage />
      </main>
      <Footer onOpenBooking={onOpenBooking} onNavigateHome={onNavigateHome} onNavigateBlog={onNavigateBlog} />
    </div>
  );
};
