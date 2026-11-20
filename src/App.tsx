import { useEffect } from 'react';
import { useDesignStore } from './store/useDesignStore';
import { TopBar } from './components/layout/TopBar';
import { ToolSidebar } from './components/layout/ToolSidebar';
import { ExportModal } from './components/layout/ExportModal';
import { JerseyScene } from './components/viewport3d/JerseyScene';
import { PanelCanvas2D } from './components/editor2d/PanelCanvas2D';

export function App() {
  const theme = useDesignStore((s) => s.theme);
  const viewportLayout = useDesignStore((s) => s.viewportLayout);
  const hydrate = useDesignStore((s) => s.hydrate);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);

  // Hydrate saved project & assets from IndexedDB
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Apply Dark/Light theme class to root html element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Global keyboard shortcuts (Undo, Redo, Delete selected layer)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useDesignStore.getState();
        if (state.selectedLayerId) {
          e.preventDefault();
          state.deleteLayer(state.selectedLayerId);
        }
      } else if (e.key === 'Escape') {
        const state = useDesignStore.getState();
        if (state.placeOn3DMode) {
          state.setPlaceOn3DMode(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  // On small mobile screens, treat "split" gracefully as 3D view (user can switch to 2D via top bar)
  const show3D = viewportLayout === 'split' || viewportLayout === '3d';
  const show2D = viewportLayout === 'split' || viewportLayout === '2d';

  return (
    <div className="flex h-full w-full flex-col bg-slate-100 text-slate-900 dark:bg-[#0b0e13] dark:text-slate-100">
      <TopBar />

      <div className="flex min-h-0 flex-1 overflow-hidden pb-14 lg:pb-0">
        <ToolSidebar />

        {/* Hybrid 3D + 2D Workspace */}
        <main className="flex min-w-0 flex-1 flex-col md:flex-row">
          {show3D && (
            <section
              className={`relative min-h-0 flex-1 ${
                viewportLayout === 'split'
                  ? 'h-full md:w-[56%] md:flex-none md:border-r md:border-slate-200 dark:md:border-white/10'
                  : 'h-full w-full'
              }`}
            >
              <JerseyScene />
            </section>
          )}

          {show2D && (
            <section
              className={`relative min-h-0 flex-1 ${
                viewportLayout === 'split'
                  ? 'hidden h-full md:flex md:w-[44%] md:flex-none'
                  : 'flex h-full w-full'
              }`}
            >
              <PanelCanvas2D />
            </section>
          )}
        </main>
      </div>

      <ExportModal />
    </div>
  );
}

export default App;
