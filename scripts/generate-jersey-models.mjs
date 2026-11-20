/**
 * Deterministic 3D Sports Jersey .glb Generator (MVP Base Models)
 * Generates 6 standard glTF 2.0 binary (.glb) models:
 *   - Short Sleeve: O-Neck, V-Neck, Polo
 *   - Long Sleeve:  O-Neck, V-Neck, Polo
 *
 * Each .glb contains 6 cleanly named, UV-mapped panels matching src/config/modelManifest.ts:
 *   panel_front, panel_back, panel_sleeve_left, panel_sleeve_right, panel_collar, panel_cuffs
 *
 * Run: npm run generate:models
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/models');

// ---------------------------------------------------------------------------
// Vector & Geometry Helpers
// ---------------------------------------------------------------------------

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize(a) {
  const len = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / len, a[1] / len, a[2] / len];
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Compute smooth area-weighted vertex normals for an indexed triangle mesh.
 */
function computeNormals(positions, indices) {
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;
    const p0 = [positions[i0], positions[i0 + 1], positions[i0 + 2]];
    const p1 = [positions[i1], positions[i1 + 1], positions[i1 + 2]];
    const p2 = [positions[i2], positions[i2 + 1], positions[i2 + 2]];
    const n = cross(sub(p1, p0), sub(p2, p0));
    normals[i0] += n[0];
    normals[i0 + 1] += n[1];
    normals[i0 + 2] += n[2];
    normals[i1] += n[0];
    normals[i1 + 1] += n[1];
    normals[i1 + 2] += n[2];
    normals[i2] += n[0];
    normals[i2 + 1] += n[1];
    normals[i2 + 2] += n[2];
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len;
    normals[i + 1] /= len;
    normals[i + 2] /= len;
  }
  return normals;
}

function mergePrimitives(parts) {
  let totalVerts = 0;
  let totalIndices = 0;
  for (const p of parts) {
    totalVerts += p.positions.length / 3;
    totalIndices += p.indices.length;
  }
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);

  let vOffset = 0;
  let iOffset = 0;
  for (const p of parts) {
    positions.set(p.positions, vOffset * 3);
    normals.set(p.normals, vOffset * 3);
    uvs.set(p.uvs, vOffset * 2);
    for (let k = 0; k < p.indices.length; k++) {
      indices[iOffset + k] = p.indices[k] + vOffset;
    }
    vOffset += p.positions.length / 3;
    iOffset += p.indices.length;
  }
  return { positions, normals, uvs, indices };
}

// ---------------------------------------------------------------------------
// Anatomical Jersey Parametric Geometry
// ---------------------------------------------------------------------------

const TORSO_BOTTOM_Y = -0.46;
const TORSO_TOP_Y = 0.44;
const NECK_HALF_WIDTH = 0.118;

/**
 * Computes torso half-width (rx) and half-depth (rz) at normalized height t in [0..1].
 */
function torsoProfile(t) {
  // Athletic V-taper: slightly flared hem, subtly tapered waist, broad chest, sloped shoulders
  const waistDip = -0.022 * Math.sin(clamp((t - 0.12) / 0.55, 0, 1) * Math.PI);
  const chestBroad = 0.042 * smoothstep(0.45, 0.85, t);
  const shoulderSlope = -0.025 * smoothstep(0.88, 1.0, t);
  const rx = 0.275 + waistDip + chestBroad + shoulderSlope;

  // Front-to-back depth: fuller chest, slim waist, slight taper near collar
  const chestDepth = 0.028 * Math.sin(clamp((t - 0.25) / 0.7, 0, 1) * Math.PI);
  const collarTaper = -0.042 * smoothstep(0.84, 1.0, t);
  const rz = 0.132 + chestDepth + collarTaper;

  return { rx, rz };
}

/**
 * Top shoulder/neckline height at horizontal fraction s in [-1..1] (-1 = left, +1 = right).
 */
