import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, KeyRound, LogOut, Plus } from 'lucide-react';
import { BrandMark } from './BrandLogo';

export type AdminTab = 'list' | 'editor';

interface AdminNavBarProps {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
  postCount: number;
  /** Whether the editor is open on an existing post, which renames its tab. */
  editingExistingPost: boolean;
  /** Blocks switching while an image is processed or a post is being saved. */
  busy: boolean;
  onNewPost: () => void;
  onOpenSite: () => void;
  onOpenBlog: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}

interface TabProps {
  label: string;
  count?: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}

/** One section of the panel. The underline slides between tabs instead of jumping. */
const Tab: React.FC<TabProps> = ({ label, count, active, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-current={active ? 'page' : undefined}
    className={`relative flex h-full shrink-0 items-center gap-2 px-3 text-[13px] font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:bg-neutral-100 ${
      active ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
    }`}
  >
    <span>{label}</span>
    {count !== undefined && (
      <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-neutral-600">
        {count}
      </span>
    )}
    {active && (
      <motion.span
        layoutId="admin-tab-underline"
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-neutral-900"
      />
    )}
  </button>
);

/**
 * The admin panel's top bar.
 *
 * One row on wide screens: the brand, the two sections as underline tabs, and
 * the actions you reach for (new post, view the site, sign out). On narrow
 * screens the tabs drop to their own scrollable row under the brand and actions.
 */
export const AdminNavBar: React.FC<AdminNavBarProps> = ({
  activeTab,
  onChangeTab,
  postCount,
  editingExistingPost,
  busy,
  onNewPost,
  onOpenSite,
  onOpenBlog,
  onChangePassword,
  onLogout,
}) => (
  <header className="admin-nav sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 px-4 sm:px-6 md:flex-nowrap">
      <div className="flex h-14 items-center md:h-16">
        <button
          type="button"
          onClick={onOpenSite}
          title="Ana sayfaya dön"
          className="group -ml-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-neutral-900 cursor-pointer hover:bg-neutral-100 focus-visible:outline-none focus-visible:bg-neutral-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white">
            <BrandMark size={20} />
          </span>
          <span className="serif-font text-xl leading-none tracking-tight">Yazar Paneli</span>
        </button>
      </div>

      <nav
        aria-label="Yazar paneli bölümleri"
        className="order-last -mx-4 flex h-11 w-[calc(100%+2rem)] overflow-x-auto border-t border-neutral-200 px-2 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-4 md:order-none md:mx-0 md:h-16 md:w-auto md:flex-1 md:border-t-0 md:px-0"
      >
        <Tab
          label="Makaleler"
          count={postCount}
          active={activeTab === 'list'}
          disabled={busy}
          onClick={() => onChangeTab('list')}
        />
        <Tab
          label={editingExistingPost ? 'Makaleyi düzenle' : 'Editör'}
          active={activeTab === 'editor'}
          disabled={busy}
          onClick={() => onChangeTab('editor')}
        />
      </nav>

      <div className="flex h-14 items-center gap-1.5 md:h-16">
        {activeTab === 'list' && (
          <button type="button" onClick={onNewPost} disabled={busy} className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span className="hidden sm:inline">Yeni makale</span>
          </button>
        )}

        <button type="button" onClick={onOpenBlog} className="btn btn-ghost btn-sm" title="Blog sayfasını aç">
          <ExternalLink size={15} />
          <span className="hidden lg:inline">Blog sayfası</span>
        </button>

        <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-neutral-200 sm:block" />

        <button type="button" onClick={onChangePassword} className="btn btn-ghost btn-sm" title="Şifre değiştir">
          <KeyRound size={15} />
          <span className="hidden xl:inline">Şifre</span>
        </button>

        <button type="button" onClick={onLogout} className="btn btn-ghost btn-sm" title="Çıkış yap">
          <LogOut size={15} />
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </div>
    </div>
  </header>
);
