/**
 * Converts the uploaded CLO3D / Sketchfab `sports_jersey_design.glb`
 * into a clean, normalized, 6-panel studio-ready `public/models/jersey-short-vneck.glb`.
 *
 * - Normalizes coordinate system (Y-up, centered at origin, height ~0.92 units, facing +Z)
 * - Splits sculpted geometry cleanly into our 6 manifest panels:
 *     panel_front, panel_back, panel_sleeve_left, panel_sleeve_right, panel_collar, panel_cuffs
 * - Normalizes each panel's UV island cleanly to [0..1, 0..1] upright & un-mirrored
 * - Keeps interior lining cleanly solid-colored (no logo bleed on inside of collar)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_GLB = path.resolve(__dirname, '../assets-source/sports_jersey_design.glb');
const OUT_GLB = path.resolve(__dirname, '../public/models/jersey-short-vneck.glb');

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function readAccessor(buf, binStart, gltf, accIdx) {
  const acc = gltf.accessors[accIdx];
  const bv = gltf.bufferViews[acc.bufferView];
  const off = binStart + (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const compCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
  const compSize = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[acc.componentType];
  const stride = bv.byteStride || compCount * compSize;

  if (acc.componentType === 5126) {
    const arr = new Float32Array(acc.count * compCount);
    for (let i = 0; i < acc.count; i++) {
      const base = off + i * stride;
      for (let c = 0; c < compCount; c++) {
        arr[i * compCount + c] = buf.readFloatLE(base + c * 4);
      }
    }
    return arr;
  }

  const arr = new Uint32Array(acc.count * compCount);
  for (let i = 0; i < acc.count; i++) {
    const base = off + i * stride;
    if (acc.componentType === 5123) {
      for (let c = 0; c < compCount; c++) {
        arr[i * compCount + c] = buf.readUInt16LE(base + c * 2);
      }
    } else if (acc.componentType === 5125) {
      for (let c = 0; c < compCount; c++) {
        arr[i * compCount + c] = buf.readUInt32LE(base + c * 4);
      }
    } else if (acc.componentType === 5121) {
      for (let c = 0; c < compCount; c++) {
        arr[i * compCount + c] = buf.readUInt8(base + c);
      }
    }
  }
  return arr;
}

function pad4(b, padByte = 0x00) {
  const rem = b.length % 4;
  return rem === 0 ? b : Buffer.concat([b, Buffer.alloc(4 - rem, padByte)]);
}

function packGlb(namedMeshes) {
  const binChunks = [];
  let byteOffset = 0;
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];
  const materials = [];

  function pushBufferView(typedArray, target) {
    const raw = Buffer.from(
      typedArray.buffer,
      typedArray.byteOffset,
      typedArray.byteLength,
    );
    const padded = pad4(raw, 0x00);
    const idx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: raw.length,
      ...(target ? { target } : {}),
    });
    binChunks.push(padded);
    byteOffset += padded.length;
    return idx;
  }

  namedMeshes.forEach(({ name, positions, normals, uvs, indices }, mIdx) => {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i] < min[0]) min[0] = positions[i];
      if (positions[i + 1] < min[1]) min[1] = positions[i + 1];
      if (positions[i + 2] < min[2]) min[2] = positions[i + 2];
      if (positions[i] > max[0]) max[0] = positions[i];
      if (positions[i + 1] > max[1]) max[1] = positions[i + 1];
      if (positions[i + 2] > max[2]) max[2] = positions[i + 2];
    }

    const posView = pushBufferView(positions, 34962);
    const normView = pushBufferView(normals, 34962);
    const uvView = pushBufferView(uvs, 34962);
    const idxView = pushBufferView(indices, 34963);

    const posAcc = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: positions.length / 3,
      type: 'VEC3',
      min,
      max,
    });
    const normAcc = accessors.length;
    accessors.push({
      bufferView: normView,
      componentType: 5126,
      count: normals.length / 3,
      type: 'VEC3',
    });
    const uvAcc = accessors.length;
    accessors.push({
      bufferView: uvView,
      componentType: 5126,
      count: uvs.length / 2,
      type: 'VEC2',
    });
    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxView,
      componentType: 5125,
      count: indices.length,
      type: 'SCALAR',
    });

    materials.push({
      name: `${name}_mat`,
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, 1],
        metallicFactor: 0,
        roughnessFactor: 0.85,
      },
      doubleSided: true,
    });

    meshes.push({
      name,
      primitives: [
        {
          attributes: { POSITION: posAcc, NORMAL: normAcc, TEXCOORD_0: uvAcc },
          indices: idxAcc,
          material: mIdx,
        },
      ],
    });

    nodes.push({ name, mesh: mIdx });
  });

  const binBuffer = Buffer.concat(binChunks);
  const gltf = {
    asset: { version: '2.0', generator: 'KitForge 3D GLB Panel Splitter' },
    scene: 0,
    scenes: [{ name: 'JerseyRoot', nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binBuffer.length }],
  };

  const jsonBuffer = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const totalLength = 12 + 8 + jsonBuffer.length + 8 + binBuffer.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHdr = Buffer.alloc(8);
  jsonHdr.writeUInt32LE(jsonBuffer.length, 0);
  jsonHdr.writeUInt32LE(0x4e4f534a, 4);

  const binHdr = Buffer.alloc(8);
  binHdr.writeUInt32LE(binBuffer.length, 0);
  binHdr.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHdr, jsonBuffer, binHdr, binBuffer]);
}

// ---------------------------------------------------------------------------
// Main Conversion Pipeline
// ---------------------------------------------------------------------------

const buf = fs.readFileSync(SRC_GLB);
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const binStart = 20 + jsonLen + 8;

// World coordinate normalization constants (after Sketchfab Z-up -> Y-up transform: (x, y, z) -> (x, z, -y))
// Source bounds: X[-27.1, 27.2], Y[95.8, 164.8], Z[-15.4, 13.7]
const CENTER_X = 0.04;
const CENTER_Y = 130.3;
const CENTER_Z = -0.8;
const SCALE = 0.94 / 69.0; // Target studio height = 0.94 units

function createBucket() {
  return {
    positions: [],
    normals: [],
    uvs: [],
    indices: [],
    vertMap: new Map(),
  };
}

const buckets = {
  panel_front: createBucket(),
  panel_back: createBucket(),
  panel_sleeve_left: createBucket(),
  panel_sleeve_right: createBucket(),
  panel_collar: createBucket(),
  panel_cuffs: createBucket(),
};

/**
 * Classifies a triangle by its source material index & UV island centroid,
 * and returns { panelName, mapUV(u, v) }.
 */