function topEdgeY(s, isFront, collarType) {
  const absS = Math.abs(s);
  // Natural shoulder slope downward from neck toward armhole
  const shoulderDrop = 0.055 * smoothstep(0.32, 1.0, absS);
  let y = TORSO_TOP_Y - shoulderDrop;

  // Neck opening centered around s = 0, width ~0.41 of half-torso
  const neckFrac = 0.42;
  if (absS < neckFrac) {
    const u = absS / neckFrac; // 0 at center, 1 at neck edge
    if (isFront) {
      if (collarType === 'v-neck') {
        const depth = 0.145;
        y -= depth * Math.pow(1 - u, 1.15);
      } else if (collarType === 'polo') {
        const depth = 0.105;
        y -= depth * Math.sqrt(Math.max(0, 1 - u * u));
      } else {
        // o-neck
        const depth = 0.095;
        y -= depth * Math.sqrt(Math.max(0, 1 - u * u));
      }
    } else {
      // Back neckline is shallower
      const depth = collarType === 'polo' ? 0.026 : 0.032;
      y -= depth * Math.sqrt(Math.max(0, 1 - u * u));
    }
  }
  return y;
}

/**
 * Evaluates a 3D point on the front or back torso surface.
 * s in [-1..1]: -1 is -X side seam, +1 is +X side seam.
 * v in [0..1]: 0 is bottom hem, 1 is top shoulder/neckline edge.
 */
function evalTorsoPoint(s, v, isFront, collarType, radialOffset = 0) {
  const yTop = topEdgeY(s, isFront, collarType);
  const y = TORSO_BOTTOM_Y + (yTop - TORSO_BOTTOM_Y) * v;
  const globalT = clamp((y - TORSO_BOTTOM_Y) / (TORSO_TOP_Y - TORSO_BOTTOM_Y), 0, 1);

  const { rx, rz } = torsoProfile(globalT);

  // Smooth superellipse angle from side seam (-1 -> PI) to side seam (+1 -> 0)
  // Using smooth cosine distribution keeps vertices well-spaced on the flat chest/back
  const theta = ((1 - s) * 0.5) * Math.PI; // s=-1 -> PI, s=0 -> PI/2, s=+1 -> 0
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // Superellipse exponent makes chest/back realistic (flatter center, rounded ribs)
  const exp = 0.84;
  const xSign = Math.sign(cosT);
  const xUnit = xSign * Math.pow(Math.abs(cosT), exp);
  const zUnit = Math.pow(Math.max(0, sinT), exp);

  // Subtle athletic chest contour & natural fabric drape wave near bottom hem
  const drape =
    0.005 *
    Math.sin(s * Math.PI * 3.0) *
    (1 - smoothstep(0.0, 0.35, v)) *
    Math.max(0, sinT);

  const chestContour = isFront
    ? 0.016 * Math.exp(-Math.pow((globalT - 0.68) / 0.18, 2)) * Math.pow(sinT, 1.5)
    : -0.008 * Math.exp(-Math.pow((globalT - 0.35) / 0.2, 2)) * Math.pow(sinT, 1.5);

  const x = xUnit * (rx + radialOffset);
  const zSign = isFront ? 1 : -1;
  const z = zSign * (zUnit * (rz + radialOffset) + chestContour + drape);

  return [x, y, z];
}

/**
 * Builds either panel_front or panel_back with clean planar UV mapping + subtle inner thickness.
 */
function buildTorsoPanel(isFront, collarType) {
  const cols = 44;
  const rows = 44;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    for (let c = 0; c <= cols; c++) {
      const f = c / cols; // 0..1 left-to-right from viewer's POV
      // Front POV (+Z): screen left = -X (s=-1), screen right = +X (s=+1)
      // Back POV (-Z):  screen left = +X (s=+1), screen right = -X (s=-1)
      const s = isFront ? f * 2 - 1 : 1 - f * 2;
      const [x, y, z] = evalTorsoPoint(s, v, isFront, collarType, 0);
      positions.push(x, y, z);

      // Planar UV mapping so logos and text never warp around the neckline dip
      const uvX = 0.5 + (isFront ? x : -x) / 0.64;
      const uvY = (y - TORSO_BOTTOM_Y) / (TORSO_TOP_Y - TORSO_BOTTOM_Y);
      uvs.push(clamp(uvX, 0.01, 0.99), clamp(uvY, 0.01, 0.99));
    }
  }

  const stride = cols + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * stride + c;
      const b = a + 1;
      const d = (r + 1) * stride + c;
      const e = d + 1;
      // Winding order ensures outward-facing normals on both front (+Z) and back (-Z)
      indices.push(a, b, e, a, e, d);
    }
  }

  const posArr = new Float32Array(positions);
  const uvArr = new Float32Array(uvs);
  const idxArr = new Uint32Array(indices);
  const normArr = computeNormals(posArr, idxArr);

  return { positions: posArr, normals: normArr, uvs: uvArr, indices: idxArr };
}

