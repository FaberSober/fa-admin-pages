import * as Sentry from '@sentry/react';
import { Button, Result } from 'antd';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface TabErrorBoundaryProps {
  children: ReactNode;
  /** 重新加载当前 Tab，由 MenuLayout 注入（调用 reloadTab 使 key 变化重建边界与内容） */
  onReload?: () => void;
}

interface TabErrorBoundaryState {
  error: Error | null;
}

/**
 * Tab 内容区错误边界：页面异常时仅在当前 Tab 内容区展示兜底，不影响顶栏/侧边菜单/Tab 栏等框架布局。
 *
 * 捕获范围：
 * 1. 渲染期错误 —— 通过 getDerivedStateFromError / componentDidCatch（React ErrorBoundary 原生能力）。
 * 2. useEffect / cleanup / 异步 / 事件处理器中的错误 —— React ErrorBoundary 天然不捕获，
 *    通过 window.onerror + unhandledrejection 全局监听兜底（本组件挂载时监听、卸载时移除，
 *    因按 Tab key 隔离，同一时刻只有当前 Tab 的边界实例在监听）。
 *
 * 需按 Tab 隔离使用：外层以 `tabKey-版本号` 作为 key，切换 Tab 或重新加载时边界随之重建。
 * 内层边界截获后错误不再冒泡到根级 Sentry 边界，因此需主动上报 Sentry。
 */
export default class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = {
    error: null,
  };

  /** 同步标志，防止 setState 生效前连续多个错误重复处理 */
  private handling = false;

  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.handling = true;
    Sentry.captureException(error);
    if (import.meta.env.DEV) {
      console.error('[TabErrorBoundary] 页面渲染异常', error, info);
    }
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleWindowError = (event: ErrorEvent) => {
    if (this.handling || this.state.error) return;
    this.handling = true;
    const err = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error');
    this.setState({ error: err });
    Sentry.captureException(err);
    if (import.meta.env.DEV) {
      console.error('[TabErrorBoundary] 捕获到未处理异常（useEffect/异步/事件）', err);
    }
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (this.handling || this.state.error) return;
    this.handling = true;
    const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.setState({ error: err });
    Sentry.captureException(err);
    if (import.meta.env.DEV) {
      console.error('[TabErrorBoundary] 捕获到未处理 Promise 拒绝', err);
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Result
          status="error"
          title="页面渲染异常"
          subTitle="当前页面发生未处理异常，请重新加载后重试。"
          extra={
            <Button type="primary" onClick={this.props.onReload}>
              重新加载当前页
            </Button>
          }
        />
      </div>
    );
  }
}
