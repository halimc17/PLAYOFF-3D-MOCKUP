import * as THREE from 'three';
import type { FabricType } from '../types/design';

const bumpCache = new Map<FabricType, THREE.CanvasTexture>();

/**
 * Generates procedural tileable grayscale bump textures simulating real sportswear knit:
 * - milano: diagonal zigzag micro-knit
 * - mesh: breathable micro-dot dry-fit pores
 * - smooth: fine polyester interlock weave
 */
export function getFabricBumpTexture(fabricType: FabricType): THREE.CanvasTexture {
  const existing = bumpCache.get(fabricType);
  if (existing) return existing;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  if (fabricType === 'milano') {
    // Signature Milano zigzag rib pattern
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 2.5;
    const step = 16;
    for (let y = -step; y < size + step; y += step) {
      ctx.beginPath();
      for (let x = 0; x <= size; x += step / 2) {
        const zig = (x / (step / 2)) % 2 === 0 ? -3.5 : 3.5;
        if (x === 0) ctx.moveTo(x, y + zig);
        else ctx.lineTo(x, y + zig);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = '#505050';
    ctx.lineWidth = 1.5;
    for (let y = step / 2; y < size + step; y += step) {
      ctx.beginPath();
      for (let x = 0; x <= size; x += step / 2) {
        const zig = (x / (step / 2)) % 2 === 0 ? -3.5 : 3.5;
        if (x === 0) ctx.moveTo(x, y + zig);
        else ctx.lineTo(x, y + zig);
      }
      ctx.stroke();
    }
  } else if (fabricType === 'mesh') {
    // Breathable micro-dot dry-fit Brazil mesh
    const step = 12;
    for (let row = 0; row < size / step + 1; row++) {
      const offsetX = row % 2 === 0 ? 0 : step / 2;
      for (let col = 0; col < size / step + 1; col++) {
        const cx = col * step + offsetX;
        const cy = row * step;
        ctx.fillStyle = '#383838';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.arc(cx - 1, cy - 1, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Fine smooth interlock weave (Serena)
    ctx.fillStyle = '#929292';
    for (let y = 0; y < size; y += 4) {
      ctx.fillRect(0, y, size, 1);
    }
    ctx.fillStyle = '#707070';
    for (let x = 0; x < size; x += 4) {
      ctx.fillRect(x, 0, 1, size);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(fabricType === 'smooth' ? 18 : 14, fabricType === 'smooth' ? 18 : 14);
  texture.needsUpdate = true;

  bumpCache.set(fabricType, texture);
  return texture;
}

export function getFabricMaterialProps(fabricType: FabricType): {
  roughness: number;
  bumpScale: number;
  sheen: number;
} {
  if (fabricType === 'milano') {
    return { roughness: 0.72, bumpScale: 0.0085, sheen: 0.35 };
  }
  if (fabricType === 'mesh') {
    return { roughness: 0.78, bumpScale: 0.011, sheen: 0.25 };
  }
  return { roughness: 0.58, bumpScale: 0.0035, sheen: 0.45 };
}