/**
 * Builds subtle interior backing inside the neck and bottom hem so the jersey feels solid.
 */
function buildInnerLining(collarType) {
  const parts = [];
  for (const isFront of [true, false]) {
    const cols = 28;
    const rows = 14;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let r = 0; r <= rows; r++) {
      const v = r / rows;
      for (let c = 0; c <= cols; c++) {
        const f = c / cols;
        const s = isFront ? f * 2 - 1 : 1 - f * 2;
        const [x, y, z] = evalTorsoPoint(s, v, isFront, collarType, -0.008);
        positions.push(x, y, z);
        uvs.push(0.5, 0.5);
      }
    }

    const stride = cols + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = r * stride + c;
        const b = a + 1;
        const d = (r + 1) * stride + c;
        const e = d + 1;
        // Reversed winding faces inward
        indices.push(a, e, b, a, d, e);
      }
    }

    const posArr = new Float32Array(positions);
    const uvArr = new Float32Array(uvs);
    const idxArr = new Uint32Array(indices);
    parts.push({
      positions: posArr,
      normals: computeNormals(posArr, idxArr),
      uvs: uvArr,
      indices: idxArr,
    });
  }
  return mergePrimitives(parts);
}

/**
 * Builds left (+X, wearer's left) or right (-X, wearer's right) sleeve
 * plus returns the matching cuff strip geometry at the sleeve end.
 */
