import { useRef, useState } from 'react';
import { Crosshair, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { translations } from '../../config/i18n';
import type { ImageLayer, UploadedAsset } from '../../types/design';

function readImageFile(file: File): Promise<UploadedAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: file.type || 'image/png',
          width: img.naturalWidth || 512,
          height: img.naturalHeight || 512,
          dataUrl,
          createdAt: Date.now(),
        });
      };
      img.onerror = () => {
        resolve({
          id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: file.type || 'image/svg+xml',
          width: 512,
          height: 512,
          dataUrl,
          createdAt: Date.now(),
        });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export function UploadAssetTool() {
  const assets = useDesignStore((s) => s.assets);
  const design = useDesignStore((s) => s.design);
  const activeEditablePanel = useDesignStore((s) => s.activeEditablePanel);
  const selectedLayerId = useDesignStore((s) => s.selectedLayerId);
  const placeOn3DMode = useDesignStore((s) => s.placeOn3DMode);
  const language = useDesignStore((s) => s.language);

  const addUploadedAsset = useDesignStore((s) => s.addUploadedAsset);
  const removeUploadedAsset = useDesignStore((s) => s.removeUploadedAsset);
  const addImageLayer = useDesignStore((s) => s.addImageLayer);
  const updateLayer = useDesignStore((s) => s.updateLayer);
  const deleteLayer = useDesignStore((s) => s.deleteLayer);
  const setPlaceOn3DMode = useDesignStore((s) => s.setPlaceOn3DMode);

  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedImageLayer = design.layers.find(
    (l): l is ImageLayer => l.id === selectedLayerId && l.kind === 'image',
  );

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    let skipped = 0;

    for (const file of Array.from(fileList)) {
      const isSupported =
        file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg');
      if (!isSupported) {
        skipped++;
        continue;
      }
      try {
        const asset = await readImageFile(file);
        addUploadedAsset(asset);
        addImageLayer(asset.id, activeEditablePanel);
      } catch {
        skipped++;
      }
    }

    if (skipped > 0) {
      setUploadError(
        language === 'id'
          ? 'Format file tidak didukung. Gunakan file PNG, JPG, WEBP, atau SVG.'
          : 'Unsupported file format. Upload a PNG, JPG, WEBP, or SVG file.',
      );
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition ${
            dragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-300 bg-slate-50 hover:border-emerald-600/70 dark:border-white/15 dark:bg-white/5 dark:hover:border-emerald-400/60'
          }`}
        >
          <UploadCloud className="mb-2 h-7 w-7 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {t.controls.uploadHint}
          </span>
          <span className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {t.controls.uploadSubhint}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {uploadError && (
          <p
            role="alert"
            className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] font-medium text-rose-700 dark:text-rose-300"
          >
            {uploadError}
          </p>
        )}
      </div>

      {selectedImageLayer && (
        <section className="space-y-3 rounded-xl border border-emerald-600/30 bg-emerald-500/5 p-3">
          <div className="flex items-center justify-between gap-1.5">
            <span className="truncate text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {selectedImageLayer.name}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-pressed={placeOn3DMode}
                onClick={() => setPlaceOn3DMode(!placeOn3DMode)}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                  placeOn3DMode
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200'
                }`}
              >
                <Crosshair className="h-3 w-3" aria-hidden="true" />
                {t.controls.placeOn3D}
              </button>
              <button
                type="button"
                onClick={() => deleteLayer(selectedImageLayer.id)}
                aria-label={t.common.delete}
                title={t.common.delete}
                className="rounded-md bg-rose-500/15 p-1 text-rose-600 transition hover:bg-rose-500/25 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="img-scale" className="text-slate-700 dark:text-slate-300">
                  {t.controls.patternScale}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {Math.round(selectedImageLayer.scaleX * 100)}%
                </span>
              </div>
              <input
                id="img-scale"
                type="range"
                min={0.06}
                max={0.95}
                step={0.02}
                value={selectedImageLayer.scaleX}
                onChange={(e) => {
                  const newW = Number(e.target.value);
                  updateLayer(selectedImageLayer.id, {
                    scaleX: newW,
                    scaleY: newW / (selectedImageLayer.aspectRatio || 1),
                  });
                }}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="img-rot" className="text-slate-700 dark:text-slate-300">
                  {t.controls.rotation}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {Math.round(selectedImageLayer.rotation)}°
                </span>
              </div>
              <input
                id="img-rot"
                type="range"
                min={-180}
                max={180}
                step={1}
                value={selectedImageLayer.rotation}
                onChange={(e) =>
                  updateLayer(selectedImageLayer.id, {
                    rotation: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="img-opacity" className="text-slate-700 dark:text-slate-300">
                  {t.controls.opacity}
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {Math.round(selectedImageLayer.opacity * 100)}%
                </span>
              </div>
              <input
                id="img-opacity"
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={selectedImageLayer.opacity}
                onChange={(e) =>
                  updateLayer(selectedImageLayer.id, {
                    opacity: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-400">
            {t.controls.uploadedLibrary} ({assets.length})
          </span>
          <span className="shrink-0 whitespace-nowrap rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            {t.panels[activeEditablePanel]}
          </span>
        </div>

        {assets.length === 0 ? (
          <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-4 text-center text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {t.controls.noAssets}
          </p>
        ) : (
          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:10px_10px] p-1.5 dark:border-white/10 dark:bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)]">
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    width={48}
                    height={48}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="min-w-0">
                    <p
                      title={asset.name}
                      className="truncate text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100"
                    >
                      {asset.name}
                    </p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                      {asset.width} × {asset.height} px
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addImageLayer(asset.id, activeEditablePanel)}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" aria-hidden="true" />
                      <span>{t.controls.addToPanel}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeUploadedAsset(asset.id)}
                      aria-label={`${t.common.delete} ${asset.name}`}
                      title={t.common.delete}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 dark:border-white/10 dark:text-slate-400 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
