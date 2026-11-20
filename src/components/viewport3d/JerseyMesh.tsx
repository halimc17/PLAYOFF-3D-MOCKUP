import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import {
  getJerseyModel,
  resolvePanelFromMeshName,
} from '../../config/modelManifest';
import { useDesignStore } from '../../store/useDesignStore';
import type { EditablePanelId, PanelId } from '../../types/design';
import { renderPanelToCanvas } from '../../engine/textureCompositor';
import {
  getFabricBumpTexture,
  getFabricMaterialProps,
} from '../../engine/fabricTextures';

const ALL_PANELS: PanelId[] = [
  'front',
  'back',
  'leftSleeve',
  'rightSleeve',
  'collar',
  'cuffs',
];

function isEditable(panel: PanelId): panel is EditablePanelId {
  return (
    panel === 'front' ||
    panel === 'back' ||
    panel === 'leftSleeve' ||
    panel === 'rightSleeve'
  );
}

export function JerseyMesh() {
  const design = useDesignStore((s) => s.design);
  const assets = useDesignStore((s) => s.assets);
  const activePanel = useDesignStore((s) => s.activePanel);
  const placeOn3DMode = useDesignStore((s) => s.placeOn3DMode);
  const setActivePanel = useDesignStore((s) => s.setActivePanel);
  const setSelectedLayerId = useDesignStore((s) => s.setSelectedLayerId);
  const moveSelectedLayerToUV = useDesignStore((s) => s.moveSelectedLayerToUV);

  const [hoveredPanel, setHoveredPanel] = useState<PanelId | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const modelEntry = useMemo(
    () => getJerseyModel(design.sleeveLength, design.collarType),
    [design.sleeveLength, design.collarType],
  );

  const gltf = useGLTF(modelEntry.glbPath);

  // Clone scene so materials are isolated per instance
  const sceneClone = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // Persistent Canvas + CanvasTexture pool per panel (zero leak on edits)
  const panelTextures = useMemo(() => {
    const map = {} as Record<
      PanelId,
      { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }
    >;
    for (const pid of ALL_PANELS) {
      const size = pid === 'collar' || pid === 'cuffs' ? 512 : 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.flipY = true;
      map[pid] = { canvas, texture };
    }
    return map;
  }, []);

  // Dispose textures only when unmounting completely
  useEffect(() => {
    return () => {
      for (const pid of ALL_PANELS) {
        panelTextures[pid].texture.dispose();
      }
    };
  }, [panelTextures]);

  // Fabric bump texture & material properties
  const bumpTexture = useMemo(
    () => getFabricBumpTexture(design.fabricType),
    [design.fabricType],
  );
  const fabricProps = useMemo(
    () => getFabricMaterialProps(design.fabricType),
    [design.fabricType],
  );

  // Create/update materials for each mesh in the loaded .glb
  const materialsByPanel = useMemo(() => {
    const mats = {} as Record<PanelId, THREE.MeshPhysicalMaterial>;
    for (const pid of ALL_PANELS) {
      mats[pid] = new THREE.MeshPhysicalMaterial({
        map: panelTextures[pid].texture,
        bumpMap: bumpTexture,
        bumpScale: fabricProps.bumpScale,
        roughness: fabricProps.roughness,
        metalness: 0.02,
        sheen: fabricProps.sheen,
        sheenRoughness: 0.65,
        sheenColor: new THREE.Color('#ffffff'),
        side: THREE.DoubleSide,
      });
    }
    return mats;
  }, [panelTextures, bumpTexture, fabricProps]);

  useEffect(() => {
    return () => {
      for (const pid of ALL_PANELS) {
        materialsByPanel[pid].dispose();
      }
    };
  }, [materialsByPanel]);

  // Bind materials to loaded .glb meshes
  useEffect(() => {
    sceneClone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const pid = resolvePanelFromMeshName(modelEntry, mesh.name);
        if (pid) {
          mesh.material = materialsByPanel[pid];
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.panelId = pid;
        }
      }
    });
  }, [sceneClone, modelEntry, materialsByPanel]);

  // Subtle hover/active highlight via emissive
  useEffect(() => {
    for (const pid of ALL_PANELS) {
      const mat = materialsByPanel[pid];
      if (hoveredPanel === pid) {
        mat.emissive.set('#10b981');
        mat.emissiveIntensity = placeOn3DMode ? 0.16 : 0.08;
      } else if (activePanel === pid && placeOn3DMode) {
        mat.emissive.set('#10b981');
        mat.emissiveIntensity = 0.05;
      } else {
        mat.emissive.set('#000000');
        mat.emissiveIntensity = 0;
      }
    }
  }, [hoveredPanel, activePanel, placeOn3DMode, materialsByPanel]);

  // Update cursor feedback
  useEffect(() => {
    if (hoveredPanel) {
      document.body.style.cursor = placeOn3DMode ? 'crosshair' : 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hoveredPanel, placeOn3DMode]);

  // Re-render textures whenever design or uploaded assets change
  useEffect(() => {
    let cancelled = false;
    const renderAll = async () => {
      await Promise.all(
        ALL_PANELS.map(async (pid) => {
          const { canvas, texture } = panelTextures[pid];
          const size = pid === 'collar' || pid === 'cuffs' ? 512 : 1024;
          await renderPanelToCanvas(canvas, pid, design, assets, size);
          if (!cancelled) {
            texture.needsUpdate = true;
          }
        }),
      );
    };
    renderAll();
    return () => {
      cancelled = true;
    };
  }, [design, assets, panelTextures]);

  // Re-render once Google Fonts finish loading so athletic typography is crisp immediately
  useEffect(() => {
    let active = true;
    document.fonts?.ready.then(() => {
      if (!active) return;
      ALL_PANELS.forEach(async (pid) => {
        const { canvas, texture } = panelTextures[pid];
        const size = pid === 'collar' || pid === 'cuffs' ? 512 : 1024;
        await renderPanelToCanvas(canvas, pid, useDesignStore.getState().design, useDesignStore.getState().assets, size);
        texture.needsUpdate = true;
      });
    });
    return () => {
      active = false;
    };
  }, [panelTextures]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Ignore orbit drag releases
    if (pointerDownRef.current) {
      const dist = Math.hypot(
        e.clientX - pointerDownRef.current.x,
        e.clientY - pointerDownRef.current.y,
      );
      if (dist > 6) return;
    }

    const panelId = e.object.userData.panelId as PanelId | undefined;
    if (!panelId) return;

    if (placeOn3DMode && isEditable(panelId) && e.uv) {
      moveSelectedLayerToUV(panelId, e.uv.x, e.uv.y);
      return;
    }

    setActivePanel(panelId);

    // Hit-test visible layers on this panel using UV coordinates
    if (isEditable(panelId) && e.uv) {
      const clickX = e.uv.x;
      const clickY = 1 - e.uv.y;
      const panelLayers = design.layers
        .filter((l) => l.panelId === panelId && l.visible)
        .reverse();

      const hit = panelLayers.find((layer) => {
        const halfW =
          layer.kind === 'image'
            ? Math.max(0.06, layer.scaleX / 2)
            : Math.max(0.14, (layer.fontSize / 1024) * layer.text.length * 0.28);
        const halfH =
          layer.kind === 'image'
            ? Math.max(0.06, layer.scaleY / 2)
            : Math.max(0.06, (layer.fontSize / 1024) * 0.65);
        return (
          Math.abs(clickX - layer.x) <= halfW &&
          Math.abs(clickY - layer.y) <= halfH
        );
      });

      if (hit) {
        setSelectedLayerId(hit.id);
      }
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const panelId = e.object.userData.panelId as PanelId | undefined;
    if (panelId) setHoveredPanel(panelId);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredPanel(null);
  };

  return (
    <group position={[0, 0.02, 0]}>
      <primitive
        object={sceneClone}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    </group>
  );
}