function buildSleeveAndCuff(sideSign, sleeveLength) {
  // sideSign: +1 = Left Sleeve (+X), -1 = Right Sleeve (-X)
  const isLong = sleeveLength === 'long';
  const rings = isLong ? 34 : 20;
  const segs = 32;

  const totalLen = isLong ? 0.62 : 0.265;
  const cuffFrac = isLong ? 0.095 : 0.14; // last fraction belongs to cuff trim

  // Centerline curve of the sleeve starting smoothly tucked inside the torso shoulder
  function armCenter(t) {
    const xStart = sideSign * 0.215;
    const yStart = 0.285;
    const zStart = 0.0;

    if (!isLong) {
      const angle = 0.72; // radians downward from horizontal (~41 deg)
      const x = xStart + sideSign * Math.cos(angle) * totalLen * t;
      const y = yStart - Math.sin(angle) * totalLen * t - 0.012 * t * t;
      const z = zStart - 0.008 * t;
      return [x, y, z];
    } else {
      // Smooth athletic long sleeve sloping naturally from shoulder to wrist
      const x = xStart + sideSign * (0.255 * t + 0.035 * Math.sin(t * Math.PI * 0.7));
      const y = yStart - 0.56 * Math.pow(t, 1.06);
      const z = zStart + 0.025 * Math.sin(t * Math.PI);
      return [x, y, z];
    }
  }

  function armFrame(t) {
    const dt = 0.004;
    const p0 = armCenter(Math.max(0, t - dt));
    const p1 = armCenter(Math.min(1, t + dt));
    const tangent = normalize(sub(p1, p0));
    const worldForward = [0, 0, 1];
    // upAxis roughly perpendicular to arm axis in XY plane (pointing toward shoulder top)
    let upAxis = normalize(cross(worldForward, tangent));
    if (upAxis[1] < 0) upAxis = scale(upAxis, -1);
    const fwdAxis = normalize(cross(tangent, upAxis));
    return { tangent, upAxis, fwdAxis };
  }

  function armRadii(t) {
    // Smoothly blend shoulder cap into torso without protruding lip
    const shoulderBlend = smoothstep(0.0, 0.18, t);
    if (!isLong) {
      const rUp = (0.112 + 0.014 * shoulderBlend) * (1 - 0.22 * t);
      const rFwd = (0.102 + 0.01 * shoulderBlend) * (1 - 0.18 * t);
      return { rUp, rFwd };
    } else {
      const rUp = (0.112 + 0.014 * shoulderBlend) * (1 - 0.48 * Math.pow(t, 0.92));
      const rFwd = (0.102 + 0.01 * shoulderBlend) * (1 - 0.44 * Math.pow(t, 0.92));
      return { rUp, rFwd };
    }
  }

  function buildTubeSegment(tStart, tEnd, ringCount, radiusBoost = 0) {
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let r = 0; r <= ringCount; r++) {
      const localV = r / ringCount; // 0 = shoulder/start, 1 = cuff/end
      const t = tStart + (tEnd - tStart) * localV;
      const center = armCenter(t);
      const { upAxis, fwdAxis } = armFrame(t);
      const { rUp, rFwd } = armRadii(t);

      // Gentle shoulder cap rounding near t = 0
      const capLift = 0;

      for (let s = 0; s <= segs; s++) {
        const f = s / segs; // 0..1 around sleeve circumference
        // Center f = 0.5 on outer top/side deltoid so sleeve logos sit squarely on the outer arm!
        // For Left Sleeve (+X, viewed from +X): screen left = +Z (front), screen right = -Z (back).
        // For Right Sleeve (-X, viewed from -X): screen left = -Z (back), screen right = +Z (front).
        // Let phi = 0 be the outer top (+upAxis).
        // Going from f=0 -> 1 wraps from inner armpit (-upAxis) across screen-left -> outer (+upAxis) -> screen-right -> inner armpit.
        const phi = (f - 0.5) * Math.PI * 2; // -PI to +PI; phi=0 is outer deltoid
        const cosP = Math.cos(phi); // +1 at outer top, -1 at armpit
        const sinP = Math.sin(phi); // -1 at screen left, +1 at screen right

        // Map screen-right direction to world fwdAxis:
        // Left sleeve (+X): screen right is -Z; Right sleeve (-X): screen right is +Z
        const fwdSign = sideSign > 0 ? -1 : 1;
        const alongUp = cosP * (rUp + radiusBoost) + capLift * Math.max(0, cosP);
        const alongFwd = sinP * fwdSign * (rFwd + radiusBoost);

        const pt = add(
          center,
          add(scale(upAxis, alongUp), scale(fwdAxis, alongFwd)),
        );
        positions.push(pt[0], pt[1], pt[2]);

        // UV: u goes 0..1 left-to-right across outer sleeve, v goes 1 (top/shoulder) -> 0 (bottom/cuff)
        uvs.push(f, 1 - localV);
      }
    }

    const stride = segs + 1;
    for (let r = 0; r < ringCount; r++) {
      for (let s = 0; s < segs; s++) {
        const a = r * stride + s;
        const b = a + 1;
        const d = (r + 1) * stride + s;
        const e = d + 1;
        // Outward winding order
        indices.push(a, d, e, a, e, b);
      }
    }

    const posArr = new Float32Array(positions);
    const uvArr = new Float32Array(uvs);
    const idxArr = new Uint32Array(indices);
    return {
      positions: posArr,
      normals: computeNormals(posArr, idxArr),
      uvs: uvArr,
      indices: idxArr,
    };
  }

  const splitT = 1 - cuffFrac;
  const sleeve = buildTubeSegment(0, splitT, rings, 0);
  const cuffOuter = buildTubeSegment(splitT - 0.01, 1.0, 6, 0.0045);

  // Add subtle end-cap ring to cuff so sleeve opening looks thick & finished
  const endCenter = armCenter(1.0);
  const { upAxis, fwdAxis } = armFrame(1.0);
  const { rUp, rFwd } = armRadii(1.0);
  const fwdSign = sideSign > 0 ? -1 : 1;
  const lipPos = [];
  const lipUvs = [];
  const lipIdx = [];
  for (let ring = 0; ring <= 1; ring++) {
    const inset = ring === 0 ? 0.0045 : -0.012;
    for (let s = 0; s <= segs; s++) {
      const f = s / segs;
      const phi = (f - 0.5) * Math.PI * 2;
      const pt = add(
        endCenter,
        add(
          scale(upAxis, Math.cos(phi) * (rUp + inset)),
          scale(fwdAxis, Math.sin(phi) * fwdSign * (rFwd + inset)),
        ),
      );
      lipPos.push(pt[0], pt[1], pt[2]);
      lipUvs.push(f, ring);
    }
  }
  const stride = segs + 1;
  for (let s = 0; s < segs; s++) {
    const a = s;
    const b = s + 1;
    const d = stride + s;
    const e = stride + s + 1;
    lipIdx.push(a, d, e, a, e, b);
  }
  const lipPosArr = new Float32Array(lipPos);
  const lipUvArr = new Float32Array(lipUvs);
  const lipIdxArr = new Uint32Array(lipIdx);
  const cuffLip = {
    positions: lipPosArr,
    normals: computeNormals(lipPosArr, lipIdxArr),
    uvs: lipUvArr,
    indices: lipIdxArr,
  };

  return {
    sleeve,
    cuff: mergePrimitives([cuffOuter, cuffLip]),
  };
}

