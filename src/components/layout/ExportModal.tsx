import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Loader2,
  MessageCircle,
  Package,
  X,
} from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { brandConfig } from '../../config/brandConfig';
import { translations } from '../../config/i18n';
import {
  buildWhatsAppSummaryUrl,
  exportProductionZipPack,
  exportTechPackPdfOnly,
} from '../../engine/exporter';

export function ExportModal() {
  const open = useDesignStore((s) => s.exportModalOpen);
  const setOpen = useDesignStore((s) => s.setExportModalOpen);
  const design = useDesignStore((s) => s.design);
  const assets = useDesignStore((s) => s.assets);
  const language = useDesignStore((s) => s.language);
  const setBrief = useDesignStore((s) => s.setBrief);

  const [busyMode, setBusyMode] = useState<'zip' | 'pdf' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const t = translations[language];

  useEffect(() => {
    if (!open) {
      setErrorMsg(null);
      setSuccessMsg(null);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && busyMode === null) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busyMode, setOpen]);

  if (!open) return null;

  const handleZipExport = async () => {
    setBusyMode('zip');
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await exportProductionZipPack(design, assets);
      setSuccessMsg(
        language === 'id'
          ? 'Paket produksi (.zip) berhasil diunduh.'
          : 'Production pack (.zip) downloaded.',
      );
    } catch {
      setErrorMsg(
        language === 'id'
          ? 'Gagal menyiapkan file ZIP. Pastikan tampilan 3D aktif lalu coba lagi.'
          : 'Failed to package ZIP. Make sure the 3D view is visible and try again.',
      );
    } finally {
      setBusyMode(null);
    }
  };

  const handlePdfExport = async () => {
    setBusyMode('pdf');
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await exportTechPackPdfOnly(design, assets);
      setSuccessMsg(
        language === 'id'
          ? 'Tech Pack PDF berhasil diunduh.'
          : 'Tech Pack PDF downloaded.',
      );
    } catch {
      setErrorMsg(
        language === 'id'
          ? 'Gagal membuat Tech Pack PDF. Coba lagi.'
          : 'Failed to generate Tech Pack PDF. Please try again.',
      );
    } finally {
      setBusyMode(null);
    }
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppSummaryUrl(design);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && busyMode === null) {
          setOpen(false);
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="relative flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/15 dark:bg-[#131820]"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <div>
            <h3
              id="export-modal-title"
              className="text-base font-bold text-slate-950 dark:text-white"
            >
              {t.exportModal.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {t.exportModal.subtitle}
            </p>
          </div>
          <button
            type="button"
            aria-label={t.common.close}
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="brief-team-name"
                className="text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {t.exportModal.teamName}
              </label>
              <input
                id="brief-team-name"
                type="text"
                value={design.brief.teamName}
                onChange={(e) => setBrief({ teamName: e.target.value })}
                placeholder={language === 'id' ? 'Nama klub atau tim' : 'Club or team name'}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-950 focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="brief-customer-name"
                className="text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {t.exportModal.customerName}
              </label>
              <input
                id="brief-customer-name"
                type="text"
                value={design.brief.customerName}
                onChange={(e) => setBrief({ customerName: e.target.value })}
                placeholder={language === 'id' ? 'Nama penanggung jawab' : 'Your name'}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-950 focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <label
                htmlFor="brief-fabric"
                className="text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {t.exportModal.fabricChoice}
              </label>
              <select
                id="brief-fabric"
                value={design.brief.fabricOption}
                onChange={(e) => setBrief({ fabricOption: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-950 focus:border-emerald-600 dark:border-white/15 dark:bg-slate-900 dark:text-white"
              >
                {brandConfig.fabricCatalog.map((f) => (
                  <option key={f.id} value={f.label}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="brief-qty"
                className="text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {t.exportModal.quantity}
              </label>
              <input
                id="brief-qty"
                type="number"
                min={1}
                max={9999}
                value={design.brief.quantity}
                onChange={(e) =>
                  setBrief({ quantity: Math.max(1, Number(e.target.value) || 1) })
                }
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs tabular-nums text-slate-950 focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="brief-notes"
              className="text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              {t.exportModal.notes}
            </label>
            <textarea
              id="brief-notes"
              rows={3}
              value={design.brief.notes}
              onChange={(e) => setBrief({ notes: e.target.value })}
              placeholder={t.exportModal.notesPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-950 focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="rounded-xl border border-emerald-600/25 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
            <p className="font-semibold">
              {t.sports[design.sport]} · {t.sleeves[design.sleeveLength]} ·{' '}
              {t.collars[design.collarType]} · {design.layers.length} Layer ·{' '}
              {assets.length} File Upload
            </p>
            <p className="mt-1 text-[11px] opacity-90">
              {t.exportModal.includedFiles}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-[#0e1218]">
          {busyMode && (
            <div
              role="status"
              className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{t.exportModal.generating}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={busyMode !== null}
              onClick={handleZipExport}
              className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50"
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              {t.exportModal.downloadZip}
            </button>

            <button
              type="button"
              disabled={busyMode !== null}
              onClick={handlePdfExport}
              className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t.exportModal.downloadPdfOnly}
            </button>
          </div>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600/15 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-600/25 dark:text-emerald-300"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t.exportModal.sendWhatsApp}
          </button>

          <p className="text-center text-[11px] text-slate-600 dark:text-slate-400">
            {t.exportModal.readyHint}
          </p>
        </div>
      </div>
    </div>
  );
}
