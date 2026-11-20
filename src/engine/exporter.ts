import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type {
  JerseyDesignState,
  PanelId,
  SerializedJerseyProject,
  UploadedAsset,
} from '../types/design';
import { brandConfig } from '../config/brandConfig';
import { exportPanelHighResPng } from './textureCompositor';
import {
  captureFourAngleRenders,
  type FourAngleRenders,
} from './snapshotBridge';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToCmyk(r: number, g: number, b: number): string {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  if (k >= 0.999) return 'C:0 M:0 Y:0 K:100';
  const c = Math.round(((1 - rf - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gf - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bf - k) / (1 - k)) * 100);
  return `C:${c} M:${m} Y:${y} K:${Math.round(k * 100)}`;
}

function formatColorSpec(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${hex.toUpperCase()} | RGB(${r},${g},${b}) | ${rgbToCmyk(r, g, b)}`;
}

function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

function mimeToExt(mime: string, fallbackName: string): string {
  if (mime.includes('svg')) return 'svg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  const dot = fallbackName.lastIndexOf('.');
  return dot >= 0 ? fallbackName.slice(dot + 1) : 'png';
}

function sanitizeFileName(name: string): string {
  return (name || 'jersey-kit')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .slice(0, 48);
}

const PANEL_LABELS: Record<PanelId, string> = {
  front: 'Front Body (Depan)',
  back: 'Back Body (Belakang)',
  leftSleeve: 'Left Sleeve (Lengan Kiri)',
  rightSleeve: 'Right Sleeve (Lengan Kanan)',
  collar: 'Collar (Kerah)',
  cuffs: 'Cuffs & Hem Trim (Rib/List)',
};

export async function generateTechPackPdfBlob(
  design: JerseyDesignState,
  assets: UploadedAsset[],
  renders: FourAngleRenders | null,
): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const nowStr = new Date().toLocaleString('id-ID');

  // Page 1: Header, production brief, and 4-angle 3D renders
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${brandConfig.appName}: PRODUCTION TECH PACK`, margin, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Project: ${design.projectName}  |  Generated: ${nowStr}`,
    margin,
    21,
  );

  // Brief metadata box
  let y = 34;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentW, 38, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SPECIFICATION & ORDER BRIEF', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const col2X = margin + contentW / 2 + 2;
  doc.text(`Team / Club: ${design.brief.teamName || '-'}`, margin + 4, y + 14);
  doc.text(`Contact / PIC: ${design.brief.customerName || '-'}`, col2X, y + 14);
  doc.text(
    `Sport: ${design.sport.toUpperCase()}  |  Cut: ${design.sleeveLength.toUpperCase()} SLEEVE`,
    margin + 4,
    y + 20,
  );
  doc.text(
    `Collar: ${design.collarType.toUpperCase()}  |  Est. Qty: ${design.brief.quantity || 1} pcs`,
    col2X,
    y + 20,
  );
  doc.text(`Fabric: ${design.brief.fabricOption}`, margin + 4, y + 26);

  const notes = design.brief.notes?.trim() || 'No special notes provided.';
  const noteLines = doc.splitTextToSize(`Notes: ${notes}`, contentW - 8);
  doc.text(noteLines.slice(0, 2), margin + 4, y + 32);

  // 4-Angle 3D Previews
  y += 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3D MULTI-ANGLE PREVIEW', margin, y);
  y += 4;

  const boxW = (contentW - 6) / 2;
  const boxH = 88;
  const views: Array<{ label: string; img?: string; x: number; y: number }> = [
    { label: 'FRONT VIEW (DEPAN)', img: renders?.front, x: margin, y },
    { label: 'BACK VIEW (BELAKANG)', img: renders?.back, x: margin + boxW + 6, y },
    {
      label: 'LEFT SIDE (SAMPING KIRI)',
      img: renders?.left,
      x: margin,
      y: y + boxH + 6,
    },
    {
      label: 'RIGHT SIDE (SAMPING KANAN)',
      img: renders?.right,
      x: margin + boxW + 6,
      y: y + boxH + 6,
    },
  ];

  for (const v of views) {
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(v.x, v.y, boxW, boxH, 2, 2, 'FD');
    if (v.img) {
      doc.addImage(v.img, 'PNG', v.x + 2, v.y + 2, boxW - 4, boxH - 11, undefined, 'FAST');
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(v.x, v.y + boxH - 8, boxW, 8, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(v.label, v.x + boxW / 2, v.y + boxH - 2.8, { align: 'center' });
  }

  // Page 2: Color breakdown, pattern specs, and layer manifest
  doc.addPage();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PANEL COLORS, PATTERNS & GRAPHICS MANIFEST', margin, 11.5);

  y = 26;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. PANEL COLOR & PATTERN BREAKDOWN', margin, y);
  y += 5;

  const panelIds: PanelId[] = [
    'front',
    'back',
    'leftSleeve',
    'rightSleeve',
    'collar',
    'cuffs',
  ];

  for (const pid of panelIds) {
    const p = design.panels[pid];
    const baseRgb = hexToRgb(p.baseColor);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentW, 15, 1.5, 1.5, 'FD');

    // Swatch
    doc.setFillColor(baseRgb.r, baseRgb.g, baseRgb.b);
    doc.setDrawColor(100, 116, 139);
    doc.rect(margin + 3, y + 3, 9, 9, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(PANEL_LABELS[pid], margin + 15, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Base: ${formatColorSpec(p.baseColor)}`, margin + 15, y + 11.8);

    const patText =
      p.pattern.type === 'solid'
        ? 'Pattern: Solid (Polos)'
        : `Pattern: ${p.pattern.type} | C1: ${p.pattern.color.toUpperCase()} | C2: ${p.pattern.secondaryColor.toUpperCase()} | Scale: ${p.pattern.scale.toFixed(1)}x`;
    doc.text(patText, margin + 96, y + 6.5);
    y += 17.5;
  }

  // Layer Manifest
  y += 6;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. UPLOADED GRAPHICS & CUSTOM TEXT LAYERS', margin, y);
  y += 6;

  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const visibleLayers = design.layers.filter((l) => l.visible);

  if (visibleLayers.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No graphics or custom text layers added.', margin, y + 4);
  } else {
    for (let i = 0; i < visibleLayers.length; i++) {
      if (y > 268) {
        doc.addPage();
        y = 20;
      }
      const l = visibleLayers[i];
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, contentW, 14, 1.5, 1.5, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const kindTag = l.kind === 'image' ? '[LOGO / GRAPHIC]' : '[CUSTOM TEXT]';
      doc.text(`${i + 1}. ${kindTag} ${l.name} (${PANEL_LABELS[l.panelId]})`, margin + 3, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.setTextColor(71, 85, 105);
      const posSpec = `Pos X:${Math.round(l.x * 100)}% Y:${Math.round(l.y * 100)}% | Rot:${Math.round(l.rotation)}deg | Opacity:${Math.round(l.opacity * 100)}%`;

      if (l.kind === 'image') {
        const asset = assetMap.get(l.assetId);
        const fileLabel = asset
          ? `Original File: original-assets/${asset.name} (${asset.width}x${asset.height}px)`
          : 'Original File: embedded';
        doc.text(`${fileLabel}  |  Width: ${Math.round(l.scaleX * 100)}%  |  ${posSpec}`, margin + 3, y + 10.8);
      } else {
        const txtSpec = `Text: "${l.uppercase ? l.text.toUpperCase() : l.text}" | Font: ${l.fontFamily.split(',')[0]} | Fill: ${l.fill.toUpperCase()} | Stroke: ${l.stroke.toUpperCase()} (${l.strokeWidth}px)`;
        doc.text(`${txtSpec}  |  ${posSpec}`, margin + 3, y + 10.8);
      }
      y += 16;
    }
  }

  return doc.output('blob');
}

