import { create } from 'zustand';
import type {
  CameraPreset,
  CollarType,
  DesignLayer,
  EditablePanelId,
  FabricType,
  ImageLayer,
  JerseyDesignState,
  Language,
  PanelId,
  PanelPattern,
  ProductionBrief,
  SleeveLength,
  SportType,
  TextLayer,
  ThemeMode,
  UploadedAsset,
  ViewportLayout,
} from '../types/design';
import { brandConfig } from '../config/brandConfig';
import { loadActiveProjectFromDB, saveActiveProjectToDB } from './storage';

export type SidebarTab = 'modelColor' | 'pattern' | 'graphics' | 'text' | 'layers';

const MAX_HISTORY = 40;

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function createDefaultDesign(): JerseyDesignState {
  const basePattern: PanelPattern = {
    type: 'solid',
    color: '#10b981',
    secondaryColor: '#0284c7',
    scale: 1,
    rotation: 0,
    opacity: 0.9,
  };

  return {
    projectName: 'Garuda Pro Kit 2026',
    sport: 'football',
    sleeveLength: 'short',
    collarType: 'v-neck',
    fabricType: 'milano',
    panels: {
      front: {
        baseColor: '#0f172a',
        pattern: {
          type: 'chevron',
          color: '#10b981',
          secondaryColor: '#0ea5e9',
          scale: 1,
          rotation: 0,
          opacity: 0.85,
        },
      },
      back: {
        baseColor: '#0f172a',
        pattern: { ...basePattern },
      },
      leftSleeve: {
        baseColor: '#0f172a',
        pattern: { ...basePattern },
      },
      rightSleeve: {
        baseColor: '#0f172a',
        pattern: { ...basePattern },
      },
      collar: {
        baseColor: '#10b981',
        pattern: { ...basePattern },
      },
      cuffs: {
        baseColor: '#10b981',
        pattern: { ...basePattern },
      },
    },
    layers: [
      {
        id: 'starter_team',
        panelId: 'front',
        kind: 'text',
        name: 'Nama Tim (Dada)',
        text: 'KITFORGE FC',
        fontFamily: brandConfig.sportFonts[0].family,
        fontSize: 82,
        fill: '#ffffff',
        stroke: '#0f172a',
        strokeWidth: 6,
        letterSpacing: 4,
        uppercase: true,
        x: 0.5,
        y: 0.42,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        flipX: false,
        flipY: false,
        visible: true,
        locked: false,
      },
      {
        id: 'starter_back_name',
        panelId: 'back',
        kind: 'text',
        name: 'Nama Punggung',
        text: 'PRATAMA',
        fontFamily: brandConfig.sportFonts[2].family,
        fontSize: 78,
        fill: '#ffffff',
        stroke: '#0f172a',
        strokeWidth: 5,
        letterSpacing: 6,
        uppercase: true,
        x: 0.5,
        y: 0.24,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        flipX: false,
        flipY: false,
        visible: true,
        locked: false,
      },
      {
        id: 'starter_back_num',
        panelId: 'back',
        kind: 'text',
        name: 'Nomor Punggung',
        text: '10',
        fontFamily: brandConfig.sportFonts[0].family,
        fontSize: 280,
        fill: '#ffffff',
        stroke: '#10b981',
        strokeWidth: 10,
        letterSpacing: 4,
        uppercase: true,
        x: 0.5,
        y: 0.52,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        flipX: false,
        flipY: false,
        visible: true,
        locked: false,
      },
    ],
    brief: {
      customerName: '',
      teamName: 'KitForge FC',
      sport: 'football',
      fabricOption: brandConfig.fabricCatalog[0].label,
      quantity: 15,
      notes: '',
    },
  };
}

function isEditablePanel(panel: PanelId): panel is EditablePanelId {
  return (
    panel === 'front' ||
    panel === 'back' ||
    panel === 'leftSleeve' ||
    panel === 'rightSleeve'
  );
}

function cloneDesign(d: JerseyDesignState): JerseyDesignState {
  return JSON.parse(JSON.stringify(d)) as JerseyDesignState;
}

const initialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem('kitforge-theme');
  return stored === 'light' ? 'light' : 'dark';
};

const initialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'id';
  const stored = window.localStorage.getItem('kitforge-lang');
  return stored === 'en' ? 'en' : 'id';
};

interface DesignStore {
  design: JerseyDesignState;
  assets: UploadedAsset[];
  past: JerseyDesignState[];
  future: JerseyDesignState[];

