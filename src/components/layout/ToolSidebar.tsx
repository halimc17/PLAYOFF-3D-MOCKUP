import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Grid2x2,
  ImagePlus,
  Layers,
  Palette,
  Type,
} from 'lucide-react';
import { useDesignStore, type SidebarTab } from '../../store/useDesignStore';
import { translations } from '../../config/i18n';
import { ModelColorTool } from '../tools/ModelColorTool';
import { PatternTool } from '../tools/PatternTool';
import { UploadAssetTool } from '../tools/UploadAssetTool';
import { TextNumberTool } from '../tools/TextNumberTool';
import { LayerManagerTool } from '../tools/LayerManagerTool';

export function ToolSidebar() {
  const activeTab = useDesignStore((s) => s.activeTab);
  const setActiveTab = useDesignStore((s) => s.setActiveTab);
  const language = useDesignStore((s) => s.language);

  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRefs = useRef<Partial<Record<SidebarTab, HTMLButtonElement | null>>>({});
  const t = translations[language];

  const tabs: Array<{ id: SidebarTab; label: string; icon: typeof Palette }> = [
    { id: 'modelColor', label: t.tabs.modelColor, icon: Palette },
    { id: 'pattern', label: t.tabs.pattern, icon: Grid2x2 },
    { id: 'graphics', label: t.tabs.graphics, icon: ImagePlus },
    { id: 'text', label: t.tabs.text, icon: Type },
    { id: 'layers', label: t.tabs.layers, icon: Layers },
  ];

  // Close mobile tool drawer on Escape and return focus to its trigger button
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        triggerRefs.current[activeTab]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, activeTab]);

  const renderToolContent = () => {
    switch (activeTab) {
      case 'modelColor':
        return <ModelColorTool />;
      case 'pattern':
        return <PatternTool />;
      case 'graphics':
        return <UploadAssetTool />;
      case 'text':
        return <TextNumberTool />;
      case 'layers':
        return <LayerManagerTool />;
    }
  };

  const activeLabel = tabs.find((x) => x.id === activeTab)?.label ?? '';

  return (
    <>
      <aside
        aria-label={language === 'id' ? 'Alat desain jersey' : 'Jersey design tools'}
        className="hidden h-full shrink-0 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151c] lg:flex"
      >
        <nav
          aria-label={language === 'id' ? 'Kategori alat' : 'Tool categories'}
          className="flex w-[72px] flex-col items-center gap-1.5 border-r border-slate-200 bg-slate-50 py-3 dark:border-white/10 dark:bg-[#0d1016]"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-[48px] w-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition ${
                  active
                    ? 'bg-emerald-500 font-bold text-slate-950'
                    : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                <span className="text-center leading-tight">
                  {tab.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex w-[292px] flex-col">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {activeLabel}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{renderToolContent()}</div>
        </div>
      </aside>

      <div className="lg:hidden">
        {mobileOpen && (
          <div
            role="dialog"
            aria-label={activeLabel}
            className="fixed inset-x-0 bottom-14 z-30 flex max-h-[58dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-white shadow-xl dark:border-white/15 dark:bg-[#11151c]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-white/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {activeLabel}
              </h2>
              <button
                type="button"
                aria-label={t.common.close}
                onClick={() => {
                  setMobileOpen(false);
                  triggerRefs.current[activeTab]?.focus();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-6">{renderToolContent()}</div>
          </div>
        )}

        <nav
          aria-label={language === 'id' ? 'Navigasi alat mobile' : 'Mobile tool navigation'}
          className="pb-safe fixed inset-x-0 bottom-0 z-40 grid min-h-[56px] grid-cols-5 border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151c]"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id && mobileOpen;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  triggerRefs.current[tab.id] = el;
                }}
                type="button"
                aria-expanded={active}
                aria-label={tab.label}
                onClick={() => {
                  if (activeTab === tab.id && mobileOpen) {
                    setMobileOpen(false);
                  } else {
                    setActiveTab(tab.id);
                    setMobileOpen(true);
                  }
                }}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                  active
                    ? 'font-bold text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                <span className="max-w-full truncate px-1">
                  {tab.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
