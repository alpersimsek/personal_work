import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory } from '../types';
import { blogService } from '../services/blogService';
import { authService } from '../services/authService';

interface BlogAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onPostUpdated: () => void;
}

const CATEGORIES: BlogCategory[] = [
  'Farkındalık',
  'Dönüşüm',
  'Kariyer & Liderlik',
  'İlişkiler',
  'İçsel Netlik',
];

const PRESET_IMAGES = [
  { label: 'İçsel Netlik / Meditasyon', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Farkındalık / Doğa', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Dönüşüm / Ufuk', url: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Kariyer / Çalışma', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Denge / Yaşam', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80' },
];

export const BlogAdminModal: React.FC<BlogAdminModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onPostUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BlogCategory>('Farkındalık');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('5 dk okuma');
  const [coverImage, setCoverImage] = useState(PRESET_IMAGES[0].url);
  const [tagsInput, setTagsInput] = useState('');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      void refreshPosts().catch(showError);
    }
  }, [isOpen]);

  const showError = (error: unknown) => {
    setStatusNotice({ type: 'error', text: error instanceof Error ? error.message : 'Bir hata oluştu.' });
  };
  const refreshPosts = async () => {
    setPosts(await blogService.getAllPosts());
  };

  if (!isOpen) return null;

  const handleStartNewPost = () => {
    setEditingPost(null);
    setTitle('');
    setCategory('Farkındalık');
    setSummary('');
    setContent('');
    setReadTime('5 dk okuma');
    setCoverImage(PRESET_IMAGES[0].url);
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
    const data = { title, category, summary, content, readTime, coverImage: coverImage,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean), published, featured };
    try {
      if (editingPost) {
        const updated = await blogService.updatePost(editingPost.id, data);
        if (!updated) throw new Error('Makale bulunamadı.');
      } else {
        await blogService.createPost(data);
      }
      await refreshPosts();
      onPostUpdated();
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
      onPostUpdated();
    } catch (error) { showError(error); }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await blogService.togglePublish(id);
      await refreshPosts();
      onPostUpdated();
    } catch (error) { showError(error); }
  };

  const handleLogoutClick = async () => {
    try { await authService.logout(); onLogout(); onClose(); }
    catch (error) { showError(error); }
  };

  return (
    <div
      id="blog-admin-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] bg-neutral-900 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl text-white flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
      {activeTab === 'list' && statusNotice && <p role={statusNotice.type === 'error' ? 'alert' : 'status'} className="p-4">{statusNotice.text}</p>}
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="serif-font text-lg font-medium text-white">Blog Yönetim Paneli</h2>
              <p className="text-[11px] text-white/50">Tuğba Ergüner Şimşek İçerik & Makale Editörü</p>
            </div>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={handleLogoutClick}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-300 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Çıkış</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-neutral-900/60">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Makale Listesi ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {editingPost ? 'Makaleyi Düzenle' : 'Yeni Makale Yaz'}
            </button>
          </div>

          {activeTab === 'list' && (
            <button
              onClick={handleStartNewPost}
              className="px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Yeni Ekle</span>
            </button>
          )}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' ? (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-16 text-white/40">
                  <p>Henüz kayıtlı makale bulunmuyor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 flex-1">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/80 border border-white/10">
                              {post.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                post.published
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {post.published ? 'Yayında' : 'Taslak'}
                            </span>
                            {post.featured && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Öne Çıkan
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-white line-clamp-1">{post.title}</h4>
                          <p className="text-xs text-white/40 mt-1 line-clamp-1">{post.summary}</p>
                          <div className="flex items-center gap-3 text-[11px] text-white/40 mt-2">
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

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => handleTogglePublish(post.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            post.published
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {post.published ? 'Taslağa Al' : 'Yayınla'}
                        </button>

                        <button
                          onClick={() => handleStartEdit(post)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs border border-white/15 transition-colors"
                        >
                          Düzenle
                        </button>

                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
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
            /* Editor Tab */
            <form onSubmit={handleSavePost} className="space-y-5 max-w-4xl mx-auto">
              {statusNotice && (
                <div
                  className={`p-3 rounded-xl text-xs text-center border ${
                    statusNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-red-500/10 border-red-500/30 text-red-200'
                  }`}
                >
                  {statusNotice.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                    Makale Başlığı *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Örn: Bulanıklıktan Netliğe: Karar Alma Süreçleri"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BlogCategory)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-white/40"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-neutral-900 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                  Kısa Özet (Kartta görünecek metin)
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Makalenizin 1-2 cümlelik dikkat çekici özeti..."
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 resize-none"
                />
              </div>

              {/* Cover Image Selection */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                  Kapak Görseli URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 mb-2"
                />

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-white/40 self-center mr-1">Hazır Şablonlar:</span>
                  {PRESET_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCoverImage(img.url)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        coverImage === img.url
                          ? 'bg-white text-black border-white font-medium'
                          : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                    Okuma Süresi Metni
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="Örn: 5 dk okuma"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                    Etiketler (Virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Karar Alma, Farkındalık, Koçluk"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Main Content Area */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                  Makale İçeriği (Markdown veya Düz Metin) *
                </label>
                <textarea
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Başlık 1&#10;&#10;Paragraf metni buraya yazılacak...&#10;&#10;## Alt Başlık&#10;> Alıntı cümlesi..."
                  className="w-full px-4 py-3 bg-black/50 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm font-mono focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="rounded border-white/20 bg-black/50 text-white focus:ring-0"
                  />
                  <span>Hemen Yayınla (Herkes Görebilir)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-white/20 bg-black/50 text-white focus:ring-0"
                  />
                  <span>Öne Çıkan Makale Yap</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-medium transition-all shadow-lg hover:shadow-white/10"
                >
                  {editingPost ? 'Güncellemeleri Kaydet' : 'Makaleyi Kaydet'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
