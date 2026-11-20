import { Check, Eraser, Grid2x2, PaintBucket } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { brandConfig } from '../../config/brandConfig';
import { translations } from '../../config/i18n';
import type {
  CollarType,
  FabricType,
  PanelId,
  SleeveLength,
  SportType,
} from '../../types/design';

const PANELS: PanelId[] = [
  'front',
  'back',
  'leftSleeve',
  'rightSleeve',
  'collar',
  'cuffs',
];

export function ModelColorTool() {
  const design = useDesignStore((s) => s.design);
  const activePanel = useDesignStore((s) => s.activePanel);
  const language = useDesignStore((s) => s.language);

  const setActivePanel = useDesignStore((s) => s.setActivePanel);
  const setActiveTab = useDesignStore((s) => s.setActiveTab);
  const setSport = useDesignStore((s) => s.setSport);
  const setSleeveLength = useDesignStore((s) => s.setSleeveLength);
  const setCollarType = useDesignStore((s) => s.setCollarType);
  const setFabricType = useDesignStore((s) => s.setFabricType);
  const setPanelBaseColor = useDesignStore((s) => s.setPanelBaseColor);
  const setPanelPattern = useDesignStore((s) => s.setPanelPattern);
  const applyBaseColorToAll = useDesignStore((s) => s.applyBaseColorToAll);

  const t = translations[language];
  const currentPanel = design.panels[activePanel];
  const currentPanelColor = currentPanel.baseColor;
  const hasActivePattern = currentPanel.pattern.type !== 'solid';

  const sports: SportType[] = ['football', 'futsal', 'volleyball'];
  const sleeves: SleeveLength[] = ['short', 'long'];
  const collars: CollarType[] = ['v-neck'];
  const fabrics: FabricType[] = ['milano', 'mesh', 'smooth'];

  return (
    <div className="space-y-5">
      {/* Sport Category */}
      <section className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.controls.sportCategory}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {sports.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSport(sp)}
              className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                design.sport === sp
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {t.sports[sp]}
            </button>
          ))}
        </div>
      </section>

      {/* Sleeve Length */}
      <section className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.sleeves.label}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {sleeves.map((sl) => (
            <button
              key={sl}
              type="button"
              onClick={() => setSleeveLength(sl)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                design.sleeveLength === sl
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {t.sleeves[sl]}
            </button>
          ))}
        </div>
      </section>

      {/* Collar Style */}
      <section className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {t.collars.label}
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {collars.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={design.collarType === c}
              onClick={() => setCollarType(c)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                design.collarType === c
                  ? 'bg-emerald-500 font-semibold text-slate-950'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {t.collars[c]}
            </button>
          ))}
        </div>
      </section>

      {/* 3D Fabric Texture */}
      <section className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.fabrics.label}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {fabrics.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFabricType(f)}
              className={`rounded-lg px-2 py-2 text-[11px] font-medium transition ${
                design.fabricType === f
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {t.fabrics[f]}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-slate-200 dark:border-white/10" />

      <section className="space-y-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-400">
          {t.controls.panelColor}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {PANELS.map((pid) => {
            const selected = activePanel === pid;
            const color = design.panels[pid].baseColor;
            return (
              <button
                key={pid}
                type="button"
                aria-pressed={selected}
                onClick={() => setActivePanel(pid)}
                className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 py-2 text-left text-[11px] transition ${
                  selected
                    ? 'bg-emerald-500/15 font-semibold text-emerald-800 ring-1 ring-emerald-500 dark:text-emerald-300'
                    : 'bg-slate-100 font-medium text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/20 dark:ring-white/25"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{t.panels[pid]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Base Color Picker + Quick Swatches */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="panel-base-hex"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
          >
            {t.controls.baseColor}
          </label>
          <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
            {currentPanelColor.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={t.controls.baseColor}
            value={currentPanelColor}
            onChange={(e) => setPanelBaseColor(activePanel, e.target.value)}
            className="h-9 w-12 rounded-lg border border-slate-300 bg-transparent p-0.5 dark:border-white/15"
          />
          <input
            id="panel-base-hex"
            type="text"
            value={currentPanelColor}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                setPanelBaseColor(activePanel, e.target.value);
              }
            }}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-mono text-xs uppercase text-slate-900 focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-8 gap-1.5 pt-1">
          {brandConfig.quickColorPalette.map((hex) => {
            const isSelected = currentPanelColor.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                type="button"
                onClick={() => setPanelBaseColor(activePanel, hex)}
                title={hex}
                className={`flex h-7 w-full items-center justify-center rounded-md ring-1 transition hover:scale-105 ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900'
                    : 'ring-black/15 dark:ring-white/20'
                }`}
                style={{ backgroundColor: hex }}
              >
                {isSelected && (
                  <Check
                    className={`h-3.5 w-3.5 ${
                      hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#facc15'
                        ? 'text-slate-900'
                        : 'text-white'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {hasActivePattern && (
          <div className="rounded-lg border border-amber-600/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <Grid2x2 className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>
                {language === 'id'
                  ? `Motif aktif: ${t.patterns[currentPanel.pattern.type]}`
                  : `Active pattern: ${t.patterns[currentPanel.pattern.type]}`}
              </span>
            </div>
            <p className="mt-1 text-[10px] opacity-85">
              {language === 'id'
                ? 'Motif menutup sebagian warna dasar panel ini.'
                : 'This pattern overlays the panel base color.'}
            </p>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => setPanelPattern(activePanel, { type: 'solid' })}
                className="flex flex-1 items-center justify-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-[11px] font-semibold text-slate-950 hover:bg-amber-400"
              >
                <Eraser className="h-3 w-3" />
                {language === 'id' ? 'Jadikan Polos' : 'Make Solid'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pattern')}
                className="rounded-md bg-black/10 px-2 py-1 text-[11px] font-medium hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
              >
                {language === 'id' ? 'Edit Motif' : 'Edit Pattern'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={() => applyBaseColorToAll(currentPanelColor, false)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <PaintBucket className="h-3.5 w-3.5" />
            {t.common.applyAllPanels}
          </button>
          <button
            type="button"
            onClick={() => applyBaseColorToAll(currentPanelColor, true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
          >
            <Eraser className="h-3.5 w-3.5" />
            {language === 'id'
              ? 'Terapkan Warna Polos ke Semua Panel (Hapus Motif)'
              : 'Apply Solid Color to All Panels (Clear Patterns)'}
          </button>
        </div>
      </section>
    </div>
  );
}
