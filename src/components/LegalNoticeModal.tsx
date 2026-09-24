import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollText, X } from 'lucide-react';
import type { KvkkSection } from '../legal/kvkk';
import { NoticeSections } from './NoticeSections';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  updatedLabel: string;
  version: string;
  intro: string;
  sections: KvkkSection[];
  /** Label of the bottom button, e.g. to say where the visitor returns to. */
  closeLabel?: string;
}

/**
 * A privacy notice in a window that sits on top of whatever is open.
 *
 * It does not unmount or reset the window underneath, so closing it drops the
 * visitor back exactly where they were, form fields and scroll position intact.
 */
export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  isOpen,
  onClose,
  title,
  updatedLabel,
  version,
  intro,
  sections,
  closeLabel = 'Kapat',
}) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Only this window closes; the one underneath stays open.
      event.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-0"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0a]/98 text-left text-white shadow-2xl liquid-glass"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <ScrollText size={18} />
                </div>
                <div>
                  <h2 id={titleId} className="serif-font text-xl sm:text-2xl tracking-tight leading-snug">
                    {title}
                  </h2>
                  <p className="mt-1 text-xs text-white/50">
                    Son güncelleme: {updatedLabel} · Sürüm {version}
                  </p>
                </div>
              </div>
              <button ref={closeRef} onClick={onClose} className="btn btn-secondary btn-icon btn-sm shrink-0" aria-label="Kapat">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6 font-sans">
              <NoticeSections intro={intro} sections={sections} compact />
            </div>

            <div className="border-t border-white/10 p-4 sm:px-6">
              <button onClick={onClose} className="btn btn-primary w-full">
                {closeLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
