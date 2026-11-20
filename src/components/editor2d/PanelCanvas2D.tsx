import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, FabricImage, FabricText, type FabricObject } from 'fabric';
import {
  AlignHorizontalJustifyCenter,
  Copy,
  Crosshair,
  FlipHorizontal,
  FlipVertical,
  Trash2,
} from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { translations } from '../../config/i18n';
import { getJerseyModel } from '../../config/modelManifest';
import { drawPanelPattern } from '../../engine/patterns';
import { preloadAssetImage } from '../../engine/textureCompositor';
import type { EditablePanelId, ImageLayer, TextLayer } from '../../types/design';

const CANVAS_SIZE = 512;

interface TaggedFabricObject extends FabricObject {
  layerId?: string;
}

const PANEL_TABS: EditablePanelId[] = [
  'front',
  'back',
  'leftSleeve',
  'rightSleeve',
];

export function PanelCanvas2D() {
  const design = useDesignStore((s) => s.design);
  const assets = useDesignStore((s) => s.assets);
  const activeEditablePanel = useDesignStore((s) => s.activeEditablePanel);
  const selectedLayerId = useDesignStore((s) => s.selectedLayerId);
  const language = useDesignStore((s) => s.language);
  const placeOn3DMode = useDesignStore((s) => s.placeOn3DMode);

  const setActivePanel = useDesignStore((s) => s.setActivePanel);
  const setSelectedLayerId = useDesignStore((s) => s.setSelectedLayerId);
  const updateLayer = useDesignStore((s) => s.updateLayer);
  const deleteLayer = useDesignStore((s) => s.deleteLayer);
  const duplicateLayer = useDesignStore((s) => s.duplicateLayer);
  const centerLayer = useDesignStore((s) => s.centerLayer);
  const mirrorLayerToOppositeSleeve = useDesignStore(
    (s) => s.mirrorLayerToOppositeSleeve,
  );
  const setPlaceOn3DMode = useDesignStore((s) => s.setPlaceOn3DMode);

  const t = translations[language];

  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const isUserInteractingRef = useRef(false);
  const [snapCenterActive, setSnapCenterActive] = useState(false);

  const modelEntry = getJerseyModel(design.sleeveLength, design.collarType);
  const safeZone = modelEntry.panels[activeEditablePanel].safeZone;

  const selectedLayer = design.layers.find(
    (l) => l.id === selectedLayerId && l.panelId === activeEditablePanel,
  );

  // 1. Render Base Color + Pattern + Silhouette/SafeZone Guide on the underlying canvas
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const panelCfg = design.panels[activeEditablePanel];
    drawPanelPattern(ctx, CANVAS_SIZE, panelCfg.baseColor, panelCfg.pattern);

    // Subtle neckline visual indicator for front/back orientation
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    if (activeEditablePanel === 'front') {
      ctx.beginPath();
      if (design.collarType === 'v-neck') {
        ctx.moveTo(CANVAS_SIZE * 0.34, 0);
        ctx.lineTo(CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.16);
        ctx.lineTo(CANVAS_SIZE * 0.66, 0);
      } else {
        ctx.arc(CANVAS_SIZE * 0.5, 0, CANVAS_SIZE * 0.14, 0, Math.PI);
      }
      ctx.stroke();
    } else if (activeEditablePanel === 'back') {
      ctx.beginPath();
      ctx.arc(CANVAS_SIZE * 0.5, 0, CANVAS_SIZE * 0.14, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.stroke();
    }

    // Safe Print Area dashed border
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.72)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(
      safeZone.left * CANVAS_SIZE,
      safeZone.top * CANVAS_SIZE,
      safeZone.width * CANVAS_SIZE,
      safeZone.height * CANVAS_SIZE,
    );

    // Subtle center crosshair guide
    ctx.strokeStyle = snapCenterActive
      ? 'rgba(16, 185, 129, 0.95)'
      : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = snapCenterActive ? 2 : 1;
    ctx.setLineDash(snapCenterActive ? [] : [3, 6]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.stroke();
    ctx.restore();
  }, [
    design.panels,
    design.collarType,
    activeEditablePanel,
    safeZone,
    snapCenterActive,
  ]);

  // 2. Initialize Fabric.js Canvas once
  useEffect(() => {
    const el = fabricElRef.current;
    if (!el) return;

    const fc = new FabricCanvas(el, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true,
    });
    fc.setDimensions({ width: '100%', height: '100%' }, { cssOnly: true });
    fabricRef.current = fc;

    const commitObjectToStore = (obj: TaggedFabricObject, recordHistory: boolean) => {
      const layerId = obj.layerId;
      if (!layerId) return;
      const store = useDesignStore.getState();
      const layer = store.design.layers.find((l) => l.id === layerId);
      if (!layer) return;

      const x = Math.max(0.02, Math.min(0.98, (obj.left ?? CANVAS_SIZE / 2) / CANVAS_SIZE));
      const y = Math.max(0.02, Math.min(0.98, (obj.top ?? CANVAS_SIZE / 2) / CANVAS_SIZE));
      const rotation = obj.angle ?? 0;

      if (layer.kind === 'image') {
        const scaledW = (obj.width ?? 100) * (obj.scaleX ?? 1);
        const scaledH = (obj.height ?? 100) * (obj.scaleY ?? 1);
        store.updateLayer(
          layerId,
          {
            x,
            y,
            scaleX: Math.max(0.04, scaledW / CANVAS_SIZE),
            scaleY: Math.max(0.04, scaledH / CANVAS_SIZE),
            rotation,
          },
          recordHistory,
        );
      } else {
        store.updateLayer(
          layerId,
          {
            x,
            y,
            scaleX: Math.max(0.15, obj.scaleX ?? 1),
            scaleY: Math.max(0.15, obj.scaleY ?? 1),
            rotation,
          },
          recordHistory,
        );
      }
    };

    fc.on('selection:created', (e) => {
      const target = e.selected?.[0] as TaggedFabricObject | undefined;
      if (target?.layerId) {
        useDesignStore.getState().setSelectedLayerId(target.layerId);
      }
    });

    fc.on('selection:updated', (e) => {
      const target = e.selected?.[0] as TaggedFabricObject | undefined;
      if (target?.layerId) {
        useDesignStore.getState().setSelectedLayerId(target.layerId);
      }
    });

    fc.on('selection:cleared', () => {
      if (!isUserInteractingRef.current) {
        useDesignStore.getState().setSelectedLayerId(null);
      }
    });

    fc.on('object:moving', (e) => {
      const target = e.target as TaggedFabricObject | undefined;
      if (!target) return;
      isUserInteractingRef.current = true;
      // Snap-to-center horizontally
      if (Math.abs((target.left ?? 0) - CANVAS_SIZE / 2) < 9) {
        target.set('left', CANVAS_SIZE / 2);
        setSnapCenterActive(true);
      } else {
        setSnapCenterActive(false);
      }
      commitObjectToStore(target, false);
    });

    fc.on('object:scaling', (e) => {
      const target = e.target as TaggedFabricObject | undefined;
      if (!target) return;
      isUserInteractingRef.current = true;
      commitObjectToStore(target, false);
    });

    fc.on('object:rotating', (e) => {
      const target = e.target as TaggedFabricObject | undefined;
      if (!target) return;
      isUserInteractingRef.current = true;
      commitObjectToStore(target, false);
    });

    fc.on('object:modified', (e) => {
      const target = e.target as TaggedFabricObject | undefined;
      setSnapCenterActive(false);
      if (target) {
        commitObjectToStore(target, true);
      }
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 40);
    });

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
  }, []);

  // 3. Synchronize Zustand layers -> Fabric.js objects whenever panel/layers change externally
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || isUserInteractingRef.current) return;

    let cancelled = false;
    const syncLayers = async () => {
      const panelLayers = design.layers.filter(
        (l) => l.panelId === activeEditablePanel && l.visible,
      );
      const assetMap = new Map(assets.map((a) => [a.id, a]));

      fc.clear();
      fc.backgroundColor = 'transparent';

      let activeFabricObj: TaggedFabricObject | null = null;

      for (const layer of panelLayers) {
        if (cancelled) return;

        let obj: TaggedFabricObject | null = null;

        if (layer.kind === 'image') {
          const imgLayer = layer as ImageLayer;
          const asset = assetMap.get(imgLayer.assetId);
          if (!asset) continue;
          const htmlImg = await preloadAssetImage(asset);
          if (!htmlImg || cancelled) continue;

          const fImg = new FabricImage(htmlImg, {
            left: imgLayer.x * CANVAS_SIZE,
            top: imgLayer.y * CANVAS_SIZE,
            originX: 'center',
            originY: 'center',
            angle: imgLayer.rotation,
            opacity: imgLayer.opacity,
            flipX: imgLayer.flipX,
            flipY: imgLayer.flipY,
            selectable: !imgLayer.locked,
            evented: !imgLayer.locked,
            cornerColor: '#10b981',
            cornerStrokeColor: '#0f172a',
            borderColor: '#10b981',
            transparentCorners: false,
            cornerSize: 10,
          }) as TaggedFabricObject;

          const targetW = imgLayer.scaleX * CANVAS_SIZE;
          const targetH = imgLayer.scaleY * CANVAS_SIZE;
          fImg.set({
            scaleX: targetW / (htmlImg.naturalWidth || 1),
            scaleY: targetH / (htmlImg.naturalHeight || 1),
          });
          fImg.layerId = imgLayer.id;
          obj = fImg;
        } else {
          const txtLayer = layer as TextLayer;
          const content = txtLayer.uppercase
            ? txtLayer.text.toUpperCase()
            : txtLayer.text;
          const fText = new FabricText(content || 'TEXT', {
            left: txtLayer.x * CANVAS_SIZE,
            top: txtLayer.y * CANVAS_SIZE,
            originX: 'center',
            originY: 'center',
            fontFamily: txtLayer.fontFamily,
            fontSize: txtLayer.fontSize * (CANVAS_SIZE / 1024),
            fontWeight: '700',
            fill: txtLayer.fill,
            stroke: txtLayer.strokeWidth > 0 ? txtLayer.stroke : undefined,
            strokeWidth: txtLayer.strokeWidth * (CANVAS_SIZE / 1024) * 1.4,
            paintFirst: 'stroke',
            charSpacing: txtLayer.letterSpacing * 18,
            scaleX: txtLayer.scaleX,
            scaleY: txtLayer.scaleY,
            angle: txtLayer.rotation,
            opacity: txtLayer.opacity,
            flipX: txtLayer.flipX,
            flipY: txtLayer.flipY,
            textAlign: 'center',
            selectable: !txtLayer.locked,
            evented: !txtLayer.locked,
            cornerColor: '#10b981',
            cornerStrokeColor: '#0f172a',
            borderColor: '#10b981',
            transparentCorners: false,
            cornerSize: 10,
          }) as TaggedFabricObject;
          fText.layerId = txtLayer.id;
          obj = fText;
        }

        if (obj) {
          fc.add(obj);
          if (layer.id === selectedLayerId) {
            activeFabricObj = obj;
          }
        }
      }

      if (activeFabricObj) {
        fc.setActiveObject(activeFabricObj);
      }
      fc.requestRenderAll();
    };

    syncLayers();
    return () => {
      cancelled = true;
    };
  }, [design.layers, assets, activeEditablePanel, selectedLayerId]);

  return (
    <div className="flex h-full w-full flex-col bg-slate-100 dark:bg-[#0f131a]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#131820]">
        <div
          role="tablist"
          aria-label={language === 'id' ? 'Pilih panel 2D' : 'Select 2D panel'}
          className="flex items-center gap-1 overflow-x-auto"
        >
          {PANEL_TABS.map((pid) => {
            const active = activeEditablePanel === pid;
            return (
              <button
                key={pid}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActivePanel(pid)}
                className={`min-h-[30px] whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  active
                    ? 'bg-emerald-500 font-semibold text-slate-950'
                    : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {t.panels[pid]}
              </button>
            );
          })}
        </div>

        <span className="hidden items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 sm:flex">
          <span className="h-2 w-2 rounded-sm border border-dashed border-emerald-600 dark:border-emerald-400" />
          {t.controls.safeZoneLabel}
        </span>
      </div>

      {/* Main Responsive Square Canvas Stage */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-3 sm:p-4">
        <div
          className="relative aspect-square w-full max-w-[460px] overflow-hidden rounded-xl shadow-xl ring-1 ring-slate-300 dark:ring-white/15"
          style={{ maxHeight: 'min(100%, 460px)' }}
        >
          <canvas
            ref={bgCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 h-full w-full [&_.canvas-container]:!h-full [&_.canvas-container]:!w-full [&_canvas]:!h-full [&_canvas]:!w-full">
            <canvas ref={fabricElRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
          </div>
        </div>
      </div>

      <div className="flex min-h-[44px] items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-[#131820]">
        {selectedLayer ? (
          <>
            <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
              {selectedLayer.name}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => centerLayer(selectedLayer.id)}
                aria-label={t.common.center}
                title={t.common.center}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateLayer(selectedLayer.id, { flipX: !selectedLayer.flipX })
                }
                aria-label={t.controls.flipH}
                title={t.controls.flipH}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <FlipHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateLayer(selectedLayer.id, { flipY: !selectedLayer.flipY })
                }
                aria-label={t.controls.flipV}
                title={t.controls.flipV}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <FlipVertical className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => duplicateLayer(selectedLayer.id)}
                aria-label={t.common.duplicate}
                title={t.common.duplicate}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {(selectedLayer.panelId === 'leftSleeve' ||
                selectedLayer.panelId === 'rightSleeve') && (
                <button
                  type="button"
                  onClick={() => mirrorLayerToOppositeSleeve(selectedLayer.id)}
                  aria-label={t.common.mirrorSleeve}
                  title={t.common.mirrorSleeve}
                  className="rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                >
                  L/R
                </button>
              )}
              <button
                type="button"
                onClick={() => setPlaceOn3DMode(!placeOn3DMode)}
                aria-pressed={placeOn3DMode}
                aria-label={t.controls.placeOn3D}
                title={t.controls.placeOn3DHint}
                className={`flex h-8 w-8 items-center justify-center rounded-md ${
                  placeOn3DMode
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => deleteLayer(selectedLayer.id)}
                aria-label={t.common.delete}
                title={t.common.delete}
                className="flex h-8 w-8 items-center justify-center rounded-md text-rose-600 hover:bg-rose-500/15 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <span className="text-[11px] text-slate-600 dark:text-slate-400">
            {language === 'id'
              ? `${t.panels[activeEditablePanel]}: seret, ubah ukuran, dan putar objek di kanvas 2D.`
              : `${t.panels[activeEditablePanel]}: drag, resize, and rotate objects on the 2D canvas.`}
          </span>
        )}
      </div>
    </div>
  );
}
