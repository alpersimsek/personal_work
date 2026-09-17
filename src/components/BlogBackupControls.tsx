import React, { useId, useState } from 'react';
import { Download, FileJson, Upload } from 'lucide-react';
import { blogService, type BlogRestorePreview } from '../services/blogService';

interface BlogBackupControlsProps {
  onRestored: () => Promise<void>;
  disabled?: boolean;
}

const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

export function BlogBackupControls({ onRestored, disabled = false }: BlogBackupControlsProps) {
  const fileInputId = useId();
  const [operation, setOperation] = useState<'download' | 'preview' | 'restore' | null>(null);
  const [pending, setPending] = useState<{ data: unknown; name: string; preview: BlogRestorePreview } | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const busy = operation !== null || disabled;
  const buttonClass = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-100 text-stone-800 text-sm font-semibold hover:bg-stone-200 active:bg-stone-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 disabled:opacity-50 disabled:cursor-not-allowed';

  function showError(error: unknown) {
    setNotice({ type: 'error', text: error instanceof Error ? error.message : 'İşlem tamamlanamadı.' });
  }

  async function download() {
    if (busy) return;
    setOperation('download');
    setNotice(null);
    try {
      await blogService.downloadBackup();
      setNotice({ type: 'success', text: 'Blog yedeği indirildi.' });
    } catch (error) { showError(error); }
    finally { setOperation(null); }
  }

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    setPending(null);
    setNotice(null);
    if (file.size > MAX_BACKUP_BYTES) {
      setNotice({ type: 'error', text: 'Yedek dosyası en fazla 50 MB olabilir.' });
      return;
    }
    setOperation('preview');
    try {
      let data: unknown;
      try { data = JSON.parse(await file.text()); }
      catch { throw new Error('Dosya okunamadı. Geçerli bir JSON yedeği seçin.'); }
      const preview = await blogService.previewRestore(data);
      setPending({ data, name: file.name, preview });
    } catch (error) { showError(error); }
    finally { setOperation(null); }
  }

  async function restore() {
    if (!pending || busy || pending.preview.total === 0) return;
    setOperation('restore');
    setNotice(null);
    try {
      const result = await blogService.restoreBackup(pending.data);
      setPending(null);
      try {
        await onRestored();
        setNotice({ type: 'success', text: `${result.created} yazı eklendi, ${result.updated} yazı güncellendi.` });
      } catch {
        setNotice({ type: 'error', text: 'Yedek geri yüklendi, ancak liste yenilenemedi. Güncel yazıları görmek için sayfayı yenileyin.' });
      }
    } catch (error) { showError(error); }
    finally { setOperation(null); }
  }

  return (
    <section aria-labelledby={`${fileInputId}-heading`} aria-busy={operation !== null} className="mb-8 border-y border-stone-200 py-5 text-stone-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-lg">
          <h2 id={`${fileInputId}-heading`} className="text-base font-semibold">Blog Yedekleme</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">Yazılar, taslaklar, görseller ve istatistikler JSON dosyası olarak yedeklenir.</p>
        </div>
        <button type="button" onClick={download} disabled={busy} className={buttonClass}>
          <Download size={16} aria-hidden="true" />
          {operation === 'download' ? 'İndiriliyor…' : 'Yedek İndir'}
        </button>
      </div>
      <div className="mt-4">
        <label htmlFor={fileInputId} className="mb-2 block text-sm font-medium">Geri yüklenecek yedek dosyası</label>
        <input id={fileInputId} type="file" accept=".json,application/json" disabled={busy} onChange={chooseFile}
          aria-describedby={`${fileInputId}-help`}
          className="block w-full max-w-xl text-sm text-stone-600 file:mr-3 file:rounded-lg file:border file:border-stone-300 file:bg-stone-100 file:px-3 file:py-2 file:font-medium file:text-stone-800 hover:file:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 disabled:opacity-50" />
        <p id={`${fileInputId}-help`} className="mt-2 text-xs text-stone-500">JSON, en fazla 50 MB. Eski blog yedekleri de desteklenir.</p>
      </div>
      {operation === 'preview' && <p role="status" className="mt-4 text-sm">Yedek kontrol ediliyor…</p>}
      {pending && (
        <div className="mt-4 rounded-xl border border-stone-300 bg-stone-100 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold break-all"><FileJson size={16} className="shrink-0" aria-hidden="true" />{pending.name}</p>
          <p className="mt-2 text-sm">{pending.preview.total} yazı: {pending.preview.published} yayında, {pending.preview.drafts} taslak.</p>
          <p className="mt-1 text-sm">{pending.preview.created} yeni yazı eklenecek, {pending.preview.updated} mevcut yazı güncellenecek.</p>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">Eşleşen bağlantılardaki yazıların içeriği, yayın durumu ve istatistikleri yedekteki değerlerle güncellenir. Diğer yazılar korunur.</p>
          {pending.preview.total === 0 && <p className="mt-2 text-sm">Bu yedekte geri yüklenecek yazı yok.</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={restore} disabled={busy || pending.preview.total === 0} className={buttonClass}>
              <Upload size={16} aria-hidden="true" />{operation === 'restore' ? 'Geri Yükleniyor…' : 'Geri Yükle'}
            </button>
            <button type="button" onClick={() => { setPending(null); setNotice(null); }} disabled={busy} className={buttonClass}>Vazgeç</button>
          </div>
        </div>
      )}
      {notice && <p role={notice.type === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${notice.type === 'error' ? 'text-rose-700' : 'text-emerald-800'}`}>{notice.text}</p>}
    </section>
  );
}
