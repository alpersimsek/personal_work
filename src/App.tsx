import React, { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react';
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
import { parseRoute, pathForRoute, type Route } from './routes';
import './styles/blog.css';
import './styles/admin.css';

type CurrentView = Route['view'];

const SITE_TITLE = 'Tuğba Ergüner Şimşek';

export default function App() {
  const initialRoute = useRef(parseRoute(window.location.pathname)).current;
  const selectionRequest = useRef(0);
  const [navigationError, setNavigationError] = useState('');
  const [currentView, setCurrentView] = useState<CurrentView>(initialRoute.view === 'blog-admin' ? 'home' : initialRoute.view);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [postLoading, setPostLoading] = useState(initialRoute.view === 'blog-detail');
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

  /**
   * Shows a route without touching the address bar.
   *
   * Resolves to false when the route could not be shown (missing session,
   * failed request), so callers know not to update the URL.
   */
  const showRoute = useCallback(async (route: Route): Promise<boolean> => {
    const requestId = ++selectionRequest.current;
    const isStale = () => requestId !== selectionRequest.current;
    setNavigationError('');

    switch (route.view) {
      case 'home':
      case 'blog-list':
        setCurrentView(route.view);
        return true;
      case 'blog-detail':
        try {
          const post = await blogService.getPostBySlug(route.slug);
          if (isStale()) return false;
          setSelectedPost(post ?? null);
          setCurrentView('blog-detail');
          return true;
        } catch (error) {
          if (!isStale()) setNavigationError(error instanceof Error ? error.message : 'Makale yüklenemedi.');
          return false;
        } finally {
          setPostLoading(false);
        }
      case 'blog-admin':
        try {
          if (!(await authService.getSession()).isLoggedIn) {
            setLoginModalOpen(true);
            return false;
          }
          if (isStale()) return false;
          setCurrentView('blog-admin');
          return true;
        } catch (error) {
          setNavigationError(error instanceof Error ? error.message : 'Oturum kontrol edilemedi.');
          return false;
        }
    }
  }, []);

  const navigate = useCallback(async (route: Route) => {
    if (!(await showRoute(route))) return;
    const path = pathForRoute(route);
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
  }, [showRoute]);

  // Open the page the address bar points at, and follow back/forward buttons.
  useEffect(() => {
    if (initialRoute.view === 'home' && window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
    void showRoute(initialRoute);
    const handlePopState = () => {
      setTargetSection(null);
      void showRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showRoute, initialRoute]);

  useEffect(() => {
    if (currentView === 'blog-detail' && selectedPost) document.title = `${selectedPost.title} | ${SITE_TITLE}`;
    else if (currentView === 'blog-list') document.title = `Blog | ${SITE_TITLE}`;
    else document.title = SITE_TITLE;
  }, [currentView, selectedPost]);

  const handleNavigateHome = (sectionHref?: string) => {
    setTargetSection(typeof sectionHref === 'string' && sectionHref.startsWith('#') ? sectionHref : null);
    void navigate({ view: 'home' });
  };

  const handleNavigateBlog = () => void navigate({ view: 'blog-list' });

  const handleSelectPost = (post: BlogPost) => void navigate({ view: 'blog-detail', slug: post.slug });

  const handleNavigateAdmin = () => void navigate({ view: 'blog-admin' });

  const handleCloseLogin = () => {
    setLoginModalOpen(false);
    if (window.location.pathname === '/admin' && currentView !== 'blog-admin') {
      window.history.replaceState(null, '', '/');
    }
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

        {currentView === 'blog-detail' && !postLoading && (
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
        onClose={handleCloseLogin}
        onSuccess={() => {
          setLoginModalOpen(false);
          void navigate({ view: 'blog-admin' });
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
