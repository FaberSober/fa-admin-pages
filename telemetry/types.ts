export type TelemetryClientType = 'WEB' | 'DESKTOP' | 'MOBILE' | 'OTHER';

export type TelemetryEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface TelemetryUser {
  userId?: string;
  tenantId?: string;
}

export interface TelemetryInitOptions {
  appKey: string;
  clientType: TelemetryClientType;
  environment: TelemetryEnvironment;
  release: string;
  context?: TelemetryContext;
}

export interface TelemetryContext {
  url?: string;
  route?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  viewport?: string;
  [key: string]: unknown;
}

/** Desktop/WebView 客户端可选的运行环境上下文。 */
export interface TelemetryDesktopContext extends TelemetryContext {
  platform?: string;
  osVersion?: string;
  arch?: string;
  appVersion?: string;
  tauriVersion?: string;
  runtime?: 'desktop';
}

export interface TelemetryBasePayload {
  appKey: string;
  clientType: TelemetryClientType;
  environment: TelemetryEnvironment;
  release: string;
  sessionId: string;
  userId?: string;
  tenantId?: string;
  occurTime: string;
  context: TelemetryContext;
}

export interface TelemetryBreadcrumb {
  type: 'PAGE' | 'BUSINESS' | 'CLICK' | 'NAVIGATION' | 'HTTP' | 'CUSTOM' | 'ERROR';
  time: string;
  data?: Record<string, unknown>;
}

export interface TelemetryErrorPayload extends TelemetryBasePayload {
  errorType: string;
  message: string;
  stack?: string;
  breadcrumbs: TelemetryBreadcrumb[];
}

export type TelemetryEventType = 'LOGIN' | 'PAGE_VIEW' | 'ACTION' | 'BUSINESS';

export interface TelemetryEventPayload extends TelemetryBasePayload {
  eventType: TelemetryEventType;
  eventCode: string;
  module?: string;
  bizType?: string;
  bizId?: string;
  result?: string;
  duration?: number;
  properties?: Record<string, unknown>;
}
