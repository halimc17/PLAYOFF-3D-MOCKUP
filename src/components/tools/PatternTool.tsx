import { Layers } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { translations } from '../../config/i18n';
import type { PanelId, PatternType } from '../../types/design';

const PATTERN_LIST: PatternType[] = [
  'solid',
  'vertical-stripes',
  'horizontal-hoops',
  'pinstripes',
  'diagonal-sash',
  'chevron',
  'gradient',
  'half-split',
  'geometric-hex',
  'lightning-wave',
];

const PANEL_OPTIONS: PanelId[] = [
  'front',
  'back',
  'leftSleeve',
  'rightSleeve',
  'collar',
  'cuffs',
];

export function PatternTool() {
  const design = useDesignStore((s) => s.design);
  const activePanel = useDesignStore((s) => s.activePanel);
  const language = useDesignStore((s) => s.language);
  const setActivePanel = useDesignStore((s) => s.setActivePanel);
  const setPanelPattern = useDesignStore((s) => s.setPanelPattern);
  const applyPatternToBodyAndSleeves = useDesignStore(
    (s) => s.applyPatternToBodyAndSleeves,
  );

  const t = translations[language];
  const panelCfg = design.panels[activePanel];
  const pat = panelCfg.pattern;

  return (
    <div className="space-y-5">
      <section className="space-y-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-400">
          {t.common.activePanel}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {PANEL_OPTIONS.map((pid) => (
            <button
              key={pid}
              type="button"
              aria-pressed={activePanel === pid}
              onClick={() => setActivePanel(pid)}
              className={`min-h-[34px] truncate rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition ${
                activePanel === pid
                  ? 'bg-emerald-500 font-semibold text-slate-950'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {t.panels[pid]}
            </button>
          ))}
        </div>
      </section>

      {/* Pattern Presets Grid */}
      <section className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.controls.patternStyle}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PATTERN_LIST.map((ptype) => {
            const active = pat.type === ptype;
            return (
              <button
                key={ptype}
                type="button"
                onClick={() => setPanelPattern(activePanel, { type: ptype })}
                className={`rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500 dark:text-emerald-300 font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {t.patterns[ptype]}
              </button>
            );
          })}
        </div>
      </section>

      {pat.type !== 'solid' && (
        <>
          {/* Pattern Colors */}
          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t.controls.patternPrimary}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={pat.color}
                  onChange={(e) =>
                    setPanelPattern(activePanel, { color: e.target.value })
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5 dark:border-white/15"
                />
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {pat.color.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t.controls.patternSecondary}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={pat.secondaryColor}
                  onChange={(e) =>
                    setPanelPattern(activePanel, {
                      secondaryColor: e.target.value,
                    })
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5 dark:border-white/15"
                />
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {pat.secondaryColor.toUpperCase()}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label htmlFor="pat-scale" className="text-slate-700 dark:text-slate-300">
                  {t.controls.patternScale}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {pat.scale.toFixed(1)}x
                </span>
              </div>
              <input
                id="pat-scale"
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={pat.scale}
                onChange={(e) =>
                  setPanelPattern(activePanel, { scale: Number(e.target.value) })
                }
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label htmlFor="pat-rot" className="text-slate-700 dark:text-slate-300">
                  {t.controls.patternRotation}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {pat.rotation}°
                </span>
              </div>
              <input
                id="pat-rot"
                type="range"
                min={-180}
                max={180}
                step={5}
                value={pat.rotation}
                onChange={(e) =>
                  setPanelPattern(activePanel, {
                    rotation: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label htmlFor="pat-opacity" className="text-slate-700 dark:text-slate-300">
                  {t.controls.patternOpacity}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {Math.round(pat.opacity * 100)}%
                </span>
              </div>
              <input
                id="pat-opacity"
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={pat.opacity}
                onChange={(e) =>
                  setPanelPattern(activePanel, {
                    opacity: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>
          </section>
        </>
      )}

      <button
        type="button"
        onClick={() => applyPatternToBodyAndSleeves(pat)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
      >
        <Layers className="h-3.5 w-3.5" />
        {t.controls.applyPatternAll}
      </button>
    </div>
  );
}
