import { Component, type ErrorInfo, type ReactNode } from 'react';
import { telemetry } from './index';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/** React 组件树异常捕获。 */
export class TelemetryErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    telemetry.captureException(error, { react: { componentStack: info.componentStack } });
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
