import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Select, Tag, type SelectProps } from 'antd';
import type { Admin } from '@features/fa-admin-pages/types';
import { telemetryAppApi } from '@features/fa-admin-pages/services';

export const issueStatuses = [
  { value: 'OPEN', label: '待处理', color: 'red', action: '打开' },
  { value: 'RESOLVED', label: '已解决', color: 'green', action: '解决' },
  { value: 'IGNORED', label: '已忽略', color: 'default', action: '忽略' },
] as const;
export const clientTypes = [
  { value: 'WEB', label: '网页端' }, { value: 'DESKTOP', label: '桌面端' },
  { value: 'MOBILE', label: '移动端' }, { value: 'OTHER', label: '其他' },
];
export const environments = [
  { value: 'development', label: '开发环境' }, { value: 'test', label: '测试环境' },
  { value: 'staging', label: '预发布环境' }, { value: 'production', label: '生产环境' },
];
export const eventTypes = [
  { value: 'LOGIN', label: '登录' }, { value: 'PAGE_VIEW', label: '页面浏览' },
  { value: 'ACTION', label: '用户操作' }, { value: 'BUSINESS', label: '业务事件' },
];
export function telemetryLabel(options: readonly { value: string; label: string }[], value?: string) {
  return options.find(option => option.value === value)?.label ?? value ?? '—';
}
export function TelemetryIssueStatusTag({ status }: { status: string }) {
  const option = issueStatuses.find(item => item.value === status);
  return <Tag color={option?.color}>{option?.label ?? status}</Tag>;
}

interface AppContextValue {
  apps: Admin.TelemetryApp[];
  loading: boolean;
  failed: boolean;
  reload: () => void;
}
const AppContext = createContext<AppContextValue | undefined>(undefined);

/** 每个列表共享一次应用请求，表格行和详情只读取映射，不单独请求。 */
export function TelemetryAppProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<Admin.TelemetryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);
  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);
    try {
      const response = await telemetryAppApi.list({});
      if (response.status !== 200) throw new Error(response.message);
      if (id === requestId.current) setApps(response.data || []);
    } catch {
      if (id === requestId.current) { setApps([]); setFailed(true); }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);
  useEffect(() => { void reload(); return () => { requestId.current++; }; }, [reload]);
  const value = useMemo(() => ({ apps, loading, failed, reload }), [apps, loading, failed, reload]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApps() {
  const context = useContext(AppContext);
  if (!context) throw new Error('Telemetry 应用组件需放在 TelemetryAppProvider 内');
  return context;
}

export function TelemetryAppSelect(props: SelectProps<number>) {
  const { apps, loading, failed, reload } = useApps();
  return <Select<number> allowClear showSearch optionFilterProp="label" placeholder="全部应用" style={{ width: 240 }}
    loading={loading} options={apps.map(app => ({ value: app.id, label: `${app.appName}（${app.appCode}）${app.enabled ? '' : ' · 已停用'}` }))}
    notFoundContent={loading ? '正在加载应用…' : failed ? <Button type="link" onClick={reload}>应用加载失败，点击重试</Button> : '暂无应用'}
    onOpenChange={open => { if (open && !loading) reload(); }} {...props} />;
}

export function TelemetryAppName({ appId }: { appId: number }) {
  const { apps } = useApps();
  const app = apps.find(item => item.id === appId);
  return <span title={`应用 ID：${appId}`}>{app ? `${app.appName}（${app.appCode}）` : `应用 #${appId}`}</span>;
}