/**
 * Builds bottom hem trim band around TORSO_BOTTOM_Y.
 */
function buildBottomHemTrim(collarType) {
  const parts = [];
  for (const isFront of [true, false]) {
    const cols = 36;
    const rows = 4;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let r = 0; r <= rows; r++) {
      const v = (r / rows) * 0.032; // bottom 3.2% of torso
      for (let c = 0; c <= cols; c++) {
        const f = c / cols;
        const s = isFront ? f * 2 - 1 : 1 - f * 2;
        const [x, y, z] = evalTorsoPoint(s, v, isFront, collarType, 0.0038);
        positions.push(x, y, z);
        uvs.push(f, r / rows);
      }
    }
    const stride = cols + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = r * stride + c;
        const b = a + 1;
        const d = (r + 1) * stride + c;
        const e = d + 1;
        indices.push(a, b, e, a, e, d);
      }
    }
    const posArr = new Float32Array(positions);
    const uvArr = new Float32Array(uvs);
    const idxArr = new Uint32Array(indices);
    parts.push({
      positions: posArr,
      normals: computeNormals(posArr, idxArr),
      uvs: uvArr,
      indices: idxArr,
    });
  }
  return mergePrimitives(parts);
}

/**
 * Samples a single continuous elliptical neckline loop around the neck opening
 * with zero discontinuity at the left/right shoulder seams.
 */
function evalNeckPoint(a, collarType) {
  const neckRx = 0.146;
  const neckRz = 0.106;
  const x = neckRx * Math.cos(a);
  const z = neckRz * Math.sin(a);
  const sinA = Math.sin(a);
  const frontW = Math.max(0, sinA);
  const backW = Math.max(0, -sinA);

  let y = TORSO_TOP_Y - 0.012;
  if (frontW > 0) {
    if (collarType === 'v-neck') {
      y -= 0.145 * Math.pow(frontW, 1.35);
    } else if (collarType === 'polo') {
      y -= 0.095 * Math.pow(frontW, 1.15);
    } else {
      y -= 0.092 * Math.pow(frontW, 1.15);
    }
  } else if (backW > 0) {
    const backDepth = collarType === 'polo' ? 0.024 : 0.032;
    y -= backDepth * Math.pow(backW, 1.2);
  }
  return [x, y, z];
}

function sampleNeckLoop(collarType, totalSegs = 64) {
  const pts = [];
  for (let i = 0; i <= totalSegs; i++) {
    const a = (i / totalSegs) * Math.PI * 2;
    const pt = evalNeckPoint(a, collarType);
    pts.push({ pt, a });
  }
  return pts;
}

/**
 * Builds 3D Collar geometry tailored to O-Neck, V-Neck, or Polo.
 */
