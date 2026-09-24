import React, { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { BlogPost, BlogCategory } from '../types';
import { blogService, formatCoverImage } from '../services/blogService';
import { authService } from '../services/authService';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { AdminNavBar } from '../components/AdminNavBar';
import { AdminPostPreview } from '../components/AdminPostPreview';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { WORDS_PER_MINUTE, countWords, estimateReadingMinutes, formatReadingTime, readingTimeLabel } from '../utils/readingTime';
import { PostCover } from '../components/PostCover';

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
  // On: the label is worked out from the text. Off: whatever is typed in the field is kept.
  const [readTimeAuto, setReadTimeAuto] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [preview, setPreview] = useState<{ post: BlogPost; unsaved: boolean } | null>(null);

  const wordCount = useMemo(() => countWords(content), [content]);
  const autoReadTime = formatReadingTime(estimateReadingMinutes(wordCount));
  const [coverImage, setCoverImage] = useState('');
  const [isFormattingImage, setIsFormattingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
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
    if (!file || isFormattingImage || saving) return;

    if (!file.type.startsWith('image/')) {
      setStatusNotice({ type: 'error', text: 'Lütfen geçerli bir resim dosyası seçin (PNG, JPG, WebP).' });
      return;
    }

    try {
      setIsFormattingImage(true);
      const formattedBase64 = await formatCoverImage(file, 1200, 675, 0.82);
      setCoverImage(await blogService.uploadImage(formattedBase64));
      setStatusNotice({ type: 'success', text: 'Görsel yüklendi ve 16:9 HD (1200x675px) olarak otomatik formatlandı!' });
    } catch (error) {
      showError(error);
    } finally {
      setIsFormattingImage(false);
      e.target.value = '';
    }
  };

  const handleStartNewPost = () => {
    setEditingPost(null);
    setTitle('');
    setCategory('Farkındalık');
    setSummary('');
    setContent('');
    setReadTime('5 dk okuma');
    setReadTimeAuto(true);
    setCoverImage('');
    setShowUrlInput(false);
    setTagsInput('Yaşam Koçluğu, Farkındalık');
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
    // Keep a hand-written value as it was; only follow the text if it already matched it.
    setReadTimeAuto(post.readTime === readingTimeLabel(post.content));
    setCoverImage(post.coverImage);
    setShowUrlInput(false);
    setTagsInput(post.tags ? post.tags.join(', ') : '');
    setFeatured(post.featured || false);
    setStatusNotice(null);
    setActiveTab('editor');
  };

  /** What a save does to the article's visibility. `keep` leaves a live article live. */
  type PublishMode = 'draft' | 'publish' | 'keep';

  const finalReadTime = readTimeAuto || !readTime.trim() ? autoReadTime : readTime.trim();
  const isLive = Boolean(editingPost?.published);
  const busy = saving || isFormattingImage;

  const currentFields = () => ({
    title,
    category,
    summary,
    content,
    readTime: finalReadTime,
    coverImage: coverImage.trim(),
    tags: tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    featured,
  });

  /** Saves the editor and returns the stored article, or null after showing why not. */
  const persist = async (mode: PublishMode): Promise<BlogPost | null> => {
    if (busy) return null;
    if (!title.trim() || !content.trim()) {
      setStatusNotice({ type: 'error', text: 'Lütfen başlık ve içerik alanlarını doldurun.' });
      return null;
    }
    setSaving(true);
    try {
      const published = mode === 'publish' ? true : mode === 'draft' ? false : isLive;
      const data = { ...currentFields(), published };
      const saved = editingPost
        ? await blogService.updatePost(editingPost.id, data)
        : await blogService.createPost(data);
      if (!saved) throw new Error('Makale bulunamadı.');
      await refreshPosts();
      return saved;
    } catch (error) {
      showError(error);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveAndReturn = async (mode: PublishMode, message: string) => {
    if (!(await persist(mode))) return;
    setPreview(null);
    setActiveTab('list');
    setStatusNotice({ type: 'success', text: message });
  };

  // Pressing Enter in a field submits the form, so it must never publish: it saves safely.
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void (isLive
      ? saveAndReturn('keep', 'Değişiklikler kaydedildi.')
      : saveAndReturn('draft', 'Taslak olarak kaydedildi. Hazır olduğunda “Yayınla” diyebilirsin.'));
  };

  const handlePublish = () => void saveAndReturn('publish', 'Makale yayına alındı!');
  const handleUnpublish = () =>
    void saveAndReturn('draft', 'Makale yayından kaldırıldı ve taslak olarak kaydedildi.');

  /**
   * A draft is saved first, so nothing typed is lost and the preview shows the
   * stored article. A live article is never overwritten by a preview: its edits
   * are shown unsaved instead.
   */
  const handlePreview = async () => {
    if (busy) return;
    if (editingPost?.published) {
      setPreview({ post: { ...editingPost, ...currentFields() }, unsaved: true });
      return;
    }
    const saved = await persist('draft');
    if (!saved) return;
    setEditingPost(saved);
    setStatusNotice(null);
    setPreview({ post: saved, unsaved: false });
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
      {statusNotice && (activeTab === 'list' || statusNotice.type === 'error') && <p role={statusNotice.type === 'error' ? 'alert' : 'status'} className="p-4">{statusNotice.text}</p>}
      <AdminNavBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        postCount={posts.length}
        editingExistingPost={Boolean(editingPost)}
        busy={isFormattingImage || saving}
        onNewPost={handleStartNewPost}
        onOpenSite={onNavigateHome}
        onOpenBlog={onNavigateBlog}
        onChangePassword={() => setPasswordModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-5xl mx-auto w-full py-8 px-4 sm:px-6">
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
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <PostCover src={post.coverImage} alt={post.title} className="w-20 h-20 rounded-xl object-cover border border-neutral-200 shrink-0 shadow-inner" markSize={26} tone="admin" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
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
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 mt-2 font-mono">
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
                        className={`btn btn-sm ${post.published ? 'btn-caution' : 'btn-positive'}`}
                      >
                        {post.published ? 'Taslağa Al' : 'Yayınla'}
                      </button>

                      <button
                        onClick={() => handleStartEdit(post)}
                        className="btn btn-secondary btn-sm"
                      >
                        Düzenle
                      </button>

                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="btn btn-danger btn-icon btn-sm"
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
          <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-sm">
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
                  Kapak Görseli (İsteğe Bağlı · 16:9 · 1200x675px)
                </label>
                <button
                  type="button"
                  disabled={isFormattingImage || saving}
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="btn btn-link text-[11px]"
                >
                  {showUrlInput ? 'Dosya Yükleme Moduna Dön' : 'veya Görsel Bağlantısı (URL) Gir'}
                </button>
              </div>

              {!coverImage && !isFormattingImage && (
                <p className="text-xs text-neutral-500">
                  Görsel eklemezsen makalede senin yerine resim seçilmez; sitenin logo işaretiyle sade bir zemin gösterilir.
                </p>
              )}

              {showUrlInput ? (
                <div>
                  <input
                    type="text"
                    value={coverImage}
                    disabled={isFormattingImage || saving}
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
                  {isFormattingImage && coverImage && <p role="status" className="text-xs text-stone-700">Görsel hazırlanıyor ve yükleniyor…</p>}
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
                          Görsel yüklendi; makale kartlarında ve detay sayfasında kullanılabilir.
                        </p>

                        <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                          <label className="px-3.5 py-1.5 rounded-xl bg-stone-200 text-stone-900 text-xs font-bold border border-stone-300 cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Farklı Resim Seç</span>
                            <input
                              type="file"
                              aria-label="Kapak görseli dosyası"
                              disabled={isFormattingImage || saving}
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            disabled={isFormattingImage || saving}
                            onClick={() => setCoverImage('')}
                            className="btn btn-danger btn-sm"
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
                        aria-label="Kapak görseli dosyası"
                        disabled={isFormattingImage || saving}
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
                          <span className="text-xs font-bold">Görsel hazırlanıyor ve yükleniyor…</span>
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
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">Okuma Süresi</span>
                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 cursor-pointer select-none">
                    <span>Otomatik</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={readTimeAuto}
                      aria-label="Okuma süresini metinden otomatik hesapla"
                      onClick={() => setReadTimeAuto((auto) => !auto)}
                      className={`relative h-5 w-9 shrink-0 rounded-full border ${
                        readTimeAuto ? 'bg-neutral-900 border-neutral-900' : 'bg-neutral-200 border-neutral-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white ${readTimeAuto ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </label>
                </div>

                {readTimeAuto ? (
                  <div className="flex items-center gap-3.5 rounded-xl border border-neutral-200 bg-[#F8F8F9] px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700">
                      <Clock size={18} />
                    </span>
                    <div className="min-w-0">
                      <p aria-live="polite" className="text-lg font-semibold leading-tight text-neutral-900 tabular-nums">
                        {wordCount > 0 ? autoReadTime : 'Yazdıkça hesaplanır'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {wordCount.toLocaleString('tr-TR')} kelime · dakikada ~{WORDS_PER_MINUTE} kelime hızıyla
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={readTime}
                      onChange={(e) => setReadTime(e.target.value)}
                      placeholder="Örn: 5 dk okuma"
                      className="w-full px-4 py-3 bg-[#F8F8F9] border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:bg-white focus:text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                    />
                    {wordCount > 0 && (
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                        <span>Metne göre öneri: <strong className="font-semibold text-neutral-700">{autoReadTime}</strong></span>
                        <button type="button" onClick={() => setReadTime(autoReadTime)} className="btn btn-link text-xs">
                          Bunu kullan
                        </button>
                      </p>
                    )}
                  </>
                )}
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
                <span className="text-[11px] font-medium text-neutral-500 tabular-nums">
                  {wordCount.toLocaleString('tr-TR')} kelime
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
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4"
                />
                <span>Öne Çıkan Makale Yap</span>
              </label>
            </div>

            {/* Actions: saving is always safe (draft, or as-is for a live article); publishing is its own button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-500">
                {isLive ? 'Bu makale yayında.' : 'Bu makale taslak; yayına alana kadar kimse göremez.'}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button type="button" disabled={busy} onClick={() => setActiveTab('list')} className="btn btn-ghost">
                  İptal
                </button>
                <button type="button" disabled={busy} onClick={() => void handlePreview()} className="btn btn-secondary">
                  {saving && !isLive ? 'Kaydediliyor…' : 'Önizleme'}
                </button>
                {isLive ? (
                  <>
                    <button type="button" disabled={busy} onClick={handleUnpublish} className="btn btn-secondary">
                      Yayından kaldır
                    </button>
                    <button type="submit" disabled={busy} className="btn btn-primary">
                      {saving ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" disabled={busy} className="btn btn-secondary">
                      {saving ? 'Kaydediliyor…' : 'Taslak olarak kaydet'}
                    </button>
                    <button type="button" disabled={busy} onClick={handlePublish} className="btn btn-primary">
                      Yayına al
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </main>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onChanged={() => setStatusNotice({ type: 'success', text: 'Şifren değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.' })}
      />

      {preview && (
        <AdminPostPreview
          post={preview.post}
          isPublished={preview.post.published}
          showsUnsavedChanges={preview.unsaved}
          busy={saving}
          onClose={() => setPreview(null)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
};
