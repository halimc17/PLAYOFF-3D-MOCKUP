import type {
  DesignLayer,
  JerseyDesignState,
  PanelId,
  UploadedAsset,
} from '../types/design';
import { drawPanelPattern } from './patterns';

const imageCache = new Map<string, HTMLImageElement>();
const pendingLoads = new Map<string, Promise<HTMLImageElement | null>>();

export function preloadAssetImage(asset: UploadedAsset): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(asset.id);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  const existingPromise = pendingLoads.get(asset.id);
  if (existingPromise) return existingPromise;

  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(asset.id, img);
      pendingLoads.delete(asset.id);
      resolve(img);
    };
    img.onerror = () => {
      pendingLoads.delete(asset.id);
      resolve(null);
    };
    img.src = asset.dataUrl;
  });
  pendingLoads.set(asset.id, p);
  return p;
}

export function getCachedAssetImage(assetId: string): HTMLImageElement | null {
  const img = imageCache.get(assetId);
  if (img && img.complete && img.naturalWidth > 0) return img;
  return null;
}

function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
  strokeWidth: number,
) {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((acc, w) => acc + w, 0) +
    Math.max(0, chars.length - 1) * letterSpacing;

  let cursorX = -totalWidth / 2;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const w = widths[i];
    const cx = cursorX + w / 2;
    if (strokeWidth > 0) {
      ctx.strokeText(ch, cx, 0);
    }
    ctx.fillText(ch, cx, 0);
    cursorX += w + letterSpacing;
  }
}

/**
 * Composites a complete jersey panel (Base Color + Pattern + All Visible Layers)
 * onto a target 2D canvas at any size (1024px live 3D, 2048px production export).
 */
export async function renderPanelToCanvas(
  canvas: HTMLCanvasElement,
  panelId: PanelId,
  design: JerseyDesignState,
  assets: UploadedAsset[],
  size: number,
): Promise<void> {
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const panelCfg = design.panels[panelId];
  drawPanelPattern(ctx, size, panelCfg.baseColor, panelCfg.pattern);

  // Subtle realistic seam shading along edges for collar & cuffs
  if (panelId === 'collar' || panelId === 'cuffs') {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = Math.max(2, size * 0.008);
    ctx.strokeRect(0, 0, size, size);
    ctx.restore();
    return;
  }

  const panelLayers: DesignLayer[] = design.layers.filter(
    (l) => l.panelId === panelId && l.visible,
  );

  // Ensure all image assets referenced by this panel are loaded
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  for (const layer of panelLayers) {
    if (layer.kind === 'image') {
      const asset = assetMap.get(layer.assetId);
      if (asset && !getCachedAssetImage(asset.id)) {
        await preloadAssetImage(asset);
      }
    }
  }

  const scaleFactor = size / 1024;

  for (const layer of panelLayers) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
    const cx = layer.x * size;
    const cy = layer.y * size;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);

    if (layer.kind === 'image') {
      const img = getCachedAssetImage(layer.assetId);
      if (img) {
        const drawW = Math.max(4, layer.scaleX * size);
        const drawH = Math.max(4, layer.scaleY * size);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      }
    } else if (layer.kind === 'text') {
      const content = layer.uppercase ? layer.text.toUpperCase() : layer.text;
      const lines = content.split('\n');
      const pxFontSize = Math.max(10, layer.fontSize * scaleFactor);
      const pxStroke = layer.strokeWidth * scaleFactor;
      const pxSpacing = layer.letterSpacing * scaleFactor;

      ctx.scale(layer.scaleX, layer.scaleY);
      ctx.font = `700 ${pxFontSize}px ${layer.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = layer.fill;
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = pxStroke * 2;
      ctx.lineJoin = 'round';

      const lineHeight = pxFontSize * 1.1;
      const startY = -((lines.length - 1) * lineHeight) / 2;

      for (let i = 0; i < lines.length; i++) {
        ctx.save();
        ctx.translate(0, startY + i * lineHeight);
        if (Math.abs(pxSpacing) > 0.1) {
          drawTextWithLetterSpacing(ctx, lines[i], pxSpacing, pxStroke);
        } else {
          if (pxStroke > 0) ctx.strokeText(lines[i], 0, 0);
          ctx.fillText(lines[i], 0, 0);
        }
        ctx.restore();
      }
    }

    ctx.restore();
  }
}

/**
 * Generates an offscreen high-resolution PNG DataURL for a given panel (for Production Export).
 */
export async function exportPanelHighResPng(
  panelId: PanelId,
  design: JerseyDesignState,
  assets: UploadedAsset[],
  size = 2048,
): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderPanelToCanvas(canvas, panelId, design, assets, size);
  return canvas.toDataURL('image/png');
}