function buildCollar(collarType) {
  const segs = 64;
  const loop = sampleNeckLoop(collarType, segs);
  const parts = [];

  if (collarType === 'o-neck' || collarType === 'v-neck') {
    // Thick rounded 3D athletic rib band hugging the exact neckline contour
    const profileSegs = 12;
    const bandHeight = collarType === 'v-neck' ? 0.029 : 0.026;
    const bandThick = 0.011;

    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segs; i++) {
      const { pt } = loop[i];
      const outDir = normalize([pt[0], 0, pt[2]]);

      for (let j = 0; j <= profileSegs; j++) {
        const theta = (j / profileSegs) * Math.PI * 2;
        const radial = Math.cos(theta) * bandThick;
        const vertical = Math.sin(theta) * (bandHeight * 0.55) + bandHeight * 0.25;

        const p = [
          pt[0] + outDir[0] * (radial + 0.003),
          pt[1] + vertical,
          pt[2] + outDir[2] * (radial + 0.003),
        ];
        positions.push(p[0], p[1], p[2]);
        uvs.push(i / segs, j / profileSegs);
      }
    }

    const stride = profileSegs + 1;
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < profileSegs; j++) {
        const a = i * stride + j;
        const b = a + 1;
        const d = (i + 1) * stride + j;
        const e = d + 1;
        indices.push(a, d, e, a, e, b);
      }
    }

    const posArr = new Float32Array(positions);
    const uvArr = new Float32Array(uvs);
    const idxArr = new Uint32Array(indices);
    parts.push({
      positions: posArr,
      normals: computeNormals(posArr, idxArr),
      uvs: uvArr,
      indices: idxArr,
    });

    // For V-Neck, add a crisp overlapping V-insert tab at the center front point
    if (collarType === 'v-neck') {
      const centerFront = evalTorsoPoint(0, 1.0, true, collarType, 0.009);
      parts.push(
        buildBox(
          centerFront[0],
          centerFront[1] - 0.004,
          centerFront[2] + 0.004,
          0.038,
          0.032,
          0.012,
        ),
      );
    }
  } else {
    // POLO COLLAR: Clean standing neckband + smooth folded-over athletic collar wings + placket + buttons
    // 1. Standing neckband hugging the neckline
    const standPos = [];
    const standUv = [];
    const standIdx = [];
    const standRows = 5;
    for (let r = 0; r <= standRows; r++) {
      const v = r / standRows;
      for (let i = 0; i <= segs; i++) {
        const { pt } = loop[i];
        const outDir = normalize([pt[0], 0, pt[2]]);
        const p = [
          pt[0] + outDir[0] * (0.004 - 0.001 * v),
          pt[1] + v * 0.036,
          pt[2] + outDir[2] * (0.004 - 0.001 * v),
        ];
        standPos.push(p[0], p[1], p[2]);
        standUv.push(i / segs, v);
      }
    }
    const stride = segs + 1;
    for (let r = 0; r < standRows; r++) {
      for (let i = 0; i < segs; i++) {
        const a = r * stride + i;
        const b = a + 1;
        const d = (r + 1) * stride + i;
        const e = d + 1;
        standIdx.push(a, b, e, a, e, d);
      }
    }
    const sPosArr = new Float32Array(standPos);
    const sUvArr = new Float32Array(standUv);
    const sIdxArr = new Uint32Array(standIdx);
    parts.push({
      positions: sPosArr,
      normals: computeNormals(sPosArr, sIdxArr),
      uvs: sUvArr,
      indices: sIdxArr,
    });

    // 2. Smooth Folded Polo Collar Wings (continuous elliptical neck base, zero spikes/z-fighting)
    const wingPos = [];
    const wingUv = [];
    const wingIdx = [];
    const wingRows = 7;
    const wingSegs = 56;
    for (let r = 0; r <= wingRows; r++) {
      const v = r / wingRows; // 0 = top fold crease, 1 = outer edge
      for (let i = 0; i <= wingSegs; i++) {
        const frac = i / wingSegs; // 0 = front-left edge of placket, 0.5 = back center, 1 = front-right edge
        const a = 0.58 * Math.PI + frac * (1.84 * Math.PI);
        const base = evalNeckPoint(a, collarType);
        const outDir = normalize([base[0], 0, base[2]]);

        // Slightly longer collar points near front tips, neat compact width around back
        const edgeDist = Math.abs(frac - 0.5) * 2; // 0 at back center, 1 at front tips
        const collarWidth = 0.052 + 0.02 * smoothstep(0.45, 1.0, edgeDist);

        // Smooth outward arch and drape down over the collar stand
        const outDist = 0.006 + collarWidth * (0.28 * Math.sin(v * Math.PI * 0.5) + 0.52 * v);
        const foldArcY = 0.036 + 0.009 * Math.sin(v * Math.PI * 0.45) - collarWidth * 0.75 * Math.pow(v, 1.15);

        const p = [
          base[0] + outDir[0] * outDist,
          base[1] + foldArcY,
          base[2] + outDir[2] * outDist,
        ];
        wingPos.push(p[0], p[1], p[2]);
        wingUv.push(frac, 1 - v);
      }
    }
    const wStride = wingSegs + 1;
    for (let r = 0; r < wingRows; r++) {
      for (let i = 0; i < wingSegs; i++) {
        const a = r * wStride + i;
        const b = a + 1;
        const d = (r + 1) * wStride + i;
        const e = d + 1;
        // Single clean outward-facing winding (material is DoubleSide, so zero z-fighting!)
        wingIdx.push(a, d, e, a, e, b);
      }
    }
    const wPosArr = new Float32Array(wingPos);
    const wUvArr = new Float32Array(wingUv);
    const wIdxArr = new Uint32Array(wingIdx);
    parts.push({
      positions: wPosArr,
      normals: computeNormals(wPosArr, wIdxArr),
      uvs: wUvArr,
      indices: wIdxArr,
    });

    // 3. Front Polo Placket strip + 2 sculpted buttons
    const placketTop = evalTorsoPoint(0, 0.99, true, collarType, 0.008);
    parts.push(
      buildBox(
        0,
        placketTop[1] - 0.058,
        placketTop[2] + 0.013,
        0.038,
        0.132,
        0.01,
      ),
    );
    parts.push(
      buildBox(0, placketTop[1] - 0.028, placketTop[2] + 0.02, 0.01, 0.01, 0.005),
    );
    parts.push(
      buildBox(0, placketTop[1] - 0.082, placketTop[2] + 0.02, 0.01, 0.01, 0.005),
    );
  }

  return mergePrimitives(parts);
}

