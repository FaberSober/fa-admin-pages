import FallbackComponent from '@features/fa-admin-pages/components/exception/FallbackComponent';
import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { initializeTelemetry, telemetry } from './bootstrap';
import { TelemetryErrorBoundary } from './error-boundary';

interface TelemetryProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/** 管理端 Web Telemetry 宿主：初始化 SDK 并隔离根级渲染异常。 */
export function TelemetryProvider({ children, fallback = <FallbackComponent /> }: TelemetryProviderProps) {
  initializeTelemetry();

  return <TelemetryErrorBoundary fallback={fallback}>{children}</TelemetryErrorBoundary>;
}

/** 在 Router 内挂载一次页面浏览埋点。 */
export function TelemetryPageTracker({ children }: { children: ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    telemetry.page();
  }, [location.pathname, location.search]);

  return children;
}