export async function exportTechPackPdfOnly(
  design: JerseyDesignState,
  assets: UploadedAsset[],
): Promise<void> {
  const renders = await captureFourAngleRenders();
  const pdfBlob = await generateTechPackPdfBlob(design, assets, renders);
  const safeName = sanitizeFileName(design.brief.teamName || design.projectName);
  triggerBlobDownload(pdfBlob, `TechPack_${safeName}.pdf`);
}

export async function exportProductionZipPack(
  design: JerseyDesignState,
  assets: UploadedAsset[],
): Promise<void> {
  const zip = new JSZip();
  const safeName = sanitizeFileName(design.brief.teamName || design.projectName);

  // 1. Capture 4-Angle 3D Renders
  const renders = await captureFourAngleRenders();
  if (renders) {
    const rendersFolder = zip.folder('renders');
    rendersFolder?.file('3d_front.png', dataUrlToBase64(renders.front), { base64: true });
    rendersFolder?.file('3d_back.png', dataUrlToBase64(renders.back), { base64: true });
    rendersFolder?.file('3d_left.png', dataUrlToBase64(renders.left), { base64: true });
    rendersFolder?.file('3d_right.png', dataUrlToBase64(renders.right), { base64: true });
  }

  // 2. Generate Tech Pack PDF
  const pdfBlob = await generateTechPackPdfBlob(design, assets, renders);
  zip.file(`TechPack_${safeName}.pdf`, pdfBlob);

  // 3. Export 2048px High-Resolution Flat Textures per Panel
  const texturesFolder = zip.folder('textures');
  const panelsToExport: Array<{ id: PanelId; file: string; size: number }> = [
    { id: 'front', file: 'front_2048.png', size: 2048 },
    { id: 'back', file: 'back_2048.png', size: 2048 },
    { id: 'leftSleeve', file: 'left_sleeve_2048.png', size: 2048 },
    { id: 'rightSleeve', file: 'right_sleeve_2048.png', size: 2048 },
    { id: 'collar', file: 'collar_1024.png', size: 1024 },
    { id: 'cuffs', file: 'cuffs_1024.png', size: 1024 },
  ];
  for (const item of panelsToExport) {
    const dataUrl = await exportPanelHighResPng(item.id, design, assets, item.size);
    texturesFolder?.file(item.file, dataUrlToBase64(dataUrl), { base64: true });
  }

  // 4. Include Raw Original Uploaded Graphics
  if (assets.length > 0) {
    const assetsFolder = zip.folder('original-assets');
    assets.forEach((asset, idx) => {
      const ext = mimeToExt(asset.mimeType, asset.name);
      const base = sanitizeFileName(asset.name.replace(/\.[^.]+$/, ''));
      assetsFolder?.file(
        `${String(idx + 1).padStart(2, '0')}_${base}.${ext}`,
        dataUrlToBase64(asset.dataUrl),
        { base64: true },
      );
    });
  }

  // 5. Include Re-openable .jersey.json Project File
  const projectPayload: SerializedJerseyProject = {
    version: 1,
    exportedAt: new Date().toISOString(),
    brand: brandConfig.appName,
    design,
    assets,
  };
  zip.file(`project_${safeName}.jersey.json`, JSON.stringify(projectPayload, null, 2));

  // 6. Bundle and Download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, `${safeName}_ProductionPack.zip`);
}

