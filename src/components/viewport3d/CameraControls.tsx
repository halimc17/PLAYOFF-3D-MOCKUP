import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useDesignStore } from '../../store/useDesignStore';
import type { CameraPreset } from '../../types/design';
import { registerSnapshotCapture } from '../../engine/snapshotBridge';

const PRESET_VECTORS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  front: { pos: [0, 0.03, 2.08], target: [0, 0.0, 0] },
  back: { pos: [0, 0.03, -2.08], target: [0, 0.0, 0] },
  left: { pos: [2.08, 0.03, 0], target: [0, 0.0, 0] },
  right: { pos: [-2.08, 0.03, 0], target: [0, 0.0, 0] },
  collar: { pos: [0, 0.54, 0.96], target: [0, 0.34, 0] },
  iso: { pos: [1.38, 0.25, 1.55], target: [0, 0.0, 0] },
};

export function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraPreset = useDesignStore((s) => s.cameraPreset);
  const cameraTrigger = useDesignStore((s) => s.cameraTrigger);
  const autoRotate = useDesignStore((s) => s.autoRotate);
  const autoRotateSpeed = useDesignStore((s) => s.autoRotateSpeed);

  const { camera, gl, scene } = useThree();

  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookRef = useRef<THREE.Vector3 | null>(null);
  const animatingRef = useRef(false);

  // Trigger smooth camera glide when preset button is clicked
  useEffect(() => {
    if (cameraTrigger === 0) return;
    const preset = PRESET_VECTORS[cameraPreset];
    if (!preset) return;
    targetPosRef.current = new THREE.Vector3(...preset.pos);
    targetLookRef.current = new THREE.Vector3(...preset.target);
    animatingRef.current = true;
  }, [cameraPreset, cameraTrigger]);

  // Cancel animation if user grabs orbit controls manually
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const stopAnim = () => {
      animatingRef.current = false;
    };
    ctrl.addEventListener('start', stopAnim);
    return () => {
      ctrl.removeEventListener('start', stopAnim);
    };
  }, []);

  useFrame((_, delta) => {
    if (!animatingRef.current || !targetPosRef.current || !targetLookRef.current) {
      return;
    }
    const ctrl = controlsRef.current;
    const t = Math.min(1, delta * 7);
    camera.position.lerp(targetPosRef.current, t);
    if (ctrl) {
      ctrl.target.lerp(targetLookRef.current, t);
      ctrl.update();
    }
    if (camera.position.distanceTo(targetPosRef.current) < 0.015) {
      camera.position.copy(targetPosRef.current);
      if (ctrl) {
        ctrl.target.copy(targetLookRef.current);
        ctrl.update();
      }
      animatingRef.current = false;
    }
  });

  // Register 4-angle offscreen snapshot capture for Production Tech Pack / ZIP Export
  useEffect(() => {
    registerSnapshotCapture(async () => {
      const ctrl = controlsRef.current;
      const savedPos = camera.position.clone();
      const savedTarget = ctrl ? ctrl.target.clone() : new THREE.Vector3(0, 0, 0);
      const savedAutoRotate = ctrl ? ctrl.autoRotate : false;
      animatingRef.current = false;
      if (ctrl) ctrl.autoRotate = false;

      const snapAngle = (pos: [number, number, number]): string => {
        camera.position.set(pos[0], pos[1], pos[2]);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      };

      const front = snapAngle([0, 0.02, 1.95]);
      const back = snapAngle([0, 0.02, -1.95]);
      const left = snapAngle([1.95, 0.02, 0]);
      const right = snapAngle([-1.95, 0.02, 0]);

      // Restore user camera view cleanly
      camera.position.copy(savedPos);
      if (ctrl) {
        ctrl.target.copy(savedTarget);
        ctrl.autoRotate = savedAutoRotate;
        ctrl.update();
      }
      gl.render(scene, camera);

      return { front, back, left, right };
    });

    return () => {
      registerSnapshotCapture(null);
    };
  }, [camera, gl, scene]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      minDistance={0.85}
      maxDistance={3.2}
      minPolarAngle={0.35}
      maxPolarAngle={Math.PI - 0.35}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed === 2 ? 3.6 : 1.8}
      dampingFactor={0.08}
      enableDamping
    />
  );
}
