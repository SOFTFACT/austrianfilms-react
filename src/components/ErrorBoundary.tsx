import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'

interface BoundaryProps {
  /** Changing it clears a caught error, so navigating away recovers. */
  resetKey: string
  children: ReactNode
}

interface BoundaryState {
  error: Error | null
  resetKey: string
}

/**
 * Catches render errors below the router. Without it a single bad value in an
 * API answer unmounts the whole tree and leaves a blank page. The declarative
 * <Routes> router has no errorElement, hence a class boundary.
 */
class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error }
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState): Partial<BoundaryState> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    return this.state.error ? <ErrorFallback error={this.state.error} /> : this.props.children
  }
}

/** Resets on every path change, so a link out of the broken page works. */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <Boundary resetKey={pathname}>{children}</Boundary>
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-svh flex items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center space-y-3">
        <TriangleAlert className="h-10 w-10 mx-auto text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          This page could not be displayed. Reloading usually helps; if it keeps happening, please contact support.
        </p>
        <p className="text-xs text-muted-foreground break-words">{error.message}</p>
        <div className="flex items-center justify-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
          <a href={import.meta.env.BASE_URL} className="rounded-md border border-border px-4 py-2 text-sm">
            Go to start page
          </a>
        </div>
      </div>
    </div>
  )
}
