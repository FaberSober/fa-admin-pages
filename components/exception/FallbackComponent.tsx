import { Button, Result } from 'antd';

/**
 * 框架级兜底组件：应用根级（Sentry.ErrorBoundary）捕获到框架自身异常时整屏展示，属于最后防线。
 * 常规页面异常由 TabErrorBoundary 在 Tab 内容区内隔离，不会走到这里。
 */
export default function FallbackComponent() {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--fa-bg-grey, #f5f5f5)',
      }}
    >
      <Result
        status="error"
        title="系统发生异常"
        subTitle="应用遇到未处理的异常，请刷新页面后重试。"
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        }
      />
    </div>
  );
}
