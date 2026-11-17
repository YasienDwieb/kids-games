import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from './report';

type Props = {
  /** Reported as `app_error.where` (`app`, `game:<id>`, `flow:<id>`, `3d:<id>`). */
  where: string;
  /** Shown instead of the children once they throw; a function gets `reset` to try again. */
  fallback: ReactNode | ((reset: () => void) => ReactNode);
  onError?: (error: unknown) => void;
  children?: ReactNode;
};

type State = { failed: boolean };

/**
 * Catches errors thrown while rendering its children, reports them and shows
 * `fallback` instead of letting React Native close the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, _info: ErrorInfo) {
    reportError(error, this.props.where);
    this.props.onError?.(error);
  }

  reset = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === 'function' ? fallback(this.reset) : fallback;
  }
}