export function buildWhatsAppSummaryUrl(design: JerseyDesignState): string {
  const b = design.brief;
  const lines = [
    `Halo ${brandConfig.producerName}, saya ingin konsultasi/order produksi jersey dari desain *${brandConfig.appName}*:`,
    '',
    `*Nama Tim:* ${b.teamName || design.projectName}`,
    `*Pemesan:* ${b.customerName || '-'}`,
    `*Cabang:* ${design.sport.toUpperCase()}`,
    `*Potongan:* ${design.sleeveLength === 'long' ? 'Lengan Panjang' : 'Lengan Pendek'} | Kerah ${design.collarType.toUpperCase()}`,
    `*Bahan Kain:* ${b.fabricOption}`,
    `*Estimasi Qty:* ${b.quantity || 1} pcs`,
    `*Warna Utama:* Depan ${design.panels.front.baseColor.toUpperCase()}, Belakang ${design.panels.back.baseColor.toUpperCase()}, Kerah ${design.panels.collar.baseColor.toUpperCase()}`,
    b.notes?.trim() ? `*Catatan:* ${b.notes.trim()}` : '',
    '',
    '_Saya akan melampirkan file Tech Pack PDF / Paket Produksi (.zip) setelah pesan ini._',
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${brandConfig.whatsappNumber}?text=${text}`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
