import { useRef, useState } from 'react';
import {
  CheckCircle2,
  Columns2,
  Download,
  FolderOpen,
  Globe,
  Moon,
  Package,
  Redo2,
  RotateCcw,
  Save,
  Shirt,
  Square,
  Sun,
  Undo2,
  X,
} from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { brandConfig } from '../../config/brandConfig';
import { translations } from '../../config/i18n';
import {
  exportProjectJsonFile,
  parseProjectJsonFile,
} from '../../store/storage';
import type { ViewportLayout } from '../../types/design';

export function TopBar() {
  const design = useDesignStore((s) => s.design);
  const assets = useDesignStore((s) => s.assets);
  const pastLen = useDesignStore((s) => s.past.length);
  const futureLen = useDesignStore((s) => s.future.length);
  const viewportLayout = useDesignStore((s) => s.viewportLayout);
  const theme = useDesignStore((s) => s.theme);
  const language = useDesignStore((s) => s.language);
  const saveStatus = useDesignStore((s) => s.saveStatus);

  const setProjectName = useDesignStore((s) => s.setProjectName);
  const setViewportLayout = useDesignStore((s) => s.setViewportLayout);
  const toggleTheme = useDesignStore((s) => s.toggleTheme);
  const toggleLanguage = useDesignStore((s) => s.toggleLanguage);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const resetDesign = useDesignStore((s) => s.resetDesign);
  const loadSerializedProject = useDesignStore((s) => s.loadSerializedProject);
  const setExportModalOpen = useDesignStore((s) => s.setExportModalOpen);

  const t = translations[language];
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportJson = async (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    try {
      const parsed = await parseProjectJsonFile(file);
      loadSerializedProject(parsed.design, parsed.assets);
    } catch {
      setImportError(
        language === 'id'
          ? 'File proyek tidak valid. Pilih file .jersey.json yang diekspor dari studio ini.'
          : 'Invalid project file. Select a .jersey.json file exported from this studio.',
      );
    }
  };

  const handleReset = () => {
    if (window.confirm(t.common.confirmReset)) {
      resetDesign();
    }
  };

  const layouts: Array<{
    id: ViewportLayout;
    label: string;
    shortLabel: string;
    hideOnMobile?: boolean;
  }> = [
    { id: 'split', label: t.layouts.split, shortLabel: 'Split', hideOnMobile: true },
    { id: '3d', label: t.layouts.view3d, shortLabel: '3D' },
    { id: '2d', label: t.layouts.view2d, shortLabel: '2D' },
  ];

  return (
    <>
      <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-1.5 border-b border-slate-200 bg-white px-2 sm:gap-2 sm:px-3 dark:border-white/10 dark:bg-[#11151c]">
        <div className="flex shrink-0 items-center gap-2 sm:min-w-0 sm:gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
            <Shirt className="h-4.5 w-4.5 stroke-[2.4]" aria-hidden="true" />
          </div>
          <div className="hidden min-w-0 flex-col sm:flex">
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-white">
                {brandConfig.appName}
              </h1>
              <span
                aria-live="polite"
                className="hidden items-center gap-1 text-[11px] text-slate-600 md:inline-flex dark:text-slate-400"
              >
                {saveStatus === 'saved' && (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    {t.common.savedLocally}
                  </>
                )}
                {saveStatus === 'saving' && t.common.saving}
              </span>
            </div>
            <input
              type="text"
              value={design.projectName}
              onChange={(e) => setProjectName(e.target.value)}
              aria-label={language === 'id' ? 'Nama proyek' : 'Project name'}
              className="w-40 truncate rounded bg-transparent text-xs font-medium text-slate-600 focus:text-slate-950 dark:text-slate-300 dark:focus:text-white md:w-48"
            />
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <div className="flex shrink-0 items-center rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
            <button
              type="button"
              onClick={undo}
              disabled={pastLen === 0}
              aria-label={t.common.undo}
              title={`${t.common.undo} (Ctrl+Z)`}
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-white active:scale-95 disabled:opacity-35 sm:h-8 sm:w-8 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={futureLen === 0}
              aria-label={t.common.redo}
              title={`${t.common.redo} (Ctrl+Y)`}
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-white active:scale-95 disabled:opacity-35 sm:h-8 sm:w-8 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Redo2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div
            role="group"
            aria-label={language === 'id' ? 'Mode tampilan' : 'Viewport layout'}
            className="flex shrink-0 items-center rounded-lg bg-slate-100 p-0.5 dark:bg-white/5"
          >
            {layouts.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={viewportLayout === item.id}
                onClick={() => setViewportLayout(item.id)}
                className={`${
                  item.hideOnMobile ? 'hidden md:flex' : 'flex'
                } min-h-[36px] items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition sm:min-h-[32px] ${
                  viewportLayout === item.id
                    ? 'bg-white font-semibold text-slate-950 shadow-sm dark:bg-emerald-500 dark:text-slate-950'
                    : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {item.id === 'split' ? (
                  <Columns2 className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
                ) : (
                  <Square className="hidden h-3 w-3 sm:block" aria-hidden="true" />
                )}
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.jersey.json,application/json"
            className="hidden"
            onChange={(e) => {
              handleImportJson(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            aria-label={t.common.importProject}
            title={t.common.importProject}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 xl:flex"
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => exportProjectJsonFile(design, assets)}
            aria-label={t.common.saveJson}
            title={t.common.saveJson}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 xl:flex"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            aria-label={t.common.reset}
            title={t.common.reset}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 md:flex"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={language === 'id' ? 'Ganti bahasa ke Inggris' : 'Switch language to Indonesian'}
            title="Switch Language (ID/EN)"
            className="flex min-h-[36px] min-w-[36px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <Globe className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
            <span>{language.toUpperCase()}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? language === 'id'
                  ? 'Aktifkan mode terang'
                  : 'Switch to light mode'
                : language === 'id'
                  ? 'Aktifkan mode gelap'
                  : 'Switch to dark mode'
            }
            title="Toggle Dark / Light Mode"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] sm:px-3"
          >
            <Package className="hidden h-4 w-4 sm:block" aria-hidden="true" />
            <Download className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
            <span className="sm:hidden">Export</span>
            <span className="hidden sm:inline">{t.common.exportPack}</span>
          </button>
        </div>
      </header>

      {importError && (
        <div
          role="alert"
          className="z-40 flex items-center justify-between gap-3 border-b border-rose-500/30 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-800 dark:bg-rose-950/80 dark:text-rose-200"
        >
          <span>{importError}</span>
          <button
            type="button"
            onClick={() => setImportError(null)}
            aria-label={t.common.close}
            className="rounded p-1 hover:bg-rose-500/20"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
