import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Crosshair, RotateCw } from 'lucide-react';
import { JerseyMesh } from './JerseyMesh';
import { CameraControls } from './CameraControls';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { useDesignStore } from '../../store/useDesignStore';
import { translations } from '../../config/i18n';
import type { CameraPreset } from '../../types/design';

export function JerseyScene() {
  const theme = useDesignStore((s) => s.theme);
  const language = useDesignStore((s) => s.language);
  const activePanel = useDesignStore((s) => s.activePanel);
  const autoRotate = useDesignStore((s) => s.autoRotate);
  const autoRotateSpeed = useDesignStore((s) => s.autoRotateSpeed);
  const placeOn3DMode = useDesignStore((s) => s.placeOn3DMode);
  const selectedLayerId = useDesignStore((s) => s.selectedLayerId);
  const setCameraPreset = useDesignStore((s) => s.setCameraPreset);
  const setAutoRotate = useDesignStore((s) => s.setAutoRotate);
  const setAutoRotateSpeed = useDesignStore((s) => s.setAutoRotateSpeed);
  const setPlaceOn3DMode = useDesignStore((s) => s.setPlaceOn3DMode);

  const t = translations[language];

  const cameraButtons: Array<{ id: CameraPreset; label: string }> = [
    { id: 'front', label: t.controls.cameraPresets.front },
    { id: 'back', label: t.controls.cameraPresets.back },
    { id: 'left', label: t.controls.cameraPresets.left },
    { id: 'right', label: t.controls.cameraPresets.right },
    { id: 'collar', label: t.controls.cameraPresets.collar },
  ];

  const surfacePill =
    'bg-white/95 text-slate-900 border border-slate-300/80 shadow-sm dark:bg-[#131822]/95 dark:text-slate-100 dark:border-white/15';

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        theme === 'dark' ? 'studio-stage-dark' : 'studio-stage-light'
      }`}
    >
      <CanvasErrorBoundary language={language}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.03, 2.08], fov: 36, near: 0.1, far: 25 }}
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.62} />
          <hemisphereLight args={['#f8fafc', '#1e293b', 0.55]} />
          <directionalLight
            position={[2.5, 3.5, 3.2]}
            intensity={1.35}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-2.8, 2.0, -2.2]} intensity={0.85} color="#dbeafe" />
          <directionalLight position={[0, -1.5, 2.0]} intensity={0.28} />

          <Suspense fallback={null}>
            <JerseyMesh />
          </Suspense>

          <ContactShadows
            position={[0, -0.54, 0]}
            opacity={theme === 'dark' ? 0.5 : 0.26}
            scale={2.4}
            blur={2.4}
            far={1.2}
          />

          <CameraControls />
        </Canvas>
      </CanvasErrorBoundary>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${surfacePill}`}
          >
            <span className="text-slate-600 dark:text-slate-400">
              {t.common.activePanel}:
            </span>
            <span className="font-semibold text-slate-950 dark:text-white">
              {t.panels[activePanel]}
            </span>
          </div>

          {placeOn3DMode && (
            <div
              role="status"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm"
            >
              <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.controls.placeOn3DActive}</span>
            </div>
          )}
        </div>

        <span className="hidden rounded-md bg-white/85 px-2 py-0.5 text-[11px] text-slate-600 sm:inline-block dark:bg-[#131822]/85 dark:text-slate-300">
          {t.controls.click3DHint}
        </span>
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {selectedLayerId && (
          <button
            type="button"
            onClick={() => setPlaceOn3DMode(!placeOn3DMode)}
            aria-pressed={placeOn3DMode}
            aria-label={t.controls.placeOn3D}
            title={t.controls.placeOn3DHint}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              placeOn3DMode
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : `${surfacePill} hover:bg-slate-100 dark:hover:bg-[#1b2230]`
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t.controls.placeOn3D}</span>
          </button>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            aria-pressed={autoRotate}
            aria-label={t.controls.autoRotate}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              autoRotate
                ? 'bg-emerald-500 font-semibold text-slate-950'
                : `${surfacePill} hover:bg-slate-100 dark:hover:bg-[#1b2230]`
            }`}
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`}
              style={
                autoRotate
                  ? { animationDuration: autoRotateSpeed === 2 ? '1s' : '2s' }
                  : undefined
              }
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t.controls.autoRotate}</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRotateSpeed(autoRotateSpeed === 2 ? 1 : 2)}
            aria-pressed={autoRotate && autoRotateSpeed === 2}
            aria-label={
              language === 'id'
                ? `Kecepatan putar 360 derajat: ${autoRotateSpeed}x`
                : `360 rotation speed: ${autoRotateSpeed}x`
            }
            title={
              language === 'id'
                ? 'Ganti kecepatan putar (1x / 2x)'
                : 'Toggle rotation speed (1x / 2x)'
            }
            className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg px-2 py-1.5 text-xs font-bold tabular-nums transition ${
              autoRotate && autoRotateSpeed === 2
                ? 'bg-emerald-500 text-slate-950'
                : `${surfacePill} hover:bg-slate-100 dark:hover:bg-[#1b2230]`
            }`}
          >
            {autoRotateSpeed}x
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label={language === 'id' ? 'Sudut kamera 3D' : '3D camera angles'}
        className={`absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl p-1 ${surfacePill}`}
      >
        {cameraButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setCameraPreset(btn.id)}
            className="min-h-[32px] whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200/80 hover:text-slate-950 active:scale-95 dark:text-slate-200 dark:hover:bg-white/15 dark:hover:text-white"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
