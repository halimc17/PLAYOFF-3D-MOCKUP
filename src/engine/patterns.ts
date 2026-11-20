import type { PanelPattern } from '../types/design';

/**
 * Renders procedural sportswear patterns onto a 2D Canvas at arbitrary resolution.
 */
export function drawPanelPattern(
  ctx: CanvasRenderingContext2D,
  size: number,
  baseColor: string,
  pattern: PanelPattern,
): void {
  // Base color fill
  ctx.save();
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  if (pattern.type === 'solid' || pattern.opacity <= 0) {
    ctx.restore();
    return;
  }

  ctx.globalAlpha = Math.max(0, Math.min(1, pattern.opacity));

  // Center rotation transform for pattern layer
  ctx.translate(size / 2, size / 2);
  ctx.rotate((pattern.rotation * Math.PI) / 180);
  ctx.translate(-size / 2, -size / 2);

  const scale = Math.max(0.4, Math.min(3, pattern.scale || 1));
  const c1 = pattern.color;
  const c2 = pattern.secondaryColor;
  const bleed = size * 0.6;

  switch (pattern.type) {
    case 'vertical-stripes': {
      const stripeW = (size / 9) / scale;
      ctx.fillStyle = c1;
      for (let x = -bleed; x < size + bleed; x += stripeW * 2) {
        ctx.fillRect(x, -bleed, stripeW, size + bleed * 2);
      }
      break;
    }

    case 'horizontal-hoops': {
      const hoopH = (size / 8) / scale;
      ctx.fillStyle = c1;
      for (let y = -bleed; y < size + bleed; y += hoopH * 2) {
        ctx.fillRect(-bleed, y, size + bleed * 2, hoopH);
      }
      break;
    }

    case 'pinstripes': {
      const step = (size / 20) / scale;
      const lineW = Math.max(2, step * 0.14);
      ctx.fillStyle = c1;
      for (let x = -bleed; x < size + bleed; x += step) {
        ctx.fillRect(x, -bleed, lineW, size + bleed * 2);
      }
      break;
    }

    case 'diagonal-sash': {
      const bandW = (size * 0.24) * scale;
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((-36 * Math.PI) / 180);
      ctx.fillStyle = c1;
      ctx.fillRect(-size, -bandW / 2, size * 2, bandW);
      // Secondary accent border stripes
      ctx.fillStyle = c2;
      const border = Math.max(4, bandW * 0.1);
      ctx.fillRect(-size, -bandW / 2 - border * 1.6, size * 2, border);
      ctx.fillRect(-size, bandW / 2 + border * 0.6, size * 2, border);
      ctx.restore();
      break;
    }

    case 'chevron': {
      const stepY = (size * 0.16) / scale;
      const vDepth = size * 0.22;
      const bandH = stepY * 0.52;
      for (let i = -3; i < 12; i++) {
        const y = i * stepY;
        ctx.beginPath();
        ctx.moveTo(-bleed, y - vDepth * 0.6);
        ctx.lineTo(size / 2, y + vDepth);
        ctx.lineTo(size + bleed, y - vDepth * 0.6);
        ctx.lineTo(size + bleed, y - vDepth * 0.6 + bandH);
        ctx.lineTo(size / 2, y + vDepth + bandH);
        ctx.lineTo(-bleed, y - vDepth * 0.6 + bandH);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? c1 : c2;
        ctx.fill();
      }
      break;
    }

    case 'gradient': {
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.55, c2);
      grad.addColorStop(1, baseColor);
      ctx.fillStyle = grad;
      ctx.fillRect(-bleed, -bleed, size + bleed * 2, size + bleed * 2);
      break;
    }

    case 'half-split': {
      ctx.fillStyle = c1;
      ctx.fillRect(size / 2, -bleed, size, size + bleed * 2);
      // Center accent seam line
      ctx.fillStyle = c2;
      const lineW = (size * 0.025) * scale;
      ctx.fillRect(size / 2 - lineW / 2, -bleed, lineW, size + bleed * 2);
      break;
    }

    case 'geometric-hex': {
      const r = (size / 14) / scale;
      const dx = r * 1.5;
      const dy = r * Math.sqrt(3);
      ctx.lineWidth = Math.max(2, r * 0.08);

      let row = 0;
      for (let y = -bleed; y < size + bleed; y += dy / 2) {
        const offsetX = row % 2 === 0 ? 0 : dx;
        for (let x = -bleed; x < size + bleed; x += dx * 2) {
          const cx = x + offsetX;
          const cy = y;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const ang = (s * Math.PI) / 3;
            const px = cx + r * 0.92 * Math.cos(ang);
            const py = cy + r * 0.92 * Math.sin(ang);
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          const hash = Math.abs(Math.sin(cx * 0.013 + cy * 0.027));
          if (hash > 0.65) {
            ctx.fillStyle = c1;
            ctx.fill();
          } else if (hash > 0.35) {
            ctx.fillStyle = c2;
            ctx.globalAlpha = pattern.opacity * 0.45;
            ctx.fill();
            ctx.globalAlpha = pattern.opacity;
          }
          ctx.strokeStyle = c1;
          ctx.stroke();
        }
        row++;
      }
      break;
    }

    case 'lightning-wave': {
      const bands = 6;
      for (let i = 0; i < bands; i++) {
        const yBase = (size * (0.12 + i * 0.15)) / Math.sqrt(scale);
        ctx.beginPath();
        ctx.moveTo(-bleed, yBase);
        const segs = 8;
        for (let s = 0; s <= segs; s++) {
          const px = (s / segs) * (size + bleed * 2) - bleed;
          const py =
            yBase +
            Math.sin(s * 1.3 + i * 0.9) * (size * 0.055 * scale) +
            (s % 2 === 0 ? -size * 0.02 : size * 0.02);
          ctx.lineTo(px, py);
        }
        ctx.lineWidth = (size * 0.028) * scale;
        ctx.strokeStyle = i % 2 === 0 ? c1 : c2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}
