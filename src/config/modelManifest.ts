import type { CollarType, JerseyModelEntry, PanelId, SleeveLength } from '../types/design';

const DEFAULT_PANELS: JerseyModelEntry['panels'] = {
  front: {
    meshName: 'panel_front',
    safeZone: { left: 0.14, top: 0.14, width: 0.72, height: 0.74 },
  },
  back: {
    meshName: 'panel_back',
    safeZone: { left: 0.14, top: 0.12, width: 0.72, height: 0.76 },
  },
  leftSleeve: {
    meshName: 'panel_sleeve_left',
    safeZone: { left: 0.16, top: 0.18, width: 0.68, height: 0.64 },
  },
  rightSleeve: {
    meshName: 'panel_sleeve_right',
    safeZone: { left: 0.16, top: 0.18, width: 0.68, height: 0.64 },
  },
  collar: {
    meshName: 'panel_collar',
    safeZone: { left: 0.05, top: 0.05, width: 0.9, height: 0.9 },
  },
  cuffs: {
    meshName: 'panel_cuffs',
    safeZone: { left: 0.05, top: 0.05, width: 0.9, height: 0.9 },
  },
};

/**
 * Registry of all 3D .glb jersey models.
 * To swap in custom Blender / CLO3D models later, drop the .glb into public/models/
 * and ensure the mesh names match `panels.<panelId>.meshName` (or update them here).
 */
export const JERSEY_MODELS: JerseyModelEntry[] = [
  {
    id: 'short-v-neck',
    sleeveLength: 'short',
    collarType: 'v-neck',
    glbPath: '/models/jersey-short-vneck.glb',
    panels: DEFAULT_PANELS,
  },
  {
    id: 'long-v-neck',
    sleeveLength: 'long',
    collarType: 'v-neck',
    glbPath: '/models/jersey-long-vneck.glb',
    panels: DEFAULT_PANELS,
  },
];

export function getJerseyModel(
  sleeveLength: SleeveLength,
  collarType: CollarType,
): JerseyModelEntry {
  return (
    JERSEY_MODELS.find(
      (m) => m.sleeveLength === sleeveLength && m.collarType === collarType,
    ) ?? JERSEY_MODELS[0]
  );
}

export function resolvePanelFromMeshName(
  model: JerseyModelEntry,
  meshName: string,
): PanelId | null {
  const entries = Object.entries(model.panels) as Array<[PanelId, { meshName: string }]>;
  const exact = entries.find(([, meta]) => meta.meshName === meshName);
  if (exact) return exact[0];
  const lower = meshName.toLowerCase();
  if (lower.includes('front')) return 'front';
  if (lower.includes('back')) return 'back';
  if (lower.includes('sleeve_left') || lower.includes('leftsleeve')) return 'leftSleeve';
  if (lower.includes('sleeve_right') || lower.includes('rightsleeve')) return 'rightSleeve';
  if (lower.includes('collar') || lower.includes('placket')) return 'collar';
  if (lower.includes('cuff') || lower.includes('hem') || lower.includes('rib')) return 'cuffs';
  return null;
}
