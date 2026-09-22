import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort render boundary. The whole product is client-side generated
 * data, so a thrown render is almost always a programming bug rather than a
 * network hiccup — show a named fallback instead of a blank felt table, log
 * the detail, and let the player cold-start fresh.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Overrool] uncaught render error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="felt-bg felt-noise flex h-full flex-col items-center justify-center gap-5 px-6">
          <h1
            className="anim-slam font-display text-5xl text-cream"
            style={{ textShadow: '0 4px 0 var(--color-poker-red-deep), 0 6px 0 var(--color-ink)' }}
          >
            OVERROOL
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-widest text-cream/50">The bench hit a snag</p>
          <p className="max-w-md text-center text-[12px] text-cream/70">
            The courtroom could not be rendered. Reload to bring the record back up — nothing here is ever lost.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="btn-gold rounded-xl px-6 py-2.5 font-display text-xs uppercase tracking-wider text-ink"
          >
            Reload the bench
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}