  // UI & Workspace State
  activePanel: PanelId;
  activeEditablePanel: EditablePanelId;
  selectedLayerId: string | null;
  activeTab: SidebarTab;
  viewportLayout: ViewportLayout;
  theme: ThemeMode;
  language: Language;
  cameraPreset: CameraPreset;
  cameraTrigger: number;
  autoRotate: boolean;
  autoRotateSpeed: 1 | 2;
  placeOn3DMode: boolean;
  exportModalOpen: boolean;
  hydrated: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';

  // Hydration & Persistence
  hydrate: () => Promise<void>;
  loadSerializedProject: (design: JerseyDesignState, assets: UploadedAsset[]) => void;
  resetDesign: () => void;

  // UI Actions
  setActivePanel: (panel: PanelId) => void;
  setSelectedLayerId: (id: string | null) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setViewportLayout: (layout: ViewportLayout) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setAutoRotate: (enabled: boolean) => void;
  setAutoRotateSpeed: (speed: 1 | 2) => void;
  setPlaceOn3DMode: (enabled: boolean) => void;
  setExportModalOpen: (open: boolean) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Design Mutations (all recorded in history)
  setProjectName: (name: string) => void;
  setSport: (sport: SportType) => void;
  setSleeveLength: (sleeve: SleeveLength) => void;
  setCollarType: (collar: CollarType) => void;
  setFabricType: (fabric: FabricType) => void;
  setBrief: (patch: Partial<ProductionBrief>) => void;

  setPanelBaseColor: (panel: PanelId, color: string) => void;
  applyBaseColorToAll: (color: string, clearPatterns?: boolean) => void;
  setPanelPattern: (panel: PanelId, patch: Partial<PanelPattern>) => void;
  applyPatternToBodyAndSleeves: (pattern: PanelPattern) => void;

  // Assets & Layers
  addUploadedAsset: (asset: UploadedAsset) => void;
  removeUploadedAsset: (assetId: string) => void;
  addImageLayer: (assetId: string, panelId?: EditablePanelId) => string | null;
  addTextLayer: (
    options: Partial<Omit<TextLayer, 'id' | 'kind'>> & { text: string },
  ) => string;
  addQuickTextPreset: (
    preset: 'teamName' | 'backName' | 'backNumber' | 'chestNumber',
  ) => void;
  updateLayer: (
    layerId: string,
    patch: Partial<DesignLayer>,
    recordHistory?: boolean,
  ) => void;
  moveSelectedLayerToUV: (panelId: EditablePanelId, u: number, v: number) => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  mirrorLayerToOppositeSleeve: (layerId: string) => void;
  centerLayer: (layerId: string) => void;
  reorderLayer: (layerId: string, direction: 'up' | 'down') => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(get: () => DesignStore, set: (partial: Partial<DesignStore>) => void) {
  set({ saveStatus: 'saving' });
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { design, assets } = get();
    try {
      await saveActiveProjectToDB(design, assets);
      set({ saveStatus: 'saved' });
    } catch {
      set({ saveStatus: 'idle' });
    }
  }, 450);
}

