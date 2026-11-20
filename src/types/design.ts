export type Language = 'id' | 'en';
export type ThemeMode = 'dark' | 'light';
export type ViewportLayout = 'split' | '3d' | '2d';

export type SportType = 'football' | 'futsal' | 'volleyball';
export type SleeveLength = 'short' | 'long';
export type CollarType = 'v-neck';
export type FabricType = 'milano' | 'mesh' | 'smooth';

export type PanelId =
  | 'front'
  | 'back'
  | 'leftSleeve'
  | 'rightSleeve'
  | 'collar'
  | 'cuffs';

export type EditablePanelId = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

export type PatternType =
  | 'solid'
  | 'vertical-stripes'
  | 'horizontal-hoops'
  | 'diagonal-sash'
  | 'chevron'
  | 'gradient'
  | 'geometric-hex'
  | 'half-split'
  | 'pinstripes'
  | 'lightning-wave';

export interface PanelPattern {
  type: PatternType;
  color: string;
  secondaryColor: string;
  scale: number; // 0.5 - 3
  rotation: number; // -180 to 180 deg
  opacity: number; // 0 - 1
}

export interface PanelConfig {
  baseColor: string;
  pattern: PanelPattern;
}

export type LayerKind = 'image' | 'text';

export interface BaseLayer {
  id: string;
  panelId: EditablePanelId;
  kind: LayerKind;
  name: string;
  x: number; // normalized center 0..1 (left to right)
  y: number; // normalized center 0..1 (top to bottom)
  scaleX: number; // normalized fraction of canvas width (for image) or scale factor
  scaleY: number; // normalized fraction of canvas height (for image) or scale factor
  rotation: number; // degrees
  opacity: number; // 0..1
  flipX: boolean;
  flipY: boolean;
  visible: boolean;
  locked: boolean;
}

export interface ImageLayer extends BaseLayer {
  kind: 'image';
  assetId: string;
  aspectRatio: number; // naturalWidth / naturalHeight
}

export interface TextLayer extends BaseLayer {
  kind: 'text';
  text: string;
  fontFamily: string;
  fontSize: number; // relative to 1024px canvas (e.g. 48 - 260)
  fill: string;
  stroke: string;
  strokeWidth: number;
  letterSpacing: number;
  uppercase: boolean;
}

export type DesignLayer = ImageLayer | TextLayer;

export interface UploadedAsset {
  id: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  dataUrl: string;
  createdAt: number;
}

export interface ProductionBrief {
  customerName: string;
  teamName: string;
  sport: SportType;
  fabricOption: string;
  quantity: number;
  notes: string;
}

export interface JerseyDesignState {
  projectName: string;
  sport: SportType;
  sleeveLength: SleeveLength;
  collarType: CollarType;
  fabricType: FabricType;
  panels: Record<PanelId, PanelConfig>;
  layers: DesignLayer[];
  brief: ProductionBrief;
}

export interface SerializedJerseyProject {
  version: 1;
  exportedAt: string;
  brand: string;
  design: JerseyDesignState;
  assets: UploadedAsset[];
}

export type CameraPreset = 'front' | 'back' | 'left' | 'right' | 'collar' | 'iso';

export interface ModelPanelMeta {
  meshName: string;
  safeZone: {
    left: number; // 0..1
    top: number; // 0..1
    width: number; // 0..1
    height: number; // 0..1
  };
}

export interface JerseyModelEntry {
  id: string;
  sleeveLength: SleeveLength;
  collarType: CollarType;
  glbPath: string;
  panels: Record<PanelId, ModelPanelMeta>;
}
