import React, { useState, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IndexPage } from './pages/Index';
import { BlogPage } from './pages/BlogPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { BlogAdminPage } from './pages/BlogAdminPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Navbar } from './components/Navbar';
import { ConsultationModal } from './components/ConsultationModal';
import { FAQModal } from './components/FAQModal';
import { ThemeProvider } from './context/ThemeContext';
import type { BlogPost } from './types';
import { blogService } from './services/blogService';
import { authService } from './services/authService';
import './styles/blog.css';
import './styles/admin.css';

type CurrentView = 'home' | 'blog-list' | 'blog-detail' | 'blog-admin';

export default function App() {
  const selectionRequest = useRef(0);
  const [navigationError, setNavigationError] = useState('');
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [targetSection, setTargetSection] = useState<string | null>(null);

  // Ensure scroll is at top before any new view paints on screen
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  const handleNavigateHome = (sectionHref?: string) => {
    if (typeof sectionHref === 'string' && sectionHref.startsWith('#')) {
      setTargetSection(sectionHref);
    } else {
      setTargetSection(null);
    }
    selectionRequest.current++;
    setNavigationError('');
    setCurrentView('home');
  };

  const handleNavigateBlog = () => {
    selectionRequest.current++;
    setNavigationError('');
    setCurrentView('blog-list');
  };

  const handleSelectPost = async (post: BlogPost) => {
    const requestId = ++selectionRequest.current;
    setNavigationError('');
    try {
      const latest = await blogService.getPostBySlug(post.slug);
      if (requestId !== selectionRequest.current) return;
      setSelectedPost(latest ?? null);
      setCurrentView('blog-detail');
    } catch (error) {
      if (requestId === selectionRequest.current) setNavigationError(error instanceof Error ? error.message : 'Makale yüklenemedi.');
    }
  };

  const handleNavigateAdmin = async () => {
    try {
      if ((await authService.getSession()).isLoggedIn) setCurrentView('blog-admin');
      else setLoginModalOpen(true);
    } catch (error) { setNavigationError(error instanceof Error ? error.message : 'Oturum kontrol edilemedi.'); }
  };

  return (
    <ThemeProvider>
      {navigationError && <p role="alert" className="fixed top-24 inset-x-4 z-50 bg-red-950 text-white p-4 rounded-xl">{navigationError}</p>}
      {currentView !== 'blog-admin' && (
        <Navbar
          onOpenBooking={() => setBookingModalOpen(true)}
          onNavigateHome={handleNavigateHome}
          onNavigateBlog={handleNavigateBlog}
        />
      )}

      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }}
      >
        {currentView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <IndexPage
              onNavigateBlog={handleNavigateBlog}
              onSelectPost={handleSelectPost}
              onOpenLogin={() => setLoginModalOpen(true)}
              onNavigateHome={handleNavigateHome}
              targetSection={targetSection}
            />
          </motion.div>
        )}

        {currentView === 'blog-list' && (
          <motion.div
            key="blog-list"
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <BlogPage
              onSelectPost={handleSelectPost}
              onOpenBooking={handleNavigateHome}
              onNavigateHome={handleNavigateHome}
              onNavigateAdmin={handleNavigateAdmin}
              onOpenLogin={() => setLoginModalOpen(true)}
            />
          </motion.div>
        )}

        {currentView === 'blog-detail' && (
          <motion.div
            key={`blog-detail-${selectedPost?.id || 'post'}`}
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <BlogDetailPage
              post={selectedPost}
              onNavigateBack={handleNavigateBlog}
              onOpenBooking={handleNavigateHome}
              onSelectPost={handleSelectPost}
              onNavigateHome={handleNavigateHome}
            />
          </motion.div>
        )}

        {currentView === 'blog-admin' && (
          <motion.div
            key="blog-admin"
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <BlogAdminPage
              onNavigateHome={handleNavigateHome}
              onNavigateBlog={handleNavigateBlog}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          setLoginModalOpen(false);
          setCurrentView('blog-admin');
        }}
      />

      <ConsultationModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onOpenFAQ={() => setFaqModalOpen(true)}
        initialTopic="netlik"
      />

      <FAQModal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
        onOpenBooking={() => setBookingModalOpen(true)}
      />
    </ThemeProvider>
  );
}
