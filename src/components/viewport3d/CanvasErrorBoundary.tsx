import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  language: 'id' | 'en';
}

interface State {
  hasError: boolean;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Error captured for recovery UI.
  }

  render() {
    if (this.state.hasError) {
      const isId = this.props.language === 'id';
      return (
        <div
          role="alert"
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isId
              ? 'Preview 3D gagal dimuat pada browser ini.'
              : 'The 3D preview failed to load in this browser.'}
          </p>
          <p className="max-w-sm text-xs text-slate-600 dark:text-slate-400">
            {isId
              ? 'Pastikan akselerasi perangkat keras (WebGL) aktif, atau coba muat ulang viewport 3D.'
              : 'Check that hardware acceleration (WebGL) is enabled, or reload the 3D viewport.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isId ? 'Muat Ulang 3D' : 'Reload 3D View'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