export const useDesignStore = create<DesignStore>((set, get) => {
  const commit = (
    updater: (draft: JerseyDesignState) => JerseyDesignState,
    recordHistory = true,
  ) => {
    const current = get().design;
    const next = updater(cloneDesign(current));
    if (recordHistory) {
      const nextPast = [...get().past, current].slice(-MAX_HISTORY);
      set({ design: next, past: nextPast, future: [] });
    } else {
      set({ design: next });
    }
    scheduleSave(get, set);
  };

  return {
    design: createDefaultDesign(),
    assets: [],
    past: [],
    future: [],

    activePanel: 'front',
    activeEditablePanel: 'front',
    selectedLayerId: null,
    activeTab: 'modelColor',
    viewportLayout: 'split',
    theme: initialTheme(),
    language: initialLanguage(),
    cameraPreset: 'front',
    cameraTrigger: 0,
    autoRotate: false,
    autoRotateSpeed: 1,
    placeOn3DMode: false,
    exportModalOpen: false,
    hydrated: false,
    saveStatus: 'idle',

    hydrate: async () => {
      const record = await loadActiveProjectFromDB();
      if (record && record.design && record.design.panels) {
        const normalized: JerseyDesignState = {
          ...record.design,
          collarType: 'v-neck',
        };
        set({
          design: normalized,
          assets: Array.isArray(record.assets) ? record.assets : [],
          hydrated: true,
          saveStatus: 'saved',
        });
      } else {
        set({ hydrated: true });
      }
    },

    loadSerializedProject: (design, assets) => {
      const normalized = cloneDesign(design);
      normalized.collarType = 'v-neck';
      set({
        design: normalized,
        assets: [...assets],
        past: [],
        future: [],
        selectedLayerId: null,
      });
      scheduleSave(get, set);
    },

    resetDesign: () => {
      const prev = get().design;
      const fresh = createDefaultDesign();
      set({
        design: fresh,
        past: [...get().past, prev].slice(-MAX_HISTORY),
        future: [],
        selectedLayerId: null,
        activePanel: 'front',
        activeEditablePanel: 'front',
      });
      scheduleSave(get, set);
    },

    setActivePanel: (panel) => {
      const patch: Partial<DesignStore> = { activePanel: panel };
      if (isEditablePanel(panel)) {
        patch.activeEditablePanel = panel;
        // Clear selection if selected layer belongs to another panel
        const currentSelected = get().design.layers.find(
          (l) => l.id === get().selectedLayerId,
        );
        if (currentSelected && currentSelected.panelId !== panel) {
          patch.selectedLayerId = null;
        }
      }
      set(patch);
    },

    setSelectedLayerId: (id) => {
      if (!id) {
        set({ selectedLayerId: null });
        return;
      }
      const layer = get().design.layers.find((l) => l.id === id);
      if (layer) {
        set({
          selectedLayerId: id,
          activePanel: layer.panelId,
          activeEditablePanel: layer.panelId,
        });
      } else {
        set({ selectedLayerId: null });
      }
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setViewportLayout: (layout) => set({ viewportLayout: layout }),

    toggleTheme: () => {
      const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('kitforge-theme', next);
      set({ theme: next });
    },

    toggleLanguage: () => {
      const next: Language = get().language === 'id' ? 'en' : 'id';
      window.localStorage.setItem('kitforge-lang', next);
      set({ language: next });
    },

    setCameraPreset: (preset) =>
      set((s) => ({ cameraPreset: preset, cameraTrigger: s.cameraTrigger + 1 })),

    setAutoRotate: (enabled) => set({ autoRotate: enabled }),
    setAutoRotateSpeed: (speed) => set({ autoRotateSpeed: speed, autoRotate: true }),
    setPlaceOn3DMode: (enabled) => set({ placeOn3DMode: enabled }),
    setExportModalOpen: (open) => set({ exportModalOpen: open }),

    undo: () => {
      const { past, design, future } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        design: previous,
        past: past.slice(0, -1),
        future: [design, ...future].slice(0, MAX_HISTORY),
      });
      scheduleSave(get, set);
    },

    redo: () => {
      const { past, design, future } = get();
      if (future.length === 0) return;
      const next = future[0];
      set({
        design: next,
        past: [...past, design].slice(-MAX_HISTORY),
        future: future.slice(1),
      });
      scheduleSave(get, set);
    },

    setProjectName: (name) =>
      commit((d) => {
        d.projectName = name;
        return d;
      }, false),

    setSport: (sport) =>
      commit((d) => {
        d.sport = sport;
        d.brief.sport = sport;
        return d;
      }),

    setSleeveLength: (sleeve) =>
      commit((d) => {
        d.sleeveLength = sleeve;
        return d;
      }),

    setCollarType: (collar) =>
      commit((d) => {
        d.collarType = collar;
        return d;
      }),

    setFabricType: (fabric) =>
      commit((d) => {
        d.fabricType = fabric;
        return d;
      }),

    setBrief: (patch) =>
      commit((d) => {
        d.brief = { ...d.brief, ...patch };
        return d;
      }, false),

    setPanelBaseColor: (panel, color) =>
      commit((d) => {
        d.panels[panel].baseColor = color;
        return d;
      }),

    applyBaseColorToAll: (color, clearPatterns = false) =>
      commit((d) => {
        (Object.keys(d.panels) as PanelId[]).forEach((p) => {
          d.panels[p].baseColor = color;
          if (clearPatterns) {
            d.panels[p].pattern.type = 'solid';
          }
        });
        return d;
      }),

    setPanelPattern: (panel, patch) =>
      commit((d) => {
        d.panels[panel].pattern = { ...d.panels[panel].pattern, ...patch };
        return d;
      }),

    applyPatternToBodyAndSleeves: (pattern) =>
      commit((d) => {
        (['front', 'back', 'leftSleeve', 'rightSleeve'] as PanelId[]).forEach(
          (p) => {
            d.panels[p].pattern = { ...pattern };
          },
        );
        return d;
      }),

    addUploadedAsset: (asset) => {
      set((s) => ({ assets: [asset, ...s.assets] }));
      scheduleSave(get, set);
    },

    removeUploadedAsset: (assetId) => {
      set((s) => ({
        assets: s.assets.filter((a) => a.id !== assetId),
      }));
      commit((d) => {
        d.layers = d.layers.filter(
          (l) => !(l.kind === 'image' && l.assetId === assetId),
        );
        return d;
      });
    },

    addImageLayer: (assetId, panelOverride) => {
      const asset = get().assets.find((a) => a.id === assetId);
      if (!asset) return null;
      const panelId = panelOverride ?? get().activeEditablePanel;
      const id = uid('img');
      const aspectRatio = asset.width > 0 && asset.height > 0 ? asset.width / asset.height : 1;
      const defaultWidth = panelId === 'leftSleeve' || panelId === 'rightSleeve' ? 0.34 : 0.24;
      const layer: ImageLayer = {
        id,
        panelId,
        kind: 'image',
        name: asset.name,
        assetId: asset.id,
        aspectRatio,
        x: 0.5,
        y: panelId === 'front' ? 0.34 : 0.45,
        scaleX: defaultWidth,
        scaleY: defaultWidth / aspectRatio,
        rotation: 0,
        opacity: 1,
        flipX: false,
        flipY: false,
        visible: true,
        locked: false,
      };
      commit((d) => {
        d.layers.push(layer);
        return d;
      });
      set({
        selectedLayerId: id,
        activePanel: panelId,
        activeEditablePanel: panelId,
      });
      return id;
    },

    addTextLayer: (options) => {
      const panelId = options.panelId ?? get().activeEditablePanel;
      const id = uid('txt');
      const layer: TextLayer = {
        id,
        panelId,
        kind: 'text',
        name: options.name ?? options.text.slice(0, 20),
        text: options.text,
        fontFamily: options.fontFamily ?? brandConfig.sportFonts[0].family,
        fontSize: options.fontSize ?? 92,
        fill: options.fill ?? '#ffffff',
        stroke: options.stroke ?? '#0f172a',
        strokeWidth: options.strokeWidth ?? 5,
        letterSpacing: options.letterSpacing ?? 3,
        uppercase: options.uppercase ?? true,
        x: options.x ?? 0.5,
        y: options.y ?? 0.42,
        scaleX: options.scaleX ?? 1,
        scaleY: options.scaleY ?? 1,
        rotation: options.rotation ?? 0,
        opacity: options.opacity ?? 1,
        flipX: false,
        flipY: false,
        visible: true,
        locked: false,
      };
      commit((d) => {
        d.layers.push(layer);
        return d;
      });
      set({
        selectedLayerId: id,
        activePanel: panelId,
        activeEditablePanel: panelId,
      });
      return id;
    },

    addQuickTextPreset: (preset) => {
      const { addTextLayer, setCameraPreset } = get();
      if (preset === 'teamName') {
        addTextLayer({
          panelId: 'front',
          name: 'Nama Tim (Dada)',
          text: 'GARUDA UNITED',
          fontFamily: brandConfig.sportFonts[0].family,
          fontSize: 78,
          fill: '#ffffff',
          stroke: '#0f172a',
          strokeWidth: 5,
          x: 0.5,
          y: 0.4,
        });
        setCameraPreset('front');
      } else if (preset === 'chestNumber') {
        addTextLayer({
          panelId: 'front',
          name: 'Nomor Dada',
          text: '10',
          fontFamily: brandConfig.sportFonts[1].family,
          fontSize: 112,
          fill: '#ffffff',
          stroke: '#0f172a',
          strokeWidth: 6,
          x: 0.5,
          y: 0.56,
        });
        setCameraPreset('front');
      } else if (preset === 'backName') {
        addTextLayer({
          panelId: 'back',
          name: 'Nama Punggung',
          text: 'PLAYER NAME',
          fontFamily: brandConfig.sportFonts[2].family,
          fontSize: 76,
          fill: '#ffffff',
          stroke: '#0f172a',
          strokeWidth: 5,
          letterSpacing: 6,
          x: 0.5,
          y: 0.24,
        });
        setCameraPreset('back');
      } else if (preset === 'backNumber') {
        addTextLayer({
          panelId: 'back',
          name: 'Nomor Punggung',
          text: '10',
          fontFamily: brandConfig.sportFonts[0].family,
          fontSize: 280,
          fill: '#ffffff',
          stroke: '#10b981',
          strokeWidth: 10,
          x: 0.5,
          y: 0.52,
        });
        setCameraPreset('back');
      }
    },

    updateLayer: (layerId, patch, recordHistory = true) =>
      commit((d) => {
        const idx = d.layers.findIndex((l) => l.id === layerId);
        if (idx === -1) return d;
        d.layers[idx] = { ...d.layers[idx], ...patch } as DesignLayer;
        return d;
      }, recordHistory),

    moveSelectedLayerToUV: (panelId, u, v) => {
      const selectedId = get().selectedLayerId;
      if (!selectedId) return;
      const canvasX = Math.max(0.04, Math.min(0.96, u));
      const canvasY = Math.max(0.04, Math.min(0.96, 1 - v));
      commit((d) => {
        const idx = d.layers.findIndex((l) => l.id === selectedId);
        if (idx === -1) return d;
        d.layers[idx] = {
          ...d.layers[idx],
          panelId,
          x: canvasX,
          y: canvasY,
        };
        return d;
      });
      set({
        activePanel: panelId,
        activeEditablePanel: panelId,
        placeOn3DMode: false,
      });
    },

    deleteLayer: (layerId) => {
      commit((d) => {
        d.layers = d.layers.filter((l) => l.id !== layerId);
        return d;
      });
      if (get().selectedLayerId === layerId) {
        set({ selectedLayerId: null });
      }
    },

    duplicateLayer: (layerId) => {
      const orig = get().design.layers.find((l) => l.id === layerId);
      if (!orig) return;
      const newId = uid(orig.kind === 'image' ? 'img' : 'txt');
      const copy: DesignLayer = {
        ...JSON.parse(JSON.stringify(orig)),
        id: newId,
        name: `${orig.name} (Copy)`,
        x: Math.min(0.9, orig.x + 0.05),
        y: Math.min(0.9, orig.y + 0.05),
      };
      commit((d) => {
        d.layers.push(copy);
        return d;
      });
      set({ selectedLayerId: newId });
    },

    mirrorLayerToOppositeSleeve: (layerId) => {
      const orig = get().design.layers.find((l) => l.id === layerId);
      if (!orig) return;
      if (orig.panelId !== 'leftSleeve' && orig.panelId !== 'rightSleeve') return;
      const targetPanel: EditablePanelId =
        orig.panelId === 'leftSleeve' ? 'rightSleeve' : 'leftSleeve';
      const newId = uid(orig.kind === 'image' ? 'img' : 'txt');
      const mirrored: DesignLayer = {
        ...JSON.parse(JSON.stringify(orig)),
        id: newId,
        panelId: targetPanel,
        name: `${orig.name} (${targetPanel === 'leftSleeve' ? 'L' : 'R'})`,
        x: 1 - orig.x,
      };
      commit((d) => {
        d.layers.push(mirrored);
        return d;
      });
      set({
        selectedLayerId: newId,
        activePanel: targetPanel,
        activeEditablePanel: targetPanel,
      });
    },

    centerLayer: (layerId) =>
      commit((d) => {
        const idx = d.layers.findIndex((l) => l.id === layerId);
        if (idx === -1) return d;
        d.layers[idx].x = 0.5;
        return d;
      }),

    reorderLayer: (layerId, direction) =>
      commit((d) => {
        const layer = d.layers.find((l) => l.id === layerId);
        if (!layer) return d;
        const panelIndices = d.layers
          .map((l, idx) => (l.panelId === layer.panelId ? idx : -1))
          .filter((idx) => idx !== -1);
        const pos = panelIndices.findIndex((idx) => d.layers[idx].id === layerId);
        if (pos === -1) return d;
        const swapPos = direction === 'up' ? pos + 1 : pos - 1;
        if (swapPos < 0 || swapPos >= panelIndices.length) return d;
        const idxA = panelIndices[pos];
        const idxB = panelIndices[swapPos];
        const tmp = d.layers[idxA];
        d.layers[idxA] = d.layers[idxB];
        d.layers[idxB] = tmp;
        return d;
      }),
  };
});
