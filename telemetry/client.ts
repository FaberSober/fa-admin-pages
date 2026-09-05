import { getWebTelemetryContext } from './context';
import { TelemetryBreadcrumbBuffer } from './breadcrumb';
import { createTelemetrySessionId } from './session';
import { TelemetryUserStore } from './user';
import type { TelemetryBasePayload, TelemetryErrorPayload, TelemetryEventPayload, TelemetryEventType, TelemetryInitOptions, TelemetryUser } from './types';

/** Telemetry Phase 1 客户端基础状态；事件发送将在后续阶段接入。 */
export class TelemetryClient {
  private options?: TelemetryInitOptions;
  private sessionId?: string;
  private context?: TelemetryInitOptions['context'];
  private readonly userStore = new TelemetryUserStore();
  private readonly breadcrumbs = new TelemetryBreadcrumbBuffer();
  private globalHandlersInstalled = false;

  init(options: TelemetryInitOptions): void {
    this.options = { ...options };
    this.sessionId = createTelemetrySessionId();
    this.context = options.context;
    this.userStore.clear();
    this.breadcrumbs.add('PAGE', { route: typeof window === 'undefined' ? undefined : window.location.pathname });
    this.installGlobalErrorHandlers();
  }

  isInitialized(): boolean {
    return Boolean(this.options && this.sessionId);
  }

  /** 供后续 error/event 上报统一复用，业务模块不应直接调用 Collector HTTP API。 */
  getBasePayload(): TelemetryBasePayload {
    if (!this.options || !this.sessionId) {
      throw new Error('Telemetry 尚未初始化，请先调用 telemetry.init()');
    }
    return {
      ...this.options,
      sessionId: this.sessionId,
      ...this.userStore.get(),
      occurTime: new Date().toISOString(),
      context: { ...getWebTelemetryContext(), ...this.context },
    };
  }

  captureException(error: unknown, extraContext?: Record<string, unknown>): void {
    if (!this.isInitialized()) return;
    const normalized = normalizeError(error);
    this.breadcrumbs.add('ERROR', { errorType: normalized.errorType, message: normalized.message });
    const payload: TelemetryErrorPayload = {
      ...this.getBasePayload(),
      errorType: normalized.errorType,
      message: normalized.message,
      stack: normalized.stack,
      breadcrumbs: this.breadcrumbs.snapshot(),
    };
    if (extraContext) {
      payload.context = { ...payload.context, ...extraContext };
    }
    void this.postError(payload);
  }

  identify(user: TelemetryUser): void {
    if (this.isInitialized()) this.userStore.set(user);
  }

  clearUser(): void {
    this.userStore.clear();
  }

  /** 供同一客户端发起的业务 API 请求复用公共 Telemetry 上下文。 */
  getRequestHeaders(): Record<string, string> {
    if (!this.options || !this.sessionId) return {};
    return {
      'X-Telemetry-App-Key': this.options.appKey,
      'X-Telemetry-Client-Type': this.options.clientType,
      'X-Telemetry-Environment': this.options.environment,
      'X-Telemetry-Release': this.options.release,
      'X-Telemetry-Session-Id': this.sessionId,
    };
  }

  page(properties?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    this.track('page.view', {
      eventType: 'PAGE_VIEW',
      module: window.location.pathname.split('/').filter(Boolean)[1],
      properties: { route: window.location.pathname, pageTitle: document.title, ...properties },
    });
  }

  track(eventCode: string, options: Omit<Partial<TelemetryEventPayload>, keyof TelemetryBasePayload | 'eventCode'> & { eventType?: TelemetryEventType } = {}): void {
    if (!this.isInitialized()) return;
    const eventType = options.eventType || 'ACTION';
    this.breadcrumbs.add('BUSINESS', { eventCode, eventType });
    const payload: TelemetryEventPayload = { ...this.getBasePayload(), ...options, eventCode, eventType };
    void this.postEvent(payload);
  }

  private installGlobalErrorHandlers(): void {
    if (this.globalHandlersInstalled || typeof window === 'undefined') return;
    this.globalHandlersInstalled = true;
    window.addEventListener('error', (event: ErrorEvent) => {
      // 资源加载错误属于后续 Phase 规划，当前只采集携带 Error 的运行时异常。
      if (event.error) this.captureException(event.error);
    });
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.captureException(event.reason);
    });
    window.addEventListener('popstate', () => {
      this.breadcrumbs.add('NAVIGATION', { route: window.location.pathname });
    });
  }

  private async postError(payload: TelemetryErrorPayload): Promise<void> {
    if (typeof fetch === 'undefined') return;
    try {
      await fetch('/api/base/telemetry/open/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // 监控链路失败不能反向影响业务页面。
    }
  }

  private async postEvent(payload: TelemetryEventPayload): Promise<void> {
    if (typeof fetch === 'undefined') return;
    try {
      await fetch('/api/base/telemetry/open/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // 埋点失败不能反向影响业务页面。
    }
  }
}

function normalizeError(error: unknown): { errorType: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { errorType: error.name || 'Error', message: error.message || error.name, stack: error.stack };
  }
  return { errorType: 'UnhandledRejection', message: typeof error === 'string' ? error : String(error) };
}
