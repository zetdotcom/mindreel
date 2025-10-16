import React, {
  Component,
  ReactNode,
  ErrorInfo,
  useCallback,
  useState,
} from "react";

/**
 * RouteErrorBoundary
 *
 * A lightweight error boundary intended for wrapping routed content
 * (e.g. the scrollable right-hand pane in Main layout).
 *
 * Primary goals:
 *  - Catch render-time errors in route/view components
 *  - Display a consistent fallback UI
 *  - Provide a "Try again" reset action (re-mount children)
 *  - Allow custom fallback rendering & error reporting hooks
 *
 * Usage (simple):
 *   <RouteErrorBoundary>
 *     <AppRoutes />
 *   </RouteErrorBoundary>
 *
 * Custom fallback (function form):
 *   <RouteErrorBoundary
 *     fallback={(error, reset) => (
 *       <MyFancyError error={error} onRetry={reset} />
 *     )}
 *   >
 *     <AppRoutes />
 *   </RouteErrorBoundary>
 *
 * Error reporting:
 *   <RouteErrorBoundary onError={(err, info) => sendToTelemetry(err, info)}>
 *     <AppRoutes />
 *   </RouteErrorBoundary>
 *
 * HOC helper (wrap a specific routed view):
 *   export default withRouteErrorBoundary(HistoryPageView);
 *
 * Notes:
 *  - This boundary only catches errors in render / lifecycle of its subtree.
 *  - It does NOT catch async errors in promises, event handlers, or effects.
 *    Handle those at the feature layer and surface via state/UI.
 */

export interface RouteErrorBoundaryProps {
  children: ReactNode;
  /**
   * Fallback UI. If a ReactNode, it is rendered as-is.
   * If a function, it receives (error, reset) and should return ReactNode.
   */
  fallback?:
    | ReactNode
    | ((error: Error, reset: () => void) => ReactNode);
  /**
   * Hook for side-effect reporting (telemetry, logging, etc.).
   */
  onError?(error: Error, info: ErrorInfo): void;
  /**
   * Called after reset() is invoked.
   */
  onReset?(): void;
  /**
   * Optional className for outer wrapper.
   */
  className?: string;
}

interface RouteErrorBoundaryState {
  error: Error | null;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, info);
    } else {
      // Default logging; keep noise minimal.
      // eslint-disable-next-line no-console
      console.error("RouteErrorBoundary caught error:", error, info);
    }
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    const { children, fallback, className } = this.props;

    if (error) {
      if (typeof fallback === "function") {
        return fallback(error, this.reset);
      }
      if (fallback) {
        return fallback;
      }
      return (
        <DefaultFallback error={error} onRetry={this.reset} className={className} />
      );
    }

    return children;
  }
}

/**
 * Default fallback UI providing minimal, accessible feedback.
 */
function DefaultFallback({
  error,
  onRetry,
  className,
}: {
  error: Error;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={
        className ??
        "flex flex-col gap-4 p-6 m-6 rounded-md border border-destructive/50 bg-destructive/10 max-w-xl"
      }
    >
      <div>
        <h2 className="text-lg font-semibold text-destructive mb-1">
          Something went wrong
        </h2>
        <p className="text-sm text-destructive/80 leading-relaxed">
          {error.message || "Unexpected render failure."}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">
            Technical details
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-snug">
            {error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
}

/**
 * HOC to wrap a component with RouteErrorBoundary.
 * Useful for quickly protecting a single route element.
 */
export function withRouteErrorBoundary<P extends object>(
  Wrapped: React.ComponentType<P>,
  boundaryProps?: Omit<RouteErrorBoundaryProps, "children">
) {
  const ComponentWithBoundary = (props: P) => (
    <RouteErrorBoundary {...boundaryProps}>
      <Wrapped {...props} />
    </RouteErrorBoundary>
  );
  ComponentWithBoundary.displayName = `WithRouteErrorBoundary(${
    Wrapped.displayName || Wrapped.name || "Component"
  })`;
  return ComponentWithBoundary;
}

/**
 * Hook-based lightweight local boundary (alternative pattern).
 * This does NOT replace the class boundary but demonstrates a pattern
 * for re-mounting a subtree when local errors occur in events/effects.
 *
 * Usage:
 *   const { error, setError, reset, Wrapper } = useLocalRenderBoundary();
 *   return (
 *     <Wrapper>
 *       <ProblemChild onFatal={(e) => setError(e)} />
 *     </Wrapper>
 *   );
 */
export function useLocalRenderBoundary() {
  const [error, setError] = useState<Error | null>(null);
  const reset = useCallback(() => setError(null), []);
  const Wrapper = useCallback(
    ({ children }: { children: ReactNode }) =>
      error ? (
        <DefaultFallback error={error} onRetry={reset} />
      ) : (
        <>{children}</>
      ),
    [error, reset],
  );
  return { error, setError, reset, Wrapper };
}