function classifyTriangle(matIndex, uAvg, vAvg, isInnerLining) {
  // V-Neck Collar strip (top neck rib)
  if (vAvg >= 0.95) {
    return {
      panelName: 'panel_collar',
      mapUV: (u, v) => [
        clamp((u - 0.305) / (0.598 - 0.305), 0.01, 0.99),
        clamp((v - 0.962) / (0.992 - 0.962), 0.01, 0.99),
      ],
    };
  }

  // Trim Material (matIndex === 1): Sleeve Cuffs + Side Piping Accents -> panel_cuffs
  if (matIndex === 1) {
    return {
      panelName: 'panel_cuffs',
      mapUV: (u, v) => [clamp(u, 0.02, 0.98), clamp(v, 0.02, 0.98)],
    };
  }

  // Front Body (bot_center)
  if (vAvg >= 0.48 && vAvg < 0.95 && uAvg > 0.23 && uAvg < 0.68) {
    return {
      panelName: 'panel_front',
      mapUV: isInnerLining
        ? () => [0.02, 0.02]
        : (u, v) => [
            clamp((u - 0.230) / (0.680 - 0.230), 0.005, 0.995),
            clamp((v - 0.499) / (0.945 - 0.499), 0.005, 0.995),
          ],
    };
  }

  // Back Body (top_center)
  if (vAvg < 0.48 && uAvg > 0.28 && uAvg < 0.65) {
    return {
      panelName: 'panel_back',
      mapUV: isInnerLining
        ? () => [0.02, 0.02]
        : (u, v) => [
            clamp((u - 0.280) / (0.650 - 0.280), 0.005, 0.995),
            clamp((v - 0.010) / (0.457 - 0.010), 0.005, 0.995),
          ],
    };
  }

  // Left Sleeve (+X, bot_right)
  if (vAvg >= 0.68 && uAvg >= 0.65) {
    return {
      panelName: 'panel_sleeve_left',
      mapUV: isInnerLining
        ? () => [0.02, 0.02]
        : (u, v) => [
            clamp((u - 0.664) / (0.895 - 0.664), 0.005, 0.995),
            clamp((v - 0.750) / (0.900 - 0.750), 0.005, 0.995),
          ],
    };
  }

  // Right Sleeve (-X, bot_left)
  if (vAvg >= 0.68 && uAvg <= 0.26) {
    return {
      panelName: 'panel_sleeve_right',
      mapUV: isInnerLining
        ? () => [0.02, 0.02]
        : (u, v) => [
            clamp((u - 0.010) / (0.240 - 0.010), 0.005, 0.995),
            clamp((v - 0.759) / (0.909 - 0.759), 0.005, 0.995),
          ],
    };
  }

  // Athletic Side Gussets (top_left / top_right): map cleanly to edge of front body
  // so they follow body base color & pattern without duplicating centered chest logos
  if (vAvg < 0.45 && (uAvg <= 0.28 || uAvg >= 0.65)) {
    const sideU = uAvg <= 0.28 ? 0.96 : 0.04;
    return {
      panelName: 'panel_front',
      mapUV: isInnerLining
        ? () => [0.02, 0.02]
        : (_u, v) => [
            sideU,
            clamp((v - 0.10) / (0.32 - 0.10) * 0.5 + 0.22, 0.02, 0.98),
          ],
    };
  }

  return {
    panelName: 'panel_front',
    mapUV: () => [0.02, 0.02],
  };
}

