import type { TelemetryContext } from './types';

function userAgentValue(pattern: RegExp): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.userAgent.match(pattern)?.[1];
}

export function getWebTelemetryContext(): TelemetryContext {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }
  const browser = /Edg\//.test(navigator.userAgent) ? 'Edge'
    : /Chrome\//.test(navigator.userAgent) ? 'Chrome'
      : /Firefox\//.test(navigator.userAgent) ? 'Firefox'
        : /Safari\//.test(navigator.userAgent) ? 'Safari'
          : undefined;
  const browserVersion = userAgentValue(/(?:Edg|Chrome|Firefox|Version)\/([\d.]+)/);
  const os = /Windows/.test(navigator.userAgent) ? 'Windows'
    : /Mac OS X/.test(navigator.userAgent) ? 'macOS'
      : /Android/.test(navigator.userAgent) ? 'Android'
        : /iPhone|iPad/.test(navigator.userAgent) ? 'iOS'
          : /Linux/.test(navigator.userAgent) ? 'Linux'
            : undefined;

  return {
    // 查询字符串可能包含一次性凭据或敏感筛选条件，Telemetry 默认不采集。
    url: `${window.location.origin}${window.location.pathname}`,
    route: window.location.pathname,
    browser,
    browserVersion,
    os,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}
