import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory } from '../types';
import { blogService, formatCoverImage } from '../services/blogService';
import { authService } from '../services/authService';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { BlogBackupControls } from '../components/BlogBackupControls';
import { BrandLogo } from '../components/BrandLogo';

interface BlogAdminPageProps {
  onNavigateHome: () => void;
  onNavigateBlog: () => void;
}

const CATEGORIES: BlogCategory[] = [
  'Farkındalık',
  'Dönüşüm',
  'Kariyer & Liderlik',
  'İlişkiler',
  'İçsel Netlik',
];

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80';

export const BlogAdminPage: React.FC<BlogAdminPageProps> = ({
  onNavigateHome,
  onNavigateBlog,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BlogCategory>('Farkındalık');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('5 dk okuma');
  const [coverImage, setCoverImage] = useState('');
  const [isFormattingImage, setIsFormattingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.scrollTo(0, 0);
    authService.getSession().then(session => {
      if (!cancelled) {
        setIsLoggedIn(session.isLoggedIn);
        if (session.isLoggedIn) void refreshPosts().catch(showError);
      }
    }).catch(error => { if (!cancelled) showError(error); })
      .finally(() => { if (!cancelled) setSessionLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const showError = (error: unknown) => {
    setStatusNotice({ type: 'error', text: error instanceof Error ? error.message : 'Bir hata oluştu.' });
  };
  const refreshPosts = async () => {
    setPosts(await blogService.getAllPosts());
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusNotice({ type: 'error', text: 'Lütfen geçerli bir resim dosyası seçin (PNG, JPG, WebP).' });
      return;
    }

    try {
      setIsFormattingImage(true);
      const formattedBase64 = await formatCoverImage(file, 1200, 675, 0.82);
      setCoverImage(formattedBase64);
      setStatusNotice({ type: 'success', text: 'Görsel yüklendi ve 16:9 HD (1200x675px) olarak otomatik formatlandı!' });
    } catch {
      setStatusNotice({ type: 'error', text: 'Görsel işlenirken bir hata oluştu.' });
    } finally {
      setIsFormattingImage(false);
    }
  };

  const handleStartNewPost = () => {
    setEditingPost(null);
    setTitle('');
    setCategory('Farkındalık');
    setSummary('');
    setContent('');
    setReadTime('5 dk okuma');
    setCoverImage('');
    setShowUrlInput(false);
    setTagsInput('Yaşam Koçluğu, Farkındalık');
    setPublished(true);
    setFeatured(false);
    setStatusNotice(null);
    setActiveTab('editor');
  };

  const handleStartEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setCategory(post.category);
    setSummary(post.summary);
    setContent(post.content);
    setReadTime(post.readTime);
    setCoverImage(post.coverImage);
    setShowUrlInput(false);
    setTagsInput(post.tags ? post.tags.join(', ') : '');
    setPublished(post.published);
    setFeatured(post.featured || false);
    setStatusNotice(null);
    setActiveTab('editor');
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!title.trim() || !content.trim()) {
      setStatusNotice({ type: 'error', text: 'Lütfen başlık ve içerik alanlarını doldurun.' });
      return;
    }
    setSaving(true);
    const data = { title, category, summary, content, readTime, coverImage: coverImage.trim() || DEFAULT_COVER_IMAGE,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean), published, featured };
    try {
      if (editingPost) {
        const updated = await blogService.updatePost(editingPost.id, data);
        if (!updated) throw new Error('Makale bulunamadı.');
      } else {
        await blogService.createPost(data);
      }
      await refreshPosts();
      setActiveTab('list');
      setStatusNotice({ type: 'success', text: editingPost ? 'Makale başarıyla güncellendi!' : 'Yeni makale kaydedildi!' });
    } catch (error) { showError(error); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, postTitle: string) => {
    if (!window.confirm(`"${postTitle}" başlıklı makaleyi silmek istediğinize emin misiniz?`)) return;
    try {
      if (!await blogService.deletePost(id)) throw new Error('Makale bulunamadı.');
      await refreshPosts();
    } catch (error) { showError(error); }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await blogService.togglePublish(id);
      await refreshPosts();
    } catch (error) { showError(error); }
  };

  const handleLogout = async () => {
    try { await authService.logout(); setIsLoggedIn(false); }
    catch (error) { showError(error); }
  };

  if (sessionLoading) return <p role="status" className="p-12">Oturum kontrol ediliyor…</p>;

  if (!isLoggedIn) {
    return (
      <div className="admin-scope bg-[#FAF9F5] text-neutral-900 min-h-screen flex flex-col justify-center items-center p-4">
        <AdminLoginModal
          isOpen={true}
          onClose={onNavigateHome}
          onSuccess={() => {
            setIsLoggedIn(true);
            void refreshPosts().catch(showError);
          }}
        />
      </div>
    );
  }

  return (
    <div className="admin-scope bg-[#FAF9F5] text-neutral-900 min-h-screen flex flex-col w-full selection:bg-neutral-900 selection:text-white font-sans">
      {activeTab === 'list' && statusNotice && <p role={statusNotice.type === 'error' ? 'alert' : 'status'} className="p-4">{statusNotice.text}</p>}
      {/* Pristine Light Luxury Top Navigation Header */}
      <header className="border-b border-neutral-200 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-5">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-xl bg-neutral-100 text-neutral-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Ana Sayfaya Dön"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Ana Sayfa</span>
          </button>

          {/* Brand Logo rendered in sharp contrast Light Mode (isDark=false) */}
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showSubtitle={true} isDark={false} />
            <span className="hidden md:inline-block text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
              Yazar Paneli
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBlog}
            className="px-3.5 py-2 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-800 border border-neutral-200 cursor-pointer"
          >
            Blog Sayfası
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Çıkış</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-5xl mx-auto w-full py-8 px-4 sm:px-6">
        {/* Workspace Navigation Tabs */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-stone-200 text-stone-900 border border-stone-300 shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 font-semibold'
              }`}
            >
              Makale Arşivi ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-stone-200 text-stone-900 border border-stone-300 shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 font-semibold'
              }`}
            >
              {editingPost ? 'Makaleyi Düzenle' : 'Yeni Makale Yaz'}
            </button>
          </div>

          {activeTab === 'list' && (
            <button
              onClick={handleStartNewPost}
              className="px-5 py-2.5 rounded-xl bg-stone-200 text-stone-900 text-xs font-bold border border-stone-300 flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Yeni Makale Yaz</span>
            </button>
          )}
        </div>

        {activeTab === 'list' && <BlogBackupControls disabled={saving} onRestored={async () => {
          await refreshPosts();
          handleStartNewPost();
          setActiveTab('list');
        }} />}

        {/* Content Views */}
        {activeTab === 'list' ? (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 bg-white rounded-2xl border border-neutral-200">
                <p>Henüz kayıtlı makale bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-20 h-20 rounded-xl object-cover border border-neutral-200 shrink-0 shadow-inner"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                            {post.category}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                              post.published
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {post.published ? 'Yayında' : 'Taslak'}
                          </span>
                          {post.featured && (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Öne Çıkan
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-semibold text-neutral-900 line-clamp-1">{post.title}</h4>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1 font-sans">{post.summary}</p>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2 font-mono">
                          <span>{post.date}</span>
                          <span>•</span>
                          <span>{post.readTime}</span>
                          <span>•</span>
                          <span>{post.views || 0} Görüntülenme</span>
                          <span>•</span>
                          <span>{post.likes || 0} Beğeni</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleTogglePublish(post.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                          post.published
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {post.published ? 'Taslağa Al' : 'Yayınla'}
                      </button>

                      <button
                        onClick={() => handleStartEdit(post)}
                        className="px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-800 text-xs border border-neutral-200 font-semibold cursor-pointer"
                      >
                        Düzenle
                      </button>

                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                        title="Sil"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Pristine Paper-Style Luxury Article Editor */
          <form onSubmit={handleSavePost} className="space-y-6 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-sm">
            {statusNotice && (
              <div
                className={`p-4 rounded-xl text-xs text-center border font-semibold ${
                  statusNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {statusNotice.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wider">
                  Makale Başlığı *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Örn: Bulanıklıktan Netliğe: Karar Alma Süreçleri"
                  className="w-full px-4 py-3 bg-[#F8F8F9] border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm sm:text-base font-medium focus:bg-white focus:text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wider">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BlogCategory)}
                  className="w-full px-4 py-3 bg-[#F8F8F9] border border-neutral-300 rounded-xl text-neutral-900 text-sm font-medium focus:bg-white focus:text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-white text-neutral-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wider">
                Kısa Özet (Kartta görünecek metin)
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Makalenizin 1-2 cümlelik dikkat çekici özeti..."
                className="w-full px-4 py-3 bg-[#F8F8F9] border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:bg-white focus:text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 resize-none transition-all"
              />
            </div>

            {/* Cover Image Upload & Auto-Formatting Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Kapak Görseli (16:9 Standart Ölçü - 1200x675px)
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] font-semibold text-stone-600 underline cursor-pointer"
                >
                  {showUrlInput ? 'Dosya Yükleme Moduna Dön' : 'veya Görsel Bağlantısı (URL) Gir'}
                </button>
              </div>

              {showUrlInput ? (
                <div>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 bg-[#F8F8F9] border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:bg-white focus:text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Harici web adresi girildiğinde otomatik kırpma uygulanmaz.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* File Upload Zone / Preview Card */}
                  {coverImage ? (
                    <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-50 p-4 flex flex-col sm:flex-row items-center gap-4">
                      {/* 16:9 Aspect Ratio Preview Container */}
                      <div className="relative w-full sm:w-56 aspect-[16/9] rounded-xl overflow-hidden border border-stone-200 bg-stone-200 shrink-0 shadow-inner">
                        <img
                          src={coverImage}
                          alt="Kapak Görseli Önizleme"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-stone-900/75 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                          16:9 Formatlı
                        </div>
                      </div>

                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Formatlandı: 1200 x 675px
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-700">
                            JPEG Sıkıştırılmış
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 font-medium">
                          Görsel makale kartları ve detay sayfasına tam uyumlu olarak depolanmaya hazır.
                        </p>

                        <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                          <label className="px-3.5 py-1.5 rounded-xl bg-stone-200 text-stone-900 text-xs font-bold border border-stone-300 cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Farklı Resim Seç</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setCoverImage('')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 cursor-pointer"
                          >
                            Görseli Kaldır
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="relative border-2 border-dashed border-stone-300 bg-stone-50/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />

                      {isFormattingImage ? (
                        <div className="flex flex-col items-center gap-2 py-4 text-stone-700">
                          <svg className="animate-spin w-8 h-8 text-stone-800" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-xs font-bold">Görsel İşleniyor ve Formatlanıyor (16:9 1200x675px)...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 mb-3 shadow-xs">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-stone-900 mb-1">
                            Kapak Görseli Yüklemek İçin Tıklayın veya Dosyayı Sürükleyin
                          </p>
                          <p className="text-xs text-neutral-500 max-w-md">
                            Yüklediğiniz resim sistem tarafından otomatik olarak <strong>16:9 standart ölçülere (1200x675px)</strong> boyutlandırılıp optimize edilir.
                          </p>
                        </>
                      )}
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wider">
                  Okuma Süresi Metni
                </label>
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  placeholder="Örn: 5 dk okuma"
                  className="w-full px-4 py-3 bg-[#F8F8F9] border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:bg-white focus:text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wider">
                  Etiketler (Virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Karar Alma, Farkındalık, Koçluk"
                  className="w-full px-4 py-3 bg-[#F8F8F9] border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:bg-white focus:text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </div>
            </div>

            {/* Premium Paper Writing Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Makale İçeriği (Markdown / Düz Metin) *
                </label>
                <span className="text-[11px] font-medium text-neutral-500">
                  Rahat Yazma & Kağıt Modu
                </span>
              </div>
              <textarea
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Başlık 1&#10;&#10;Paragraf metninizi buraya rahatça yazabilirsiniz...&#10;&#10;## Alt Başlık&#10;> İlham veren alıntı cümlesi..."
                className="w-full p-6 bg-[#FAFAFA] border border-neutral-300 rounded-2xl text-neutral-900 placeholder-neutral-400 text-base leading-relaxed font-sans focus:bg-white focus:text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all shadow-inner"
              />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-neutral-800">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4"
                />
                <span>Hemen Yayınla (Herkes Görebilir)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-neutral-800">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4"
                />
                <span>Öne Çıkan Makale Yap</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-6 py-3 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit" disabled={saving}
                className="px-8 py-3 rounded-xl bg-stone-200 text-stone-900 font-bold border border-stone-300 text-xs shadow-xs cursor-pointer"
              >
                {editingPost ? 'Güncellemeleri Kaydet' : 'Makaleyi Kaydet'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
