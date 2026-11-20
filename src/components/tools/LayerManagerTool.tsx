import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { translations } from '../../config/i18n';
import type { EditablePanelId } from '../../types/design';

const EDITABLE_PANELS: EditablePanelId[] = [
  'front',
  'back',
  'leftSleeve',
  'rightSleeve',
];

export function LayerManagerTool() {
  const design = useDesignStore((s) => s.design);
  const activeEditablePanel = useDesignStore((s) => s.activeEditablePanel);
  const selectedLayerId = useDesignStore((s) => s.selectedLayerId);
  const language = useDesignStore((s) => s.language);

  const setActivePanel = useDesignStore((s) => s.setActivePanel);
  const setSelectedLayerId = useDesignStore((s) => s.setSelectedLayerId);
  const updateLayer = useDesignStore((s) => s.updateLayer);
  const reorderLayer = useDesignStore((s) => s.reorderLayer);
  const duplicateLayer = useDesignStore((s) => s.duplicateLayer);
  const deleteLayer = useDesignStore((s) => s.deleteLayer);

  const t = translations[language];

  const panelLayers = design.layers
    .filter((l) => l.panelId === activeEditablePanel)
    .slice()
    .reverse();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5">
        {EDITABLE_PANELS.map((pid) => {
          const count = design.layers.filter((l) => l.panelId === pid).length;
          return (
            <button
              key={pid}
              type="button"
              aria-pressed={activeEditablePanel === pid}
              onClick={() => setActivePanel(pid)}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                activeEditablePanel === pid
                  ? 'bg-emerald-500 font-semibold text-slate-950'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              <span className="truncate">{t.panels[pid]}</span>
              <span className="ml-1 rounded-full bg-black/15 px-1.5 text-[10px] tabular-nums">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {panelLayers.length === 0 ? (
        <p className="rounded-lg bg-slate-100 p-4 text-center text-xs text-slate-600 dark:bg-white/5 dark:text-slate-400">
          {t.controls.noLayers}
        </p>
      ) : (
        <div className="space-y-1.5">
          {panelLayers.map((layer) => {
            const selected = layer.id === selectedLayerId;
            return (
              <div
                key={layer.id}
                className={`flex items-center justify-between gap-1 rounded-lg border p-1 transition ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedLayerId(layer.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {layer.kind === 'image' ? (
                    <ImageIcon className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                  ) : (
                    <Type className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  )}
                  <span className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                    {layer.name}
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-0.5 pr-1">
                  <button
                    type="button"
                    onClick={() => reorderLayer(layer.id, 'up')}
                    aria-label={`${t.controls.bringForward} ${layer.name}`}
                    title={t.controls.bringForward}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderLayer(layer.id, 'down')}
                    aria-label={`${t.controls.sendBackward} ${layer.name}`}
                    title={t.controls.sendBackward}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateLayer(layer.id, { visible: !layer.visible })
                    }
                    aria-label={layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    {layer.visible ? (
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 opacity-55" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateLayer(layer.id, { locked: !layer.locked })
                    }
                    aria-label={layer.locked ? `Unlock ${layer.name}` : `Lock ${layer.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    {layer.locked ? (
                      <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateLayer(layer.id)}
                    aria-label={`${t.common.duplicate} ${layer.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLayer(layer.id)}
                    aria-label={`${t.common.delete} ${layer.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded text-rose-600 hover:bg-rose-500/15 dark:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