function buildBox(cx, cy, cz, w, h, d) {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const faces = [
    // +Z
    {
      n: [0, 0, 1],
      v: [
        [cx - hw, cy - hh, cz + hd],
        [cx + hw, cy - hh, cz + hd],
        [cx + hw, cy + hh, cz + hd],
        [cx - hw, cy + hh, cz + hd],
      ],
    },
    // -Z
    {
      n: [0, 0, -1],
      v: [
        [cx + hw, cy - hh, cz - hd],
        [cx - hw, cy - hh, cz - hd],
        [cx - hw, cy + hh, cz - hd],
        [cx + hw, cy + hh, cz - hd],
      ],
    },
    // +X
    {
      n: [1, 0, 0],
      v: [
        [cx + hw, cy - hh, cz + hd],
        [cx + hw, cy - hh, cz - hd],
        [cx + hw, cy + hh, cz - hd],
        [cx + hw, cy + hh, cz + hd],
      ],
    },
    // -X
    {
      n: [-1, 0, 0],
      v: [
        [cx - hw, cy - hh, cz - hd],
        [cx - hw, cy - hh, cz + hd],
        [cx - hw, cy + hh, cz + hd],
        [cx - hw, cy + hh, cz - hd],
      ],
    },
    // +Y
    {
      n: [0, 1, 0],
      v: [
        [cx - hw, cy + hh, cz + hd],
        [cx + hw, cy + hh, cz + hd],
        [cx + hw, cy + hh, cz - hd],
        [cx - hw, cy + hh, cz - hd],
      ],
    },
    // -Y
    {
      n: [0, -1, 0],
      v: [
        [cx - hw, cy - hh, cz - hd],
        [cx + hw, cy - hh, cz - hd],
        [cx + hw, cy - hh, cz + hd],
        [cx - hw, cy - hh, cz + hd],
      ],
    },
  ];
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let vi = 0;
  for (const f of faces) {
    for (const p of f.v) {
      positions.push(p[0], p[1], p[2]);
      normals.push(f.n[0], f.n[1], f.n[2]);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
    vi += 4;
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  };
}

// ---------------------------------------------------------------------------
// Minimal Spec-Compliant glTF 2.0 (.glb) Binary Packer
// ---------------------------------------------------------------------------

function pad4(buf, padByte = 0x00) {
  const rem = buf.length % 4;
  if (rem === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - rem, padByte)]);
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
    const viewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: raw.length,
      ...(target ? { target } : {}),
    });
    binChunks.push(padded);
    byteOffset += padded.length;
    return viewIndex;
  }

  for (let mIdx = 0; mIdx < namedMeshes.length; mIdx++) {
    const { name, geometry } = namedMeshes[mIdx];
    const { positions, normals, uvs, indices } = geometry;

    // Compute POSITION min/max required by glTF 2.0 spec
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
      componentType: 5126, // FLOAT
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
      componentType: 5125, // UNSIGNED_INT
      count: indices.length,
      type: 'SCALAR',
    });

    materials.push({
      name: `${name}_mat`,
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, 1],
        metallicFactor: 0.0,
        roughnessFactor: 0.85,
      },
      doubleSided: true,
    });

    meshes.push({
      name,
      primitives: [
        {
          attributes: {
            POSITION: posAcc,
            NORMAL: normAcc,
            TEXCOORD_0: uvAcc,
          },
          indices: idxAcc,
          material: mIdx,
        },
      ],
    });

    nodes.push({
      name,
      mesh: mIdx,
    });
  }

  const binBuffer = Buffer.concat(binChunks);

  const gltf = {
    asset: {
      version: '2.0',
      generator: 'KitForge 3D Jersey Generator',
    },
    scene: 0,
    scenes: [
      {
        name: 'JerseyRoot',
        nodes: nodes.map((_, idx) => idx),
      },
    ],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [
      {
        byteLength: binBuffer.length,
      },
    ],
  };

  const jsonBuffer = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const totalLength = 12 + 8 + jsonBuffer.length + 8 + binBuffer.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4); // version 2
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuffer.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binBuffer.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"

  return Buffer.concat([
    header,
    jsonChunkHeader,
    jsonBuffer,
    binChunkHeader,
    binBuffer,
  ]);
}

