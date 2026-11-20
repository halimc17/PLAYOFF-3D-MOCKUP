import { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2, Type } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { brandConfig } from '../../config/brandConfig';
import { translations } from '../../config/i18n';
import type { TextLayer } from '../../types/design';

export function TextNumberTool() {
  const design = useDesignStore((s) => s.design);
  const selectedLayerId = useDesignStore((s) => s.selectedLayerId);
  const activeEditablePanel = useDesignStore((s) => s.activeEditablePanel);
  const language = useDesignStore((s) => s.language);

  const addTextLayer = useDesignStore((s) => s.addTextLayer);
  const addQuickTextPreset = useDesignStore((s) => s.addQuickTextPreset);
  const updateLayer = useDesignStore((s) => s.updateLayer);
  const deleteLayer = useDesignStore((s) => s.deleteLayer);
  const setSelectedLayerId = useDesignStore((s) => s.setSelectedLayerId);
  const setCameraPreset = useDesignStore((s) => s.setCameraPreset);

  const t = translations[language];
  const [newText, setNewText] = useState('GARUDA FC');

  const allTextLayers = design.layers.filter(
    (l): l is TextLayer => l.kind === 'text',
  );

  const selectedTextLayer = allTextLayers.find(
    (l) => l.id === selectedLayerId,
  );

  const handleAddCustom = () => {
    if (!newText.trim()) return;
    addTextLayer({
      panelId: activeEditablePanel,
      text: newText.trim(),
      name: newText.trim().slice(0, 18),
    });
  };

  const handleSelectText = (layer: TextLayer) => {
    setSelectedLayerId(layer.id);
    if (layer.panelId === 'front') setCameraPreset('front');
    else if (layer.panelId === 'back') setCameraPreset('back');
    else if (layer.panelId === 'leftSleeve') setCameraPreset('left');
    else if (layer.panelId === 'rightSleeve') setCameraPreset('right');
  };

  return (
    <div className="space-y-5">
      <section className="space-y-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-400">
          {t.controls.quickPresets}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              ['teamName', t.controls.presetTeamName],
              ['chestNumber', t.controls.presetChestNumber],
              ['backName', t.controls.presetBackName],
              ['backNumber', t.controls.presetBackNumber],
            ] as const
          ).map(([presetKey, label]) => (
            <button
              key={presetKey}
              type="button"
              onClick={() => addQuickTextPreset(presetKey)}
              className="flex min-h-[36px] items-center gap-1 whitespace-nowrap rounded-lg bg-slate-100 px-2 py-2 text-left text-[11px] font-medium text-slate-800 transition hover:bg-emerald-500/15 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
            >
              <Plus className="h-3 w-3 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="new-text-input"
            className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-400"
          >
            {t.controls.addText}
          </label>
          <span className="shrink-0 whitespace-nowrap rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            {t.panels[activeEditablePanel]}
          </span>
        </div>
        <div className="flex gap-1.5">
          <input
            id="new-text-input"
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder="SPONSOR / NAMA"
            className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            aria-label={t.controls.addText}
            className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {language === 'id' ? 'Teks pada Model' : 'Text on Model'} ({allTextLayers.length})
        </span>

        {allTextLayers.length === 0 ? (
          <p className="rounded-lg bg-slate-100 p-3 text-center text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-400">
            {language === 'id'
              ? 'Belum ada teks pada jersey. Tambahkan lewat preset atau input di atas.'
              : 'No text on the jersey yet. Add one using presets or the field above.'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {allTextLayers.map((layer) => {
              const selected = layer.id === selectedLayerId;
              const display = layer.uppercase ? layer.text.toUpperCase() : layer.text;
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
                    onClick={() => handleSelectText(layer)}
                    className="min-w-0 flex-1 rounded px-2 py-1 text-left hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {display}
                    </p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      {t.panels[layer.panelId]}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5 pr-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateLayer(layer.id, { visible: !layer.visible })
                      }
                      aria-label={
                        layer.visible
                          ? `Sembunyikan ${display}`
                          : `Tampilkan ${display}`
                      }
                      className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      {layer.visible ? (
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 opacity-55" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLayer(layer.id)}
                      aria-label={`${t.common.delete} ${display}`}
                      title={t.common.delete}
                      className="flex h-8 w-8 items-center justify-center rounded text-rose-600 hover:bg-rose-500/15 dark:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedTextLayer && (
        <section className="space-y-3 rounded-xl border border-emerald-600/30 bg-emerald-500/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <Type className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.controls.selectedLayer}</span>
            </div>
            <button
              type="button"
              onClick={() => deleteLayer(selectedTextLayer.id)}
              className="flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-500/25 dark:text-rose-400"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              <span>{t.common.delete}</span>
            </button>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="selected-text-content"
              className="text-[11px] text-slate-600 dark:text-slate-400"
            >
              {t.controls.textContent}
            </label>
            <input
              id="selected-text-content"
              type="text"
              value={selectedTextLayer.text}
              onChange={(e) =>
                updateLayer(selectedTextLayer.id, {
                  text: e.target.value,
                  name: e.target.value.slice(0, 20) || 'Text',
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-950 focus:border-emerald-600 dark:border-white/15 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="selected-text-font"
              className="text-[11px] text-slate-600 dark:text-slate-400"
            >
              {t.controls.fontFamily}
            </label>
            <select
              id="selected-text-font"
              value={selectedTextLayer.fontFamily}
              onChange={(e) =>
                updateLayer(selectedTextLayer.id, { fontFamily: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-950 focus:border-emerald-600 dark:border-white/15 dark:bg-slate-900 dark:text-white"
            >
              {brandConfig.sportFonts.map((font) => (
                <option key={font.id} value={font.family}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor="selected-text-fill"
                className="text-[11px] text-slate-600 dark:text-slate-400"
              >
                {t.controls.textColor}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="selected-text-fill"
                  type="color"
                  value={selectedTextLayer.fill}
                  onChange={(e) =>
                    updateLayer(selectedTextLayer.id, { fill: e.target.value })
                  }
                  className="h-7 w-9 rounded border border-slate-300 bg-transparent p-0.5 dark:border-white/15"
                />
                <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
                  {selectedTextLayer.fill.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="selected-text-stroke"
                className="text-[11px] text-slate-600 dark:text-slate-400"
              >
                {t.controls.outlineColor}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="selected-text-stroke"
                  type="color"
                  value={selectedTextLayer.stroke}
                  onChange={(e) =>
                    updateLayer(selectedTextLayer.id, { stroke: e.target.value })
                  }
                  className="h-7 w-9 rounded border border-slate-300 bg-transparent p-0.5 dark:border-white/15"
                />
                <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
                  {selectedTextLayer.stroke.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="txt-size" className="text-slate-700 dark:text-slate-300">
                  {t.controls.fontSize}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {selectedTextLayer.fontSize}px
                </span>
              </div>
              <input
                id="txt-size"
                type="range"
                min={28}
                max={340}
                step={2}
                value={selectedTextLayer.fontSize}
                onChange={(e) =>
                  updateLayer(selectedTextLayer.id, {
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="txt-stroke" className="text-slate-700 dark:text-slate-300">
                  {t.controls.outlineWidth}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {selectedTextLayer.strokeWidth}px
                </span>
              </div>
              <input
                id="txt-stroke"
                type="range"
                min={0}
                max={20}
                step={1}
                value={selectedTextLayer.strokeWidth}
                onChange={(e) =>
                  updateLayer(selectedTextLayer.id, {
                    strokeWidth: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="txt-spacing" className="text-slate-700 dark:text-slate-300">
                  {t.controls.letterSpacing}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {selectedTextLayer.letterSpacing}
                </span>
              </div>
              <input
                id="txt-spacing"
                type="range"
                min={0}
                max={24}
                step={1}
                value={selectedTextLayer.letterSpacing}
                onChange={(e) =>
                  updateLayer(selectedTextLayer.id, {
                    letterSpacing: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>

            <label className="flex items-center justify-between pt-1 text-xs text-slate-800 dark:text-slate-200">
              <span>{t.controls.uppercase}</span>
              <input
                type="checkbox"
                checked={selectedTextLayer.uppercase}
                onChange={(e) =>
                  updateLayer(selectedTextLayer.id, {
                    uppercase: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded accent-emerald-500"
              />
            </label>
          </div>
        </section>
      )}
    </div>
  );
}
