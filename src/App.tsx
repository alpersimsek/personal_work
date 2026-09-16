import React, { useState } from 'react';
import { IndexPage } from './pages/Index';
import { BlogPage } from './pages/BlogPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { BlogAdminPage } from './pages/BlogAdminPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ThemeProvider } from './context/ThemeContext';
import { BlogPost } from './types';
import { authService } from './services/authService';
import './styles/blog.css';
import './styles/admin.css';

type CurrentView = 'home' | 'blog-list' | 'blog-detail' | 'blog-admin';

export default function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleNavigateHome = () => {
    setCurrentView('home');
    window.scrollTo(0, 0);
  };

  const handleNavigateBlog = () => {
    setCurrentView('blog-list');
    window.scrollTo(0, 0);
  };

  const handleSelectPost = (post: BlogPost) => {
    setSelectedPost(post);
    setCurrentView('blog-detail');
    window.scrollTo(0, 0);
  };

  const handleNavigateAdmin = () => {
    if (authService.getSession().isLoggedIn) {
      setCurrentView('blog-admin');
      window.scrollTo(0, 0);
    } else {
      setLoginModalOpen(true);
    }
  };

  return (
    <ThemeProvider>
      {currentView === 'home' && (
        <IndexPage
          onNavigateBlog={handleNavigateBlog}
          onSelectPost={handleSelectPost}
          onOpenLogin={() => setLoginModalOpen(true)}
        />
      )}

      {currentView === 'blog-list' && (
        <BlogPage
          onSelectPost={handleSelectPost}
          onOpenBooking={() => setCurrentView('home')}
          onNavigateHome={handleNavigateHome}
          onNavigateAdmin={handleNavigateAdmin}
          onOpenLogin={() => setLoginModalOpen(true)}
        />
      )}

      {currentView === 'blog-detail' && (
        <BlogDetailPage
          post={selectedPost}
          onNavigateBack={handleNavigateBlog}
          onOpenBooking={() => setCurrentView('home')}
          onSelectPost={handleSelectPost}
        />
      )}

      {currentView === 'blog-admin' && (
        <BlogAdminPage
          onNavigateHome={handleNavigateHome}
          onNavigateBlog={handleNavigateBlog}
        />
      )}

      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          setLoginModalOpen(false);
          setCurrentView('blog-admin');
        }}
      />
    </ThemeProvider>
  );
}
