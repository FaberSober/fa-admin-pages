import { telemetry } from '@features/fa-admin-pages/telemetry';
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
 * 仅捕获当前 React 子树的渲染和生命周期异常。
 * 全局运行时异常和 Promise rejection 由 Telemetry SDK 上报，不据此替换当前页面。
 * 全局错误无法可靠归属当前 Tab，可能来自第三方脚本或其他业务任务。
 *
 * 需按 Tab 隔离使用：外层以 `tabKey-版本号` 作为 key，切换 Tab 或重新加载时边界随之重建。
 * 内层边界截获后的渲染异常需主动交给 Telemetry 上报；全局异常由 Telemetry SDK 统一监听。
 */
export default class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    telemetry.captureException(error, { react: { componentStack: info.componentStack } });
    if (import.meta.env.DEV) {
      console.error('[TabErrorBoundary] 页面渲染异常', error, info);
    }
  }

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