// ---------------------------------------------------------------------------
// Generate All 6 Variants
// ---------------------------------------------------------------------------

function generateVariant(sleeveLength, collarType, filename) {
  const front = buildTorsoPanel(true, collarType);
  const back = buildTorsoPanel(false, collarType);
  const left = buildSleeveAndCuff(1, sleeveLength);
  const right = buildSleeveAndCuff(-1, sleeveLength);
  const collar = mergePrimitives([
    buildCollar(collarType),
    buildInnerLining(collarType),
  ]);
  const cuffs = mergePrimitives([
    left.cuff,
    right.cuff,
    buildBottomHemTrim(collarType),
  ]);

  const glb = packGlb([
    { name: 'panel_front', geometry: front },
    { name: 'panel_back', geometry: back },
    { name: 'panel_sleeve_left', geometry: left.sleeve },
    { name: 'panel_sleeve_right', geometry: right.sleeve },
    { name: 'panel_collar', geometry: collar },
    { name: 'panel_cuffs', geometry: cuffs },
  ]);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, glb);
  console.log(`Generated ${filename} (${(glb.length / 1024).toFixed(1)} KB)`);
}

const variants = [
  ['long', 'v-neck', 'jersey-long-vneck.glb'],
];

for (const [sleeve, collar, file] of variants) {
  generateVariant(sleeve, collar, file);
}
console.log('Procedural long-sleeve V-neck .glb generated (jersey-short-vneck.glb preserved from CLO3D source).');
