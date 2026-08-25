import React, { useState } from 'react';
import { HeroSection } from '../components/HeroSection';
import { MindfulPause } from '../components/MindfulPause';
import { SelfReflectionGuide } from '../components/SelfReflectionGuide';
import { CoachProfileSection } from '../components/CoachProfileSection';
import { AboutSection } from '../components/AboutSection';
import { FeaturedVideoSection } from '../components/FeaturedVideoSection';
import { PhilosophySection } from '../components/PhilosophySection';
import { ServicesSection } from '../components/ServicesSection';
import { ReflectionsSection } from '../components/ReflectionsSection';
import { ProcessSection } from '../components/ProcessSection';
import { PersonalMessageSection } from '../components/PersonalMessageSection';
import { FinalCTASection } from '../components/FinalCTASection';
import { Footer } from '../components/Footer';
import { ConsultationModal } from '../components/ConsultationModal';
import { FAQModal } from '../components/FAQModal';

export const IndexPage: React.FC = () => {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<'netlik' | 'donusum' | 'diger'>('netlik');
  const [bookingNote, setBookingNote] = useState<string>('');

  const handleOpenBooking = (topic?: 'netlik' | 'donusum' | 'diger', note?: string) => {
    if (topic) {
      setSelectedTopic(topic);
    }
    if (note) {
      setBookingNote(note);
    } else {
      setBookingNote('');
    }
    setBookingModalOpen(true);
  };

  const handleSelectServiceTopic = (topic: 'netlik' | 'donusum') => {
    setSelectedTopic(topic);
    setBookingNote('');
    setBookingModalOpen(true);
  };

  return (
    <div className="bg-black text-white min-h-screen selection:bg-white/20 selection:text-white flex flex-col w-full overflow-x-hidden">
      {/* 1. Hero Section */}
      <HeroSection onOpenBooking={() => handleOpenBooking('netlik')} />

      {/* 2. Feature 2: "Bir Dakikalık Duraklama" (Mindful Ambient Pause) */}
      <MindfulPause />

      {/* 3. Feature 1: 3 Soruluk İnteraktif İçsel Netlik Rehberi */}
      <SelfReflectionGuide onStartBookingWithTopic={handleOpenBooking} />

      {/* 4. Feature 5: Koç Hakkında & ICF Etik Değerleri */}
      <CoachProfileSection />

      {/* 5. Transformation Overview */}
      <AboutSection />

      {/* 6. Featured Coaching Approach Section */}
      <FeaturedVideoSection onOpenBooking={() => handleOpenBooking('netlik')} />

      {/* 7. Philosophy (Farkındalık × Eylem) Section */}
      <PhilosophySection />

      {/* 8. Coaching Areas (Services) Section */}
      <ServicesSection onSelectTopic={handleSelectServiceTopic} />

      {/* 9. Feature 3: Danışan Dönüşüm Notları (Client Reflections) */}
      <ReflectionsSection />

      {/* 10. Coaching Process Section */}
      <ProcessSection />

      {/* 11. Personal Message Section */}
      <PersonalMessageSection onOpenBooking={() => handleOpenBooking('netlik')} />

      {/* 12. Final CTA Section */}
      <FinalCTASection
        onOpenBooking={() => handleOpenBooking('netlik')}
        onOpenFAQ={() => setFaqModalOpen(true)}
      />

      {/* Footer */}
      <Footer onOpenBooking={() => handleOpenBooking('netlik')} />

      {/* Feature 4: Interactive Google Meet Consultation & Slot Selection Modal */}
      <ConsultationModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialTopic={selectedTopic}
        initialNote={bookingNote}
      />

      {/* Frequently Asked Questions Modal */}
      <FAQModal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
        onOpenBooking={() => handleOpenBooking('netlik')}
      />
    </div>
  );
};