// Process all 5 source meshes (Mesh 1 is the inner garment shell)
gltf.meshes.forEach((mesh, meshIdx) => {
  const prim = mesh.primitives[0];
  const matIdx = prim.material ?? 0;
  const isInnerLining = meshIdx === 1;

  const pos = readAccessor(buf, binStart, gltf, prim.attributes.POSITION);
  const nrm = readAccessor(buf, binStart, gltf, prim.attributes.NORMAL);
  const uv = readAccessor(buf, binStart, gltf, prim.attributes.TEXCOORD_0);
  const idx = readAccessor(buf, binStart, gltf, prim.indices);

  for (let t = 0; t < idx.length; t += 3) {
    const i0 = idx[t];
    const i1 = idx[t + 1];
    const i2 = idx[t + 2];

    const uAvg = (uv[i0 * 2] + uv[i1 * 2] + uv[i2 * 2]) / 3;
    const vAvg = (uv[i0 * 2 + 1] + uv[i1 * 2 + 1] + uv[i2 * 2 + 1]) / 3;

    const { panelName, mapUV } = classifyTriangle(
      matIdx,
      uAvg,
      vAvg,
      isInnerLining,
    );
    const bucket = buckets[panelName];

    for (const vi of [i0, i1, i2]) {
      const key = `${meshIdx}_${vi}_${isInnerLining ? 1 : 0}`;
      let outIdx = bucket.vertMap.get(key);
      if (outIdx === undefined) {
        outIdx = bucket.positions.length / 3;
        bucket.vertMap.set(key, outIdx);

        // Apply Sketchfab node matrix: (x, y, z) -> Y-up (x, z, -y)
        const wx = (pos[vi * 3] - CENTER_X) * SCALE;
        const wy = (pos[vi * 3 + 2] - CENTER_Y) * SCALE;
        const wz = (-pos[vi * 3 + 1] - CENTER_Z) * SCALE;
        bucket.positions.push(wx, wy, wz);

        const nx = nrm[vi * 3];
        const ny = nrm[vi * 3 + 2];
        const nz = -nrm[vi * 3 + 1];
        const nLen = Math.hypot(nx, ny, nz) || 1;
        bucket.normals.push(nx / nLen, ny / nLen, nz / nLen);

        const [nu, nv] = mapUV(uv[vi * 2], uv[vi * 2 + 1]);
        bucket.uvs.push(nu, nv);
      }
      bucket.indices.push(outIdx);
    }
  }
});

const outputMeshes = Object.entries(buckets).map(([name, b]) => {
  console.log(
    `  ${name.padEnd(20)} verts: ${String(b.positions.length / 3).padStart(6)} | tris: ${String(b.indices.length / 3).padStart(6)}`,
  );
  return {
    name,
    positions: new Float32Array(b.positions),
    normals: new Float32Array(b.normals),
    uvs: new Float32Array(b.uvs),
    indices: new Uint32Array(b.indices),
  };
});

const outBuf = packGlb(outputMeshes);
fs.mkdirSync(path.dirname(OUT_GLB), { recursive: true });
fs.writeFileSync(OUT_GLB, outBuf);
console.log(
  `\nSuccessfully generated ${OUT_GLB} (${(outBuf.length / (1024 * 1024)).toFixed(2)} MB)`,
);